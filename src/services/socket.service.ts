import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';
import { logger } from '@/utils';
import { ApiError } from '@/shared/errors';
import { IJwtPayload } from '@/types';
import { UserService } from '@/app/modules/user/user.service';

export interface AuthenticatedSocket extends Socket {
  user?: IJwtPayload;
}

export interface SocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
  room?: string;
}

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  room: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
}

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set of rooms
  private roomUsers: Map<string, Set<string>> = new Map(); // roomId -> Set of userIds

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('Socket.IO service initialized successfully');
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as IJwtPayload;
        
        // Verify user exists and is active
        const user = await UserService.getUserById(decoded.userId);
        if (!user || !user.isEmailVerified) {
          return next(new Error('User not found or inactive'));
        }

        socket.user = decoded;
        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.user!.userId;
    
    logger.info(`User ${userId} connected with socket ${socket.id}`);
    
    // Store user connection
    this.connectedUsers.set(userId, socket.id);
    
    // Join user to their personal room
    socket.join(`user:${userId}`);
    
    // Emit user online status
    this.broadcastUserStatus(userId, 'online');

    // Setup event listeners
    this.setupSocketEventListeners(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketEventListeners(socket: AuthenticatedSocket): void {
    const userId = socket.user!.userId;

    // Join room
    socket.on('join-room', (roomId: string) => {
      this.joinRoom(socket, roomId);
    });

    // Leave room
    socket.on('leave-room', (roomId: string) => {
      this.leaveRoom(socket, roomId);
    });

    // Send message to room
    socket.on('send-message', (data: { room: string; content: string; type?: string }) => {
      this.handleMessage(socket, data);
    });

    // Send private message
    socket.on('private-message', (data: { recipientId: string; content: string; type?: string }) => {
      this.sendPrivateMessage(socket, data);
    });

    // Typing indicators
    socket.on('typing-start', (data: { room: string }) => {
      socket.to(data.room).emit('user-typing', { userId, isTyping: true });
    });

    socket.on('typing-stop', (data: { room: string }) => {
      socket.to(data.room).emit('user-typing', { userId, isTyping: false });
    });

    // Get online users
    socket.on('get-online-users', () => {
      const onlineUsers = Array.from(this.connectedUsers.keys());
      socket.emit('online-users', onlineUsers);
    });

    // Get room users
    socket.on('get-room-users', (roomId: string) => {
      const roomUsers = this.roomUsers.get(roomId) || new Set();
      socket.emit('room-users', { roomId, users: Array.from(roomUsers) });
    });

    // Handle custom events
    socket.on('custom-event', (data: any) => {
      this.handleCustomEvent(socket, data);
    });
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socket: AuthenticatedSocket): void {
    const userId = socket.user!.userId;
    
    logger.info(`User ${userId} disconnected`);
    
    // Remove user from connected users
    this.connectedUsers.delete(userId);
    
    // Remove user from all rooms
    const userRooms = this.userRooms.get(userId) || new Set();
    userRooms.forEach(roomId => {
      const roomUsers = this.roomUsers.get(roomId);
      if (roomUsers) {
        roomUsers.delete(userId);
        if (roomUsers.size === 0) {
          this.roomUsers.delete(roomId);
        } else {
          // Notify room users about user leaving
          this.io.to(roomId).emit('user-left', { userId, roomId });
        }
      }
    });
    
    // Clear user rooms
    this.userRooms.delete(userId);
    
    // Emit user offline status
    this.broadcastUserStatus(userId, 'offline');
  }

  /**
   * Join a room
   */
  private joinRoom(socket: AuthenticatedSocket, roomId: string): void {
    const userId = socket.user!.userId;
    
    socket.join(roomId);
    
    // Track user rooms
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);
    
    // Track room users
    if (!this.roomUsers.has(roomId)) {
      this.roomUsers.set(roomId, new Set());
    }
    this.roomUsers.get(roomId)!.add(userId);
    
    // Notify room users
    socket.to(roomId).emit('user-joined', { userId, roomId });
    
    logger.info(`User ${userId} joined room ${roomId}`);
  }

  /**
   * Leave a room
   */
  private leaveRoom(socket: AuthenticatedSocket, roomId: string): void {
    const userId = socket.user!.userId;
    
    socket.leave(roomId);
    
    // Remove from tracking
    const userRooms = this.userRooms.get(userId);
    if (userRooms) {
      userRooms.delete(roomId);
    }
    
    const roomUsers = this.roomUsers.get(roomId);
    if (roomUsers) {
      roomUsers.delete(userId);
      if (roomUsers.size === 0) {
        this.roomUsers.delete(roomId);
      }
    }
    
    // Notify room users
    socket.to(roomId).emit('user-left', { userId, roomId });
    
    logger.info(`User ${userId} left room ${roomId}`);
  }

  /**
   * Handle room message
   */
  private async handleMessage(socket: AuthenticatedSocket, data: { room: string; content: string; type?: string }): Promise<void> {
    const userId = socket.user!.userId;
    
    try {
      // Get user details
      const user = await UserService.getUserById(userId);
      
      const message: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: data.content,
        senderId: userId,
        senderName: user.name,
        room: data.room,
        timestamp: new Date(),
        type: (data.type as any) || 'text'
      };
      
      // Broadcast message to room
      this.io.to(data.room).emit('new-message', message);
      
      logger.info(`Message sent to room ${data.room} by user ${userId}`);
    } catch (error) {
      logger.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Send private message
   */
  private async sendPrivateMessage(socket: AuthenticatedSocket, data: { recipientId: string; content: string; type?: string }): Promise<void> {
    const senderId = socket.user!.userId;
    
    try {
      const sender = await UserService.getUserById(senderId);
      const recipientSocketId = this.connectedUsers.get(data.recipientId);
      
      const message: ChatMessage = {
        id: `pm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: data.content,
        senderId,
        senderName: sender.name,
        room: 'private',
        timestamp: new Date(),
        type: (data.type as any) || 'text'
      };
      
      // Send to recipient if online
      if (recipientSocketId) {
        this.io.to(recipientSocketId).emit('private-message', message);
      }
      
      // Send confirmation to sender
      socket.emit('message-sent', { messageId: message.id, delivered: !!recipientSocketId });
      
      logger.info(`Private message sent from ${senderId} to ${data.recipientId}`);
    } catch (error) {
      logger.error('Error sending private message:', error);
      socket.emit('error', { message: 'Failed to send private message' });
    }
  }

  /**
   * Handle custom events
   */
  private handleCustomEvent(socket: AuthenticatedSocket, data: any): void {
    const userId = socket.user!.userId;
    
    // Emit custom event with user context
    socket.broadcast.emit('custom-event', {
      ...data,
      userId,
      timestamp: new Date()
    });
    
    logger.info(`Custom event handled for user ${userId}:`, data.type);
  }

  /**
   * Broadcast user status
   */
  private broadcastUserStatus(userId: string, status: 'online' | 'offline'): void {
    this.io.emit('user-status', { userId, status, timestamp: new Date() });
  }

  /**
   * Send notification to user
   */
  public sendNotificationToUser(userId: string, notification: NotificationData): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', {
        ...notification,
        timestamp: new Date()
      });
      logger.info(`Notification sent to user ${userId}`);
    }
  }

  /**
   * Send notification to room
   */
  public sendNotificationToRoom(roomId: string, notification: NotificationData): void {
    this.io.to(roomId).emit('notification', {
      ...notification,
      timestamp: new Date()
    });
    logger.info(`Notification sent to room ${roomId}`);
  }

  /**
   * Broadcast notification to all users
   */
  public broadcastNotification(notification: NotificationData): void {
    this.io.emit('notification', {
      ...notification,
      timestamp: new Date()
    });
    logger.info('Notification broadcasted to all users');
  }

  /**
   * Send real-time update to user
   */
  public sendUpdateToUser(userId: string, updateType: string, data: any): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('real-time-update', {
        type: updateType,
        data,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get online users
   */
  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Check if user is online
   */
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get room users
   */
  public getRoomUsers(roomId: string): string[] {
    const roomUsers = this.roomUsers.get(roomId);
    return roomUsers ? Array.from(roomUsers) : [];
  }

  /**
   * Force disconnect user
   */
  public disconnectUser(userId: string, reason?: string): void {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.emit('force-disconnect', { reason: reason || 'Disconnected by server' });
        socket.disconnect(true);
        logger.info(`User ${userId} forcefully disconnected: ${reason}`);
      }
    }
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Export singleton instance (will be initialized in server.ts)
export let socketService: SocketService;

export const initializeSocketService = (httpServer: HttpServer): SocketService => {
  socketService = new SocketService(httpServer);
  return socketService;
};

export default SocketService;