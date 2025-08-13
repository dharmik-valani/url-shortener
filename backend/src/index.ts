import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { DatabaseService } from './services/database';
import { CacheService } from './services/cache';
import { UrlController } from './controllers/urlController';
import { IConfig } from './types';

// Load environment variables
dotenv.config();

/**
 * Main Express server for URL shortener service
 * Optimized for high performance and security
 */

class Server {
  private app: express.Application;
  private config: IConfig;

  constructor() {
    this.app = express();
    this.config = this.loadConfig();
    this.setupMiddleware();
    this.setupErrorHandling();
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfig(): IConfig {
    return {
      port: parseInt(process.env.PORT || '3001'),
      nodeEnv: process.env.NODE_ENV || 'development',
      baseUrl: process.env.BASE_URL || 'http://localhost:3001',
      database: {
        filename: process.env.DB_FILENAME || './urlshortener.db',
        verbose: process.env.NODE_ENV === 'development'
      },
      cache: {
        ttl: parseInt(process.env.CACHE_TTL || '3600'),
        checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD || '600'),
        maxKeys: parseInt(process.env.CACHE_MAX_KEYS || '10000')
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
        message: 'Too many requests from this IP, please try again later.'
      },
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true
      }
    };
  }

  /**
   * Initialize database and cache services
   */
  private async initializeServices(): Promise<void> {
    try {
      // Initialize database
      const db = DatabaseService.getInstance(this.config.database);
      await db.initialize();
      console.log('Database service initialized');

      // Initialize cache
      const cache = CacheService.getInstance(this.config.cache);
      console.log('Cache service initialized');

      // Schedule cleanup tasks
      this.scheduleCleanupTasks();

    } catch (error) {
      console.error('Failed to initialize services:', error);
      process.exit(1);
    }
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS configuration
    this.app.use(cors({
      origin: true, // Allow all origins in development
      credentials: false, // Disable credentials for now
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Length', 'Content-Type']
    }));

    // Compression middleware
    this.app.use(compression({
      level: 6,
      threshold: 1024
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', 1);

    // Logging middleware
    if (this.config.nodeEnv === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        skip: (req, res) => res.statusCode < 400
      }));
    }

    // Rate limiting middleware
    this.setupRateLimiting();

    // Request timing middleware
    this.app.use(this.requestTimingMiddleware);
  }

  /**
   * Setup rate limiting with different rules for different endpoints
   */
  private setupRateLimiting(): void {
    // General rate limiting
    const generalLimiter = rateLimit({
      windowMs: this.config.rateLimit.windowMs,
      max: this.config.rateLimit.maxRequests,
      message: {
        success: false,
        error: this.config.rateLimit.message
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
      }
    });

    // Stricter rate limiting for URL creation
    const createUrlLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 requests per minute
      message: {
        success: false,
        error: 'Too many URL creation requests, please try again later.'
      },
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
      }
    });

    // Apply rate limiting
    this.app.use('/api/', generalLimiter);
    this.app.use('/api/urls', createUrlLimiter);
  }

  /**
   * Request timing middleware for performance monitoring
   */
  private requestTimingMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, originalUrl } = req;
      const { statusCode } = res;
      
      if (statusCode >= 400) {
        console.warn(`${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
      } else if (duration > 1000) {
        console.warn(`Slow request: ${method} ${originalUrl} - ${duration}ms`);
      }
    });
    
    next();
  };

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    const urlController = new UrlController();

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'URL Shortener Service is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API routes
    this.app.post('/api/urls', urlController.createUrl.bind(urlController));
    this.app.get('/api/urls/:shortCode/analytics', urlController.getUrlAnalytics.bind(urlController));
    this.app.put('/api/urls/:shortCode', urlController.updateUrl.bind(urlController));
    this.app.delete('/api/urls/:shortCode', urlController.deleteUrl.bind(urlController));
    this.app.get('/api/stats', urlController.getStats.bind(urlController));

    // URL redirection route (must be last)
    this.app.get('/:shortCode', urlController.redirectToUrl.bind(urlController));

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    });
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', error);

      // Don't leak error details in production
      const message = this.config.nodeEnv === 'production' 
        ? 'Internal server error' 
        : error.message;

      res.status(error.statusCode || 500).json({
        success: false,
        error: message
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  /**
   * Schedule cleanup tasks
   */
  private scheduleCleanupTasks(): void {
    // Clean up expired URLs and old analytics data every hour
    setInterval(async () => {
      try {
        const db = DatabaseService.getInstance();
        await db.cleanup();
        console.log('Cleanup task completed');
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Log cache statistics every 5 minutes
    setInterval(() => {
      try {
        const cache = CacheService.getInstance();
        const stats = cache.getCacheStats();
        console.log('Cache stats:', stats);
      } catch (error) {
        console.error('Failed to get cache stats:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      // Initialize services first
      await this.initializeServices();
      
      // Setup routes after services are initialized
      this.setupRoutes();

      this.app.listen(this.config.port, () => {
        console.log(`🚀 URL Shortener Service running on port ${this.config.port}`);
        console.log(`📊 Environment: ${this.config.nodeEnv}`);
        console.log(`🌐 Base URL: ${this.config.baseUrl}`);
        console.log(`💾 Database: ${this.config.database.filename}`);
        console.log(`⚡ Cache TTL: ${this.config.cache.ttl}s`);
        console.log(`🛡️ Rate Limit: ${this.config.rateLimit.maxRequests} requests per ${this.config.rateLimit.windowMs}ms`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down server...');
    
    try {
      const db = DatabaseService.getInstance();
      await db.close();
      
      const cache = CacheService.getInstance();
      cache.close();
      
      console.log('Server shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new Server();
server.start();

// Handle graceful shutdown
process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());
