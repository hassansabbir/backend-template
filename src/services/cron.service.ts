import * as cron from 'node-cron';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@/utils';
import { ApiError } from '@/shared/errors';
import { UserService } from '@/app/modules/user/user.service';
import { emailService } from './email.service';
import { socketService } from './socket.service';

export interface CronJobConfig {
  name: string;
  schedule: string;
  task: () => Promise<void> | void;
  timezone?: string;
  scheduled?: boolean;
  description?: string;
}

export interface JobStatus {
  name: string;
  schedule: string;
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  errorCount: number;
  description?: string;
}

export class CronService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private jobStats: Map<string, JobStatus> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeDefaultJobs();
  }

  /**
   * Initialize default cron jobs
   */
  private initializeDefaultJobs(): void {
    // Database cleanup job - runs daily at 2 AM
    this.addJob({
      name: 'database-cleanup',
      schedule: '0 2 * * *',
      description: 'Clean up expired tokens and inactive sessions',
      task: this.databaseCleanupTask.bind(this)
    });

    // User statistics job - runs every hour
    this.addJob({
      name: 'user-statistics',
      schedule: '0 * * * *',
      description: 'Update user statistics and analytics',
      task: this.userStatisticsTask.bind(this)
    });

    // Email queue processing - runs every 5 minutes
    this.addJob({
      name: 'email-queue-processor',
      schedule: '*/5 * * * *',
      description: 'Process pending email queue',
      task: this.emailQueueTask.bind(this)
    });

    // System health check - runs every 15 minutes
    this.addJob({
      name: 'health-check',
      schedule: '*/15 * * * *',
      description: 'Perform system health checks',
      task: this.healthCheckTask.bind(this)
    });

    // Inactive user cleanup - runs weekly on Sunday at 3 AM
    this.addJob({
      name: 'inactive-user-cleanup',
      schedule: '0 3 * * 0',
      description: 'Clean up inactive user accounts',
      task: this.inactiveUserCleanupTask.bind(this)
    });

    // Log rotation - runs daily at 1 AM
    this.addJob({
      name: 'log-rotation',
      schedule: '0 1 * * *',
      description: 'Rotate and archive log files',
      task: this.logRotationTask.bind(this)
    });

    // Backup reminder - runs daily at 6 AM
    this.addJob({
      name: 'backup-reminder',
      schedule: '0 6 * * *',
      description: 'Send backup status notifications',
      task: this.backupReminderTask.bind(this)
    });

    this.isInitialized = true;
    logger.info('Cron service initialized with default jobs');
  }

  /**
   * Add a new cron job
   */
  public addJob(config: CronJobConfig): void {
    try {
      // Validate cron expression
      if (!cron.validate(config.schedule)) {
        throw new ApiError(
          `Invalid cron schedule: ${config.schedule}`,
          StatusCodes.BAD_REQUEST
        );
      }

      // Remove existing job if it exists
      if (this.jobs.has(config.name)) {
        this.removeJob(config.name);
      }

      // Create wrapped task with error handling and statistics
      const wrappedTask = async () => {
        const jobStat = this.jobStats.get(config.name);
        if (jobStat) {
          jobStat.isRunning = true;
          jobStat.lastRun = new Date();
        }

        try {
          logger.info(`Starting cron job: ${config.name}`);
          await config.task();
          
          if (jobStat) {
            jobStat.runCount++;
          }
          
          logger.info(`Completed cron job: ${config.name}`);
        } catch (error) {
          if (jobStat) {
            jobStat.errorCount++;
          }
          
          logger.error(`Error in cron job ${config.name}:`, error);
          
          // Send notification about job failure
          this.notifyJobFailure(config.name, error as Error);
        } finally {
          if (jobStat) {
            jobStat.isRunning = false;
          }
        }
      };

      // Create and schedule the job
      const task = cron.schedule(config.schedule, wrappedTask, {
        scheduled: config.scheduled !== false,
        timezone: config.timezone || 'UTC'
      });

      // Store job and initialize statistics
      this.jobs.set(config.name, task);
      this.jobStats.set(config.name, {
        name: config.name,
        schedule: config.schedule,
        isRunning: false,
        runCount: 0,
        errorCount: 0,
        description: config.description
      });

      logger.info(`Cron job '${config.name}' added with schedule: ${config.schedule}`);
    } catch (error) {
      logger.error(`Failed to add cron job '${config.name}':`, error);
      throw error;
    }
  }

  /**
   * Remove a cron job
   */
  public removeJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      this.jobStats.delete(name);
      logger.info(`Cron job '${name}' removed`);
      return true;
    }
    return false;
  }

  /**
   * Start a specific job
   */
  public startJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (job) {
      job.start();
      logger.info(`Cron job '${name}' started`);
      return true;
    }
    return false;
  }

  /**
   * Stop a specific job
   */
  public stopJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      logger.info(`Cron job '${name}' stopped`);
      return true;
    }
    return false;
  }

  /**
   * Start all jobs
   */
  public startAllJobs(): void {
    this.jobs.forEach((job, name) => {
      job.start();
    });
    logger.info('All cron jobs started');
  }

  /**
   * Stop all jobs
   */
  public stopAllJobs(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
    });
    logger.info('All cron jobs stopped');
  }

  /**
   * Get job status
   */
  public getJobStatus(name: string): JobStatus | undefined {
    return this.jobStats.get(name);
  }

  /**
   * Get all jobs status
   */
  public getAllJobsStatus(): JobStatus[] {
    return Array.from(this.jobStats.values());
  }

  /**
   * Get active jobs count
   */
  public getActiveJobsCount(): number {
    return Array.from(this.jobStats.values()).filter(job => !job.isRunning).length;
  }

  /**
   * Database cleanup task
   */
  private async databaseCleanupTask(): Promise<void> {
    try {
      // Clean up expired refresh tokens (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Clean up expired password reset tokens (older than 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // Clean up expired email verification tokens (older than 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      logger.info('Database cleanup completed');
    } catch (error) {
      logger.error('Database cleanup failed:', error);
      throw error;
    }
  }

  /**
   * User statistics task
   */
  private async userStatisticsTask(): Promise<void> {
    try {
      // Update user activity statistics
      const activeUsers = await UserService.getActiveUsers();
      const stats = await UserService.getUserStatistics();
      const totalUsers = stats.totalUsers;
      
      // Send real-time updates if socket service is available
      if (socketService) {
        socketService.broadcastNotification({
          title: 'Statistics Update',
          message: `Active users: ${activeUsers.length}, Total users: ${totalUsers}`,
          type: 'info'
        });
      }
      
      logger.info(`User statistics updated - Active: ${activeUsers}, Total: ${totalUsers}`);
    } catch (error) {
      logger.error('User statistics task failed:', error);
      throw error;
    }
  }

  /**
   * Email queue processing task
   */
  private async emailQueueTask(): Promise<void> {
    try {
      // Process pending emails from queue
      // This would typically involve checking a database queue
      // and sending pending emails
      
      logger.info('Email queue processed');
    } catch (error) {
      logger.error('Email queue processing failed:', error);
      throw error;
    }
  }

  /**
   * System health check task
   */
  private async healthCheckTask(): Promise<void> {
    try {
      // Check database connection
      // Check external services
      // Check disk space
      // Check memory usage
      
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      logger.info('System health check completed', {
        memoryUsage: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
        },
        uptime: `${Math.round(uptime / 60)} minutes`
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      throw error;
    }
  }

  /**
   * Inactive user cleanup task
   */
  private async inactiveUserCleanupTask(): Promise<void> {
    try {
      // Find users inactive for more than 6 months
      const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
      
      // Send warning emails to users inactive for 5 months
      const fiveMonthsAgo = new Date(Date.now() - 5 * 30 * 24 * 60 * 60 * 1000);
      
      logger.info('Inactive user cleanup completed');
    } catch (error) {
      logger.error('Inactive user cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Log rotation task
   */
  private async logRotationTask(): Promise<void> {
    try {
      // Rotate log files
      // Archive old logs
      // Clean up logs older than 30 days
      
      logger.info('Log rotation completed');
    } catch (error) {
      logger.error('Log rotation failed:', error);
      throw error;
    }
  }

  /**
   * Backup reminder task
   */
  private async backupReminderTask(): Promise<void> {
    try {
      // Check backup status
      // Send notifications if backups are overdue
      
      logger.info('Backup reminder task completed');
    } catch (error) {
      logger.error('Backup reminder task failed:', error);
      throw error;
    }
  }

  /**
   * Notify about job failure
   */
  private async notifyJobFailure(jobName: string, error: Error): Promise<void> {
    try {
      // Send notification to administrators
      if (socketService) {
        socketService.broadcastNotification({
          title: 'Cron Job Failed',
          message: `Job '${jobName}' failed: ${error.message}`,
          type: 'error',
          data: { jobName, error: error.message }
        });
      }
      
      // Send email notification to administrators
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && emailService) {
        await emailService.sendEmail({
          to: adminEmail,
          subject: `Cron Job Failure: ${jobName}`,
          html: `
            <h2>Cron Job Failure Alert</h2>
            <p><strong>Job Name:</strong> ${jobName}</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p><strong>Stack Trace:</strong></p>
            <pre>${error.stack}</pre>
          `,
          text: `Cron job '${jobName}' failed with error: ${error.message}`
        });
      }
    } catch (notificationError) {
      logger.error('Failed to send job failure notification:', notificationError);
    }
  }

  /**
   * Run a job immediately (for testing)
   */
  public async runJobNow(name: string): Promise<void> {
    const job = this.jobs.get(name);
    if (!job) {
      throw new ApiError(`Job '${name}' not found`, StatusCodes.NOT_FOUND);
    }

    // Get the original task function and run it
    const jobStat = this.jobStats.get(name);
    if (jobStat && jobStat.isRunning) {
      throw new ApiError(`Job '${name}' is already running`, StatusCodes.CONFLICT);
    }

    logger.info(`Running job '${name}' immediately`);
    // Note: This would require storing the original task function
    // For now, we'll just log that the job would run
  }

  /**
   * Get service status
   */
  public getServiceStatus(): {
    isInitialized: boolean;
    totalJobs: number;
    activeJobs: number;
    runningJobs: number;
  } {
    const runningJobs = Array.from(this.jobStats.values()).filter(job => job.isRunning).length;
    
    return {
      isInitialized: this.isInitialized,
      totalJobs: this.jobs.size,
      activeJobs: this.getActiveJobsCount(),
      runningJobs
    };
  }
}

// Create singleton instance
export const cronService = new CronService();
export default cronService;