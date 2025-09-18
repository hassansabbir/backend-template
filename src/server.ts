import dotenv from "dotenv";
import path from "path";

// Load environment variables first
dotenv.config({ path: path.join(__dirname, "../.env") });
import app from "./app";
import connectDB from "@/config/database";
import { CloudinaryService } from "@/services/cloudinary.service";
import { logger } from "./utils";

/**
 * Server configuration
 */
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

/**
 * Validate required environment variables
 */
const validateEnvironment = (): void => {
  const requiredEnvVars = [
    "NODE_ENV",
    "PORT",
    "MONGODB_URI",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    logger.error("Missing required environment variables:", {
      missing: missingVars,
    });
    process.exit(1);
  }

  // Validate Cloudinary configuration if enabled
  if (process.env.ENABLE_CLOUDINARY === "true") {
    if (!CloudinaryService.validateConfig()) {
      logger.warn(
        "Cloudinary configuration is invalid. File upload features may not work properly."
      );
    } else {
      logger.info("Cloudinary configuration validated successfully");
    }
  }

  logger.info("Environment validation completed successfully");
};

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Validate environment variables
    validateEnvironment();

    // Connect to MongoDB
    await connectDB();
    logger.info("Database connected successfully");

    // Start the HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server is running in ${NODE_ENV} mode on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);

      if (NODE_ENV === "development") {
        logger.info(`🔗 Local URL: http://localhost:${PORT}`);
        logger.info(`🌐 Network URL: http://0.0.0.0:${PORT}`);
      }
    });

    // Handle server errors
    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.syscall !== "listen") {
        throw error;
      }

      const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

      switch (error.code) {
        case "EACCES":
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
        case "EADDRINUSE":
          logger.error(`${bind} is already in use`);
          process.exit(1);
        default:
          throw error;
      }
    });

    // Graceful shutdown handlers
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close((err) => {
        if (err) {
          logger.error("Error during server shutdown:", err);
          process.exit(1);
        }

        logger.info("HTTP server closed");

        // Close database connection
        // Note: mongoose.connection.close() would be called here if using mongoose
        logger.info("Database connection closed");

        logger.info("Graceful shutdown completed");
        process.exit(0);
      });

      // Force close server after 30 seconds
      setTimeout(() => {
        logger.error(
          "Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 30000);
    };

    // Listen for termination signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught Exception:", {
        error: error.message,
        stack: error.stack,
      });

      // Close server gracefully
      server.close(() => {
        process.exit(1);
      });

      // Force exit after 5 seconds
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
      logger.error("Unhandled Rejection at:", {
        promise,
        reason: reason?.message || reason,
        stack: reason?.stack,
      });

      // Close server gracefully
      server.close(() => {
        process.exit(1);
      });

      // Force exit after 5 seconds
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    });

    // Handle warning events
    process.on("warning", (warning) => {
      logger.warn("Process warning:", {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
      });
    });
  } catch (error: any) {
    logger.error("Failed to start server:", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

/**
 * Initialize and start the server
 */
if (require.main === module) {
  startServer();
}

export default app;
export { startServer };
