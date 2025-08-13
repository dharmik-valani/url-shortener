import { Request, Response } from 'express';
import { UrlService } from './url.service';
import { config } from '../../config';

export class UrlController {
  private urlService: UrlService;

  constructor() {
    this.urlService = new UrlService();
  }

  async createUrl(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const result = await this.urlService.createUrl(req.body);
      
      const duration = Date.now() - startTime;
      console.log(`URL created in ${duration}ms: ${result.shortUrl.split('/').pop()}`);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Error creating URL (${duration}ms):`, error);
      
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create URL'
      });
    }
  }

  async redirectToUrl(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const { shortCode } = req.params;
      const originalUrl = await this.urlService.getUrl(shortCode);
      
      const duration = Date.now() - startTime;
      console.log(`Redirect in ${duration}ms: ${shortCode} -> ${originalUrl}`);
      
      res.redirect(301, originalUrl);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Error redirecting (${duration}ms):`, error);
      
      res.status(404).json({
        success: false,
        error: 'URL not found'
      });
    }
  }

  async getUrlAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { shortCode } = req.params;
      // Implementation of analytics retrieval
      res.json({
        success: true,
        data: {
          shortCode,
          clicks: 0,
          // Add more analytics data
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get analytics'
      });
    }
  }

  async updateUrl(req: Request, res: Response): Promise<void> {
    try {
      const { shortCode } = req.params;
      // Implementation of URL update
      res.json({
        success: true,
        message: `URL ${shortCode} updated successfully`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update URL'
      });
    }
  }

  async deleteUrl(req: Request, res: Response): Promise<void> {
    try {
      const { shortCode } = req.params;
      // Implementation of URL deletion
      res.json({
        success: true,
        message: `URL ${shortCode} deleted successfully`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete URL'
      });
    }
  }

  async getStats(req: Request, res: Response): Promise<void> {
    try {
      // Implementation of stats retrieval
      res.json({
        success: true,
        data: {
          totalUrls: 0,
          totalClicks: 0,
          // Add more stats
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats'
      });
    }
  }
}
