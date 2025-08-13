import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '../config';

// Rate limiting middleware
export const createRateLimiter = (options = {}) => rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { success: false, error: config.rateLimit.message },
  standardHeaders: true,
  legacyHeaders: false,
  ...options
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});

// Request sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    // Sanitize request body
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .trim()
          .replace(/[<>]/g, '') // Remove potential HTML tags
          .replace(/javascript:/gi, '') // Remove JavaScript protocol
          .replace(/on\w+\s*=/gi, ''); // Remove event handlers
      }
    });
  }

  if (req.query) {
    // Sanitize query parameters
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string)
          .trim()
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    });
  }

  next();
};

// SQL Injection prevention middleware
export const preventSqlInjection = (req: Request, res: Response, next: NextFunction) => {
  const sqlInjectionPattern = /('|"|;|--|\/\*|\*\/|xp_|sp_|exec|execute|insert|select|delete|update|drop|union|into|load_file|outfile)/i;
  
  const checkValue = (value: any): boolean => {
    if (typeof value === 'string' && sqlInjectionPattern.test(value)) {
      return true;
    }
    return false;
  };

  const hasInjection = (obj: any): boolean => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (hasInjection(obj[key])) return true;
      } else if (checkValue(obj[key])) {
        return true;
      }
    }
    return false;
  };

  if (
    hasInjection(req.query) ||
    hasInjection(req.body) ||
    hasInjection(req.params)
  ) {
    return res.status(403).json({
      success: false,
      error: 'Invalid input detected'
    });
  }

  next();
};

// JWT verification middleware (if needed)
export const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== config.security.apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
};

// Request validation middleware
export const validateRequestSize = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  
  if (contentLength > config.security.maxRequestSize) {
    return res.status(413).json({
      success: false,
      error: 'Request entity too large'
    });
  }

  next();
};

// IP filtering middleware
export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  
  if (config.security.blockedIps.includes(clientIp || '')) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  next();
};

// User agent validation middleware
export const validateUserAgent = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'];
  
  if (!userAgent || userAgent.length > 500) {
    return res.status(400).json({
      success: false,
      error: 'Invalid user agent'
    });
  }

  // Check for common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /postman/i
  ];

  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    return res.status(403).json({
      success: false,
      error: 'Automated requests are not allowed'
    });
  }

  next();
};
