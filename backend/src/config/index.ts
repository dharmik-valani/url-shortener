import dotenv from 'dotenv';
import { IConfig } from '../interfaces/config';

// Load environment variables
dotenv.config();

export const config: IConfig = {
  app: {
    port: parseInt(process.env.PORT || '3001'),
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || 'http://localhost:3001',
  },
  database: {
    filename: process.env.DB_FILENAME || './urlshortener.db',
    verbose: process.env.NODE_ENV === 'development',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
    timeout: parseInt(process.env.DB_TIMEOUT || '5000'),
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
    checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD || '600'),
    maxKeys: parseInt(process.env.CACHE_MAX_KEYS || '10000'),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: 'Too many requests from this IP, please try again later.',
  },
  security: {
    apiKey: process.env.API_KEY || 'default-api-key',
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
    maxRequestSize: parseInt(process.env.MAX_REQUEST_SIZE || '10485760'), // 10MB
    blockedIps: (process.env.BLOCKED_IPS || '').split(',').filter(Boolean),
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174').split(','),
    corsEnabled: process.env.CORS_ENABLED === 'true',
    sslEnabled: process.env.SSL_ENABLED === 'true',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
  },
  url: {
    minLength: parseInt(process.env.MIN_URL_LENGTH || '4'),
    maxLength: parseInt(process.env.MAX_URL_LENGTH || '2048'),
    codeLength: parseInt(process.env.CODE_LENGTH || '8'),
    defaultExpiry: parseInt(process.env.DEFAULT_URL_EXPIRY || '2592000'), // 30 days
    allowCustomAlias: process.env.ALLOW_CUSTOM_ALIAS === 'true',
    reservedPaths: (process.env.RESERVED_PATHS || 'admin,api,health').split(','),
  },
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '90'),
    detailedLogs: process.env.DETAILED_LOGS === 'true',
    trackBots: process.env.TRACK_BOTS === 'true',
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    logFormat: process.env.LOG_FORMAT || 'combined',
    sentryDsn: process.env.SENTRY_DSN,
  }
};
