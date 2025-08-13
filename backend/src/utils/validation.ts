import Joi from 'joi';
import { IUrlCreate, IValidationResult } from '../types';

/**
 * Comprehensive validation utilities for URL shortener service
 * Focuses on security, performance, and data integrity
 */

export class ValidationService {
  private static readonly UTM_SCHEMA = Joi.object({
    utm_source: Joi.string().max(100).pattern(/^[a-zA-Z0-9_\-\.]+$/),
    utm_medium: Joi.string().max(100).pattern(/^[a-zA-Z0-9_\-\.]+$/),
    utm_campaign: Joi.string().max(100).pattern(/^[a-zA-Z0-9_\-\.]+$/),
    utm_term: Joi.string().max(100).pattern(/^[a-zA-Z0-9_\-\.\s]+$/),
    utm_content: Joi.string().max(100).pattern(/^[a-zA-Z0-9_\-\.\s]+$/)
  }).unknown(true); // Allow other query parameters

  private static readonly URL_SCHEMA = Joi.object({
    originalUrl: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .max(2048)
      .custom((value, helpers) => {
        try {
          const url = new URL(value);
          
          // Validate UTM parameters if present
          const utmParams = {};
          url.searchParams.forEach((value, key) => {
            if (key.startsWith('utm_')) {
              utmParams[key] = value;
            }
          });
          
          if (Object.keys(utmParams).length > 0) {
            const { error } = ValidationService.UTM_SCHEMA.validate(utmParams);
            if (error) {
              return helpers.error('string.utmInvalid');
            }
          }
          
          return value;
        } catch (err) {
          return helpers.error('string.uri');
        }
      })
      .required()
      .messages({
        'string.uri': 'Please provide a valid URL',
        'string.max': 'URL is too long (max 2048 characters)',
        'string.utmInvalid': 'Invalid UTM parameters',
        'any.required': 'URL is required'
      }),
    title: Joi.string()
      .max(100)
      .optional()
      .messages({
        'string.max': 'Title is too long (max 100 characters)'
      }),
    description: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Description is too long (max 500 characters)'
      }),
    expiresAt: Joi.date()
      .greater('now')
      .optional()
      .messages({
        'date.greater': 'Expiration date must be in the future'
      }),
    customAlias: Joi.string()
      .pattern(/^[a-zA-Z0-9_-]+$/)
      .min(3)
      .max(20)
      .optional()
      .messages({
        'string.pattern.base': 'Custom alias can only contain letters, numbers, hyphens, and underscores',
        'string.min': 'Custom alias must be at least 3 characters',
        'string.max': 'Custom alias must be at most 20 characters'
      }),
    password: Joi.string()
      .min(6)
      .max(50)
      .optional()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.max': 'Password is too long (max 50 characters)'
      }),
    maxClicks: Joi.number()
      .integer()
      .min(1)
      .max(1000000)
      .optional()
      .messages({
        'number.base': 'Max clicks must be a number',
        'number.integer': 'Max clicks must be a whole number',
        'number.min': 'Max clicks must be at least 1',
        'number.max': 'Max clicks cannot exceed 1,000,000'
      })
  });

  private static readonly SHORT_CODE_SCHEMA = Joi.string()
    .pattern(/^[0-9A-Za-z]{8}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid short code format',
      'any.required': 'Short code is required'
    });

  /**
   * Validate URL creation data
   */
  public static validateUrlCreate(data: any): IValidationResult {
    try {
      const { error, value } = this.URL_SCHEMA.validate(data, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        return {
          isValid: false,
          errors: error.details.map(detail => detail.message)
        };
      }

      // Additional security checks
      const securityCheck = this.performSecurityChecks(value);
      if (!securityCheck.isValid) {
        return securityCheck;
      }

      return {
        isValid: true,
        errors: []
      };
    } catch (err) {
      return {
        isValid: false,
        errors: ['Validation error occurred']
      };
    }
  }

  /**
   * Validate short code format
   */
  public static validateShortCode(code: string): IValidationResult {
    try {
      const { error } = this.SHORT_CODE_SCHEMA.validate(code);
      
      if (error) {
        return {
          isValid: false,
          errors: error.details.map(detail => detail.message)
        };
      }

      return {
        isValid: true,
        errors: []
      };
    } catch (err) {
      return {
        isValid: false,
        errors: ['Short code validation error']
      };
    }
  }

  /**
   * Perform security checks on URL data
   */
  private static performSecurityChecks(data: IUrlCreate): IValidationResult {
    const errors: string[] = [];

    // Check for malicious URLs
    if (this.isMaliciousUrl(data.originalUrl)) {
      errors.push('URL appears to be malicious and is not allowed');
    }

    // Check for blocked domains
    if (this.isBlockedDomain(data.originalUrl)) {
      errors.push('This domain is not allowed');
    }

    // Check for phishing indicators
    if (this.hasPhishingIndicators(data.originalUrl)) {
      errors.push('URL contains potential phishing indicators');
    }

    // Check for excessive redirects
    if (this.hasExcessiveRedirects(data.originalUrl)) {
      errors.push('URL contains too many redirects');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if URL is potentially malicious
   */
  private static isMaliciousUrl(url: string): boolean {
    const maliciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
      /ftp:/i,
      /mailto:/i,
      /tel:/i,
      /<script/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /document\./i,
      /window\./i
    ];

    return maliciousPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check if domain is blocked
   */
  private static isBlockedDomain(url: string): boolean {
    const blockedDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'internal',
      'private',
      'test',
      'dev',
      'staging'
    ];

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      return blockedDomains.some(domain => 
        hostname.includes(domain) || hostname.endsWith(`.${domain}`)
      );
    } catch {
      return true; // Invalid URL
    }
  }

  /**
   * Check for phishing indicators
   */
  private static hasPhishingIndicators(url: string): boolean {
    const phishingPatterns = [
      /paypal.*\.com.*@/i,
      /bank.*\.com.*@/i,
      /secure.*\.com.*@/i,
      /login.*\.com.*@/i,
      /update.*\.com.*@/i,
      /verify.*\.com.*@/i
    ];

    return phishingPatterns.some(pattern => pattern.test(url));
  }

  /**
   * Check for excessive redirects
   */
  private static hasExcessiveRedirects(url: string): boolean {
    const redirectPatterns = [
      /bit\.ly/i,
      /tinyurl\.com/i,
      /goo\.gl/i,
      /t\.co/i,
      /is\.gd/i,
      /v\.gd/i
    ];

    // Count redirect services in URL
    const redirectCount = redirectPatterns.filter(pattern => pattern.test(url)).length;
    return redirectCount > 2; // Allow max 2 redirect services
  }

  /**
   * Sanitize user input
   */
  public static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove JavaScript protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .substring(0, 2048); // Limit length
  }

  /**
   * Validate IP address format
   */
  public static isValidIpAddress(ip: string): boolean {
    const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
  }

  /**
   * Validate user agent string
   */
  public static isValidUserAgent(userAgent: string): boolean {
    if (!userAgent || userAgent.length > 500) {
      return false;
    }

    // Check for common bot patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /perl/i
    ];

    return !botPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Rate limiting validation
   */
  public static validateRateLimit(
    currentCount: number, 
    maxCount: number, 
    timeWindow: number
  ): boolean {
    return currentCount < maxCount;
  }
}
