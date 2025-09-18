import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import fs from "fs";

// Import middlewares
import { errorHandler, notFoundHandler } from "@/middlewares/errorHandler";
import { sanitizeRequest } from "@/middlewares/validateRequest";

// Import routes
import { userRoutes } from "@/app/modules/user/user.routes";
import { authRoutes } from "@/app/modules/auth/auth.routes";

// Import utilities
import { ResponseUtils } from "@/utils/response";
import { logger } from "./utils";
import { requestLogger } from "./middlewares/requestLogger";
import config from "@/config";

/**
 * Create Express application
 */
const app: Application = express();

/**
 * Trust proxy for accurate IP addresses behind reverse proxies
 */
app.set("trust proxy", 1);

/**
 * Security Middleware
 */

// Helmet for security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ];

    if (
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV === "development"
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // Limit each IP to 100 requests per windowMs in production
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === "/health" || req.path === "/api/health";
  },
});

app.use(limiter);

// Compression middleware
app.use(compression());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution attacks
app.use(
  hpp({
    whitelist: ["sort", "fields", "page", "limit", "filter"],
  })
);

/**
 * Parsing Middleware
 */

// Body parser middleware
app.use(
  express.json({
    limit: "10mb",
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser
app.use(cookieParser());

// Request sanitization
app.use(sanitizeRequest());

/**
 * Logging Middleware
 */

// HTTP request logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        },
      },
    })
  );
}

// Custom request logger
app.use(requestLogger);

/**
 * Static Files
 */

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Serve static files from public directory
app.use("/public", express.static(path.join(__dirname, "../public")));

// Serve views directory
app.use("/views", express.static(path.join(__dirname, "views")));

/**
 * Helper function to detect browser requests
 */
const isBrowserRequest = (req: Request): boolean => {
  const userAgent = req.get('User-Agent') || '';
  const acceptHeader = req.get('Accept') || '';
  
  // Check if request accepts HTML and is likely from a browser
  return acceptHeader.includes('text/html') && 
         (userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari') || userAgent.includes('Firefox'));
};

/**
 * Helper function to serve HTML files with template replacement
 */
const serveHtmlFile = (res: Response, filePath: string, fallbackData: any, fallbackMessage: string) => {
  const fullPath = path.join(__dirname, 'views', filePath);
  
  if (fs.existsSync(fullPath)) {
    // Read the HTML file and replace placeholders
    const htmlContent = fs.readFileSync(fullPath, 'utf8');
    const processedHtml = htmlContent.replace(/{{PROJECT_NAME}}/g, config.project.displayName);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(processedHtml);
  } else {
    // Fallback to JSON if HTML file doesn't exist
    ResponseUtils.success(res, fallbackData, fallbackMessage);
  }
};

/**
 * Health Check Endpoints
 */

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  const healthData = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  };

  if (isBrowserRequest(req)) {
    serveHtmlFile(res, 'health.html', healthData, "Service is healthy");
  } else {
    ResponseUtils.success(res, healthData, "Service is healthy");
  }
});

// Detailed health check
app.get("/api/health", (req: Request, res: Response) => {
  const healthData = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
    memory: {
      used:
        Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total:
        Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
      external:
        Math.round((process.memoryUsage().external / 1024 / 1024) * 100) / 100,
    },
    cpu: {
      usage: process.cpuUsage(),
    },
    database: {
      status: "connected", // This would be dynamic based on actual DB connection
    },
    services: {
      cloudinary: process.env.CLOUDINARY_CLOUD_NAME
        ? "configured"
        : "not configured",
      redis: process.env.REDIS_URL ? "configured" : "not configured",
    },
  };

  ResponseUtils.success(res, healthData, "Detailed health check");
});

/**
 * API Routes
 */

// API version prefix
const API_PREFIX = "/api/v1";

// Welcome endpoint
app.get("/", (req: Request, res: Response) => {
  const welcomeData = {
    message: `Welcome to ${config.project.displayName} API`,
    version: "1.0.0",
    documentation: `${req.protocol}://${req.get("host")}/api/docs`,
    endpoints: {
      health: "/health",
      auth: `${API_PREFIX}/auth`,
      users: `${API_PREFIX}/users`,
    },
  };

  if (isBrowserRequest(req)) {
    serveHtmlFile(res, 'welcome.html', welcomeData, "API is running successfully");
  } else {
    ResponseUtils.success(res, welcomeData, "API is running successfully");
  }
});

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);

// API documentation endpoint (placeholder)
app.get("/api/docs", (req: Request, res: Response) => {
  const docsData = {
    message: "API Documentation",
    note: "This would typically serve Swagger/OpenAPI documentation",
    endpoints: {
      auth: {
        register: "POST /api/v1/auth/register",
        login: "POST /api/v1/auth/login",
        logout: "POST /api/v1/auth/logout",
        refresh: "POST /api/v1/auth/refresh-token",
        "forgot-password": "POST /api/v1/auth/forgot-password",
        "reset-password": "POST /api/v1/auth/reset-password",
        "verify-email": "POST /api/v1/auth/verify-email",
        me: "GET /api/v1/auth/me",
      },
      users: {
        "get-all": "GET /api/v1/users",
        "get-by-id": "GET /api/v1/users/:id",
        "update-profile": "PATCH /api/v1/users/profile",
        "change-password": "PATCH /api/v1/users/change-password",
        "upload-avatar": "POST /api/v1/users/avatar",
        delete: "DELETE /api/v1/users/:id",
        statistics: "GET /api/v1/users/stats",
      },
    },
  };

  if (isBrowserRequest(req)) {
    serveHtmlFile(res, 'docs.html', docsData, "API Documentation");
  } else {
    ResponseUtils.success(res, docsData, "API Documentation");
  }
});

/**
 * Error Handling Middleware
 */

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

/**
 * Graceful Shutdown Handlers
 */

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
  process.exit(1);
});

process.on("uncaughtException", (error: Error) => {
  logger.error("Uncaught Exception:", {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

export default app;
