import { DatabaseService } from '../../services/database';
import { CacheService } from '../../services/cache';
import { ValidationService } from '../../utils/validation';
import { UrlGenerator } from '../../utils/urlGenerator';
import { config } from '../../config';
import { IUrlCreate, IUrlResponse } from './url.types';

export class UrlService {
  private db: DatabaseService;
  private cache: CacheService;
  private urlGenerator: UrlGenerator;

  constructor() {
    this.db = DatabaseService.getInstance();
    this.cache = CacheService.getInstance();
    this.urlGenerator = new UrlGenerator();
  }

  async createUrl(data: IUrlCreate): Promise<IUrlResponse> {
    try {
      // Validate input
      const validation = ValidationService.validateUrlCreate(data);
      if (!validation.isValid) {
        throw new Error(validation.errors[0]);
      }

      // Generate short code
      const shortCode = await this.urlGenerator.generate();

      // Store in database
      const result = await this.db.createUrl({
        shortCode,
        originalUrl: data.originalUrl,
        expiresAt: data.expiresAt,
        customAlias: data.customAlias,
        title: data.title,
        description: data.description,
        maxClicks: data.maxClicks,
      });

      // Store in cache
      this.cache.set(shortCode, {
        originalUrl: data.originalUrl,
        expiresAt: data.expiresAt,
        clicks: 0,
      });

      return {
        shortUrl: `${config.app.baseUrl}/${shortCode}`,
        originalUrl: data.originalUrl,
        qrCode: await this.generateQrCode(shortCode),
      };
    } catch (error) {
      throw error;
    }
  }

  async getUrl(shortCode: string): Promise<string> {
    try {
      // Check cache first
      const cached = this.cache.get(shortCode);
      if (cached) {
        return cached.originalUrl;
      }

      // Get from database
      const url = await this.db.getUrl(shortCode);
      if (!url) {
        throw new Error('URL not found');
      }

      // Update cache
      this.cache.set(shortCode, {
        originalUrl: url.originalUrl,
        expiresAt: url.expiresAt,
        clicks: url.clicks,
      });

      return url.originalUrl;
    } catch (error) {
      throw error;
    }
  }

  private async generateQrCode(shortCode: string): Promise<string> {
    const shortUrl = `${config.app.baseUrl}/${shortCode}`;
    // Implementation of QR code generation
    return shortUrl; // Placeholder
  }
}
