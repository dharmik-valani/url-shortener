// Core URL types
export interface IUrl {
  id: string;
  shortCode: string;
  originalUrl: string;
  title?: string;
  description?: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  userId?: string;
  customAlias?: string;
  password?: string;
  maxClicks?: number;
  currentClicks: number;
}

export interface IUrlCreate {
  originalUrl: string;
  title?: string;
  description?: string;
  expiresAt?: Date;
  customAlias?: string;
  password?: string;
  maxClicks?: number;
}

export interface IUrlUpdate {
  title?: string;
  description?: string;
  expiresAt?: Date;
  isActive?: boolean;
  maxClicks?: number;
}

// Analytics types
export interface IClick {
  id: string;
  urlId: string;
  shortCode: string;
  ipAddress: string;
  userAgent: string;
  referer?: string;
  country?: string;
  city?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  timestamp: Date;
  isUnique: boolean;
}

export interface IClickAnalytics {
  totalClicks: number;
  uniqueClicks: number;
  clicksByCountry: Record<string, number>;
  clicksByDevice: Record<string, number>;
  clicksByBrowser: Record<string, number>;
  clicksByDate: Record<string, number>;
  recentClicks: IClick[];
}

// User types (for future expansion)
export interface IUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  isActive: boolean;
  apiKey?: string;
}

// API Response types
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IUrlResponse {
  shortUrl: string;
  originalUrl: string;
  shortCode: string;
  qrCode?: string;
  expiresAt?: Date;
  maxClicks?: number;
  currentClicks: number;
}

// Database types
export interface IDatabaseConfig {
  filename: string;
  verbose?: boolean;
}

// Cache types
export interface ICacheConfig {
  ttl: number;
  checkperiod: number;
  maxKeys: number;
}

// Rate limiting types
export interface IRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

// Environment configuration
export interface IConfig {
  port: number;
  nodeEnv: string;
  baseUrl: string;
  database: IDatabaseConfig;
  cache: ICacheConfig;
  rateLimit: IRateLimitConfig;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation types
export interface IValidationResult {
  isValid: boolean;
  errors: string[];
}

// QR Code types
export interface IQrCodeOptions {
  width: number;
  height: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
}

// Security types
export interface ISecurityConfig {
  bcryptRounds: number;
  jwtSecret: string;
  jwtExpiresIn: string;
  maxUrlLength: number;
  allowedDomains?: string[];
  blockedDomains?: string[];
}

// Performance monitoring types
export interface IPerformanceMetrics {
  urlGenerationTime: number;
  redirectTime: number;
  databaseQueryTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

// Stats types
export interface IStats {
  cache: {
    keys: number;
    hits: number;
    misses: number;
    hitRate: number;
    memoryUsage: any;
  };
  urls: {
    total: number;
    active: number;
    expired: number;
  };
  clicks: {
    total: number;
    today: number;
    thisWeek: number;
  };
  performance: {
    avgResponseTime: number;
    cacheHitRate: number;
  };
}


