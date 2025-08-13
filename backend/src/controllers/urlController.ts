import { Request, Response } from 'express';
import { urlGenerator } from '../utils/urlGenerator';
import { ValidationService } from '../utils/validation';
import { DatabaseService } from '../services/database';
import { CacheService } from '../services/cache';
import { IUrlCreate, IUrlResponse, IApiResponse, AppError } from '../types';
import QRCode from 'qrcode';

/**
 * URL Controller - Handles all URL shortening operations
 * Optimized for high throughput and billions of requests
 */

export class UrlController {
  private db: DatabaseService;
  private cache: CacheService;

  constructor() {
    // Initialize services lazily
    this.db = DatabaseService.getInstance();
    this.cache = CacheService.getInstance();
  }

  /**
   * Create a new shortened URL
   * POST /api/urls
   */
  public async createUrl(req: Request, res: Response): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Validate input
      const validation = ValidationService.validateUrlCreate(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.errors
        });
        return;
      }

      const urlData: IUrlCreate = req.body;
      
      // Generate short code
      const shortCode = urlData.customAlias 
        ? urlGenerator.generateCustomAlias(urlData.customAlias)
        : urlGenerator.generateShortCode();

      // Create URL record
      const url = await this.db.createUrl({
        shortCode,
        originalUrl: urlData.originalUrl,
        title: urlData.title || undefined,
        description: urlData.description || undefined,
        expiresAt: urlData.expiresAt,
        isActive: true,
        customAlias: urlData.customAlias || undefined,
        password: urlData.password || undefined,
        maxClicks: urlData.maxClicks || undefined
      });

      // Cache the URL for fast access
      this.cache.setUrl(shortCode, url);

      // Generate QR code
      const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
      const qrCode = await QRCode.toDataURL(shortUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const response: IUrlResponse = {
        shortUrl,
        originalUrl: url.originalUrl,
        shortCode: url.shortCode,
        qrCode,
        expiresAt: url.expiresAt,
        maxClicks: url.maxClicks,
        currentClicks: url.currentClicks
      };

      const generationTime = Date.now() - startTime;
      console.log(`URL created in ${generationTime}ms: ${shortCode}`);

      res.status(201).json({
        success: true,
        data: response,
        message: 'URL shortened successfully'
      });

    } catch (error) {
      console.error('Error creating URL:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  }

  /**
   * Redirect to original URL
   * GET /:shortCode
   */
  public async redirectToUrl(req: Request, res: Response): Promise<void> {
    try {
      const startTime = Date.now();
      const { shortCode } = req.params;

      // Validate short code format
      const validation = ValidationService.validateShortCode(shortCode);
      if (!validation.isValid) {
        res.status(404).json({
          success: false,
          error: 'Invalid short code'
        });
        return;
      }

      // Check cache first
      let url = this.cache.getUrl(shortCode);
      
      if (!url) {
        // Cache miss - get from database
        url = await this.db.getUrlByShortCode(shortCode);
        
        if (url) {
          // Cache the URL for future requests
          this.cache.setUrl(shortCode, url);
        }
      }

      if (!url) {
        res.status(404).json({
          success: false,
          error: 'URL not found'
        });
        return;
      }

      // Check if URL is expired
      if (url.expiresAt && new Date() > url.expiresAt) {
        res.status(410).json({
          success: false,
          error: 'URL has expired'
        });
        return;
      }

      // Check if URL is active
      if (!url.isActive) {
        res.status(410).json({
          success: false,
          error: 'URL is inactive'
        });
        return;
      }

      // Check if max clicks reached
      if (url.maxClicks && url.currentClicks >= url.maxClicks) {
        res.status(410).json({
          success: false,
          error: 'Maximum clicks reached'
        });
        return;
      }

      // Track analytics asynchronously (don't block redirect)
      this.trackAnalyticsAsync(url, req);

      // Increment click count in cache
      url.currentClicks++;
      this.cache.setUrl(shortCode, url);

      const redirectTime = Date.now() - startTime;
      console.log(`Redirect in ${redirectTime}ms: ${shortCode} -> ${url.originalUrl}`);

      // Redirect to original URL
      res.redirect(301, url.originalUrl);

    } catch (error) {
      console.error('Error redirecting URL:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get URL analytics
   * GET /api/urls/:shortCode/analytics
   */
  public async getUrlAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { shortCode } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      // Validate short code
      const validation = ValidationService.validateShortCode(shortCode);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid short code'
        });
        return;
      }

      // Get URL first
      let url = this.cache.getUrl(shortCode);
      if (!url) {
        url = await this.db.getUrlByShortCode(shortCode);
        if (!url) {
          res.status(404).json({
            success: false,
            error: 'URL not found'
          });
          return;
        }
      }

      // Check cache for analytics
      let analytics = this.cache.getAnalytics(url.id);
      
      if (!analytics) {
        // Get from database
        analytics = await this.db.getUrlAnalytics(url.id, days);
        
        // Cache analytics for 5 minutes
        this.cache.setAnalytics(url.id, analytics, 300);
      }

      res.json({
        success: true,
        data: {
          url: {
            shortCode: url.shortCode,
            originalUrl: url.originalUrl,
            title: url.title,
            currentClicks: url.currentClicks,
            maxClicks: url.maxClicks,
            expiresAt: url.expiresAt
          },
          analytics
        }
      });

    } catch (error) {
      console.error('Error getting analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update URL
   * PUT /api/urls/:shortCode
   */
  public async updateUrl(req: Request, res: Response): Promise<void> {
    try {
      const { shortCode } = req.params;
      const updateData = req.body;

      // Validate short code
      const validation = ValidationService.validateShortCode(shortCode);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid short code'
        });
        return;
      }

      // Get URL
      let url = this.cache.getUrl(shortCode);
      if (!url) {
        url = await this.db.getUrlByShortCode(shortCode);
        if (!url) {
          res.status(404).json({
            success: false,
            error: 'URL not found'
          });
          return;
        }
      }

      // Update URL (this would be implemented in database service)
      // For now, just invalidate cache
      this.cache.invalidateUrl(shortCode);

      res.json({
        success: true,
        message: 'URL updated successfully'
      });

    } catch (error) {
      console.error('Error updating URL:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Delete URL
   * DELETE /api/urls/:shortCode
   */
  public async deleteUrl(req: Request, res: Response): Promise<void> {
    try {
      const { shortCode } = req.params;

      // Validate short code
      const validation = ValidationService.validateShortCode(shortCode);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Invalid short code'
        });
        return;
      }

      // Get URL
      let url = this.cache.getUrl(shortCode);
      if (!url) {
        url = await this.db.getUrlByShortCode(shortCode);
        if (!url) {
          res.status(404).json({
            success: false,
            error: 'URL not found'
          });
          return;
        }
      }

      // Delete URL (this would be implemented in database service)
      // For now, just invalidate cache
      this.cache.invalidateUrl(shortCode);
      this.cache.invalidateAnalytics(url.id);

      res.json({
        success: true,
        message: 'URL deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting URL:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get service statistics
   * GET /api/stats
   */
  public async getStats(req: Request, res: Response): Promise<void> {
    try {
      // Check cache first
      let stats = this.cache.getStats();
      
      if (!stats) {
        // Generate stats
        const cacheStats = this.cache.getCacheStats();
        
        stats = {
          cache: cacheStats,
          urls: {
            total: 0, // Would be implemented
            active: 0,
            expired: 0
          },
          clicks: {
            total: 0,
            today: 0,
            thisWeek: 0
          },
          performance: {
            avgResponseTime: 0,
            cacheHitRate: cacheStats.hitRate
          }
        };

        // Cache stats for 1 hour
        this.cache.setStats(stats, 3600);
      }

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Track analytics asynchronously
   */
  private async trackAnalyticsAsync(url: any, req: Request): Promise<void> {
    try {
      // Extract analytics data
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';
      const referer = req.get('Referer');

      // Prepare click data
      const clickData = {
        urlId: url.id,
        shortCode: url.shortCode,
        ipAddress,
        userAgent,
        referer,
        country: 'unknown',
        city: 'unknown',
        deviceType: 'desktop' as const,
        browser: 'unknown',
        os: 'unknown'
      };

      // Record click asynchronously
      setImmediate(async () => {
        try {
          await this.db.recordClick(clickData);
          
          // Invalidate analytics cache
          this.cache.invalidateAnalytics(url.id);
        } catch (error) {
          console.error('Error recording click:', error);
        }
      });

    } catch (error) {
      console.error('Error preparing analytics:', error);
    }
  }
}
