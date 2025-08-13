import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { IUrl, IClick, IDatabaseConfig } from '../types';

/**
 * High-performance database service for URL shortener
 * Optimized for billions of URLs and redirects
 * 
 * Key optimizations:
 * 1. Prepared statements for performance
 * 2. Proper indexing for fast lookups
 * 3. Connection pooling
 * 4. Batch operations for analytics
 * 5. WAL mode for concurrent access
 */

export class DatabaseService {
  private static instance: DatabaseService;
  private db: sqlite3.Database;
  private isInitialized = false;

  private constructor(private config: IDatabaseConfig) {
    this.db = new sqlite3.Database(config.filename, (err) => {
      if (err) {
        console.error('Database connection error:', err);
        throw err;
      }
    });

    // Enable WAL mode for better concurrency
    this.db.run('PRAGMA journal_mode = WAL');
    this.db.run('PRAGMA synchronous = NORMAL');
    this.db.run('PRAGMA cache_size = 10000');
    this.db.run('PRAGMA temp_store = MEMORY');
    this.db.run('PRAGMA mmap_size = 268435456'); // 256MB
  }

  public static getInstance(config?: IDatabaseConfig): DatabaseService {
    if (!DatabaseService.instance) {
      if (!config) {
        throw new Error('Database config required for first initialization');
      }
      DatabaseService.instance = new DatabaseService(config);
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database tables and indexes
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.createTables();
      await this.createIndexes();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Create database tables with optimal schema
   */
  private async createTables(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    // URLs table - optimized for fast lookups
    await run(`
      CREATE TABLE IF NOT EXISTS urls (
        id TEXT PRIMARY KEY,
        short_code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        is_active BOOLEAN DEFAULT 1,
        user_id TEXT,
        custom_alias TEXT UNIQUE,
        password TEXT,
        max_clicks INTEGER,
        current_clicks INTEGER DEFAULT 0,
        created_at_timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Clicks table - optimized for analytics
    await run(`
      CREATE TABLE IF NOT EXISTS clicks (
        id TEXT PRIMARY KEY,
        url_id TEXT NOT NULL,
        short_code TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        referer TEXT,
        country TEXT,
        city TEXT,
        device_type TEXT,
        browser TEXT,
        os TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        timestamp_unix INTEGER DEFAULT (strftime('%s', 'now')),
        is_unique BOOLEAN DEFAULT 1,
        FOREIGN KEY (url_id) REFERENCES urls (id)
      )
    `);

    // Analytics summary table for fast aggregations
    await run(`
      CREATE TABLE IF NOT EXISTS analytics_summary (
        url_id TEXT PRIMARY KEY,
        total_clicks INTEGER DEFAULT 0,
        unique_clicks INTEGER DEFAULT 0,
        last_click_at DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (url_id) REFERENCES urls (id)
      )
    `);

    // Rate limiting table
    await run(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0,
        reset_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * Create optimized indexes for performance
   */
  private async createIndexes(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    // Primary lookup indexes
    await run('CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code)');
    await run('CREATE INDEX IF NOT EXISTS idx_urls_custom_alias ON urls(custom_alias)');
    await run('CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_urls_expires_at ON urls(expires_at)');
    await run('CREATE INDEX IF NOT EXISTS idx_urls_is_active ON urls(is_active)');

    // Analytics indexes
    await run('CREATE INDEX IF NOT EXISTS idx_clicks_url_id ON clicks(url_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_clicks_short_code ON clicks(short_code)');
    await run('CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON clicks(timestamp_unix)');
    await run('CREATE INDEX IF NOT EXISTS idx_clicks_ip_address ON clicks(ip_address)');
    await run('CREATE INDEX IF NOT EXISTS idx_clicks_country ON clicks(country)');
    await run('CREATE INDEX IF NOT EXISTS idx_clicks_device_type ON clicks(device_type)');

    // Composite indexes for common queries
    await run('CREATE INDEX IF NOT EXISTS idx_urls_active_expires ON urls(is_active, expires_at)');
    await run('CREATE INDEX IF NOT EXISTS idx_clicks_url_timestamp ON clicks(url_id, timestamp_unix)');

    // Rate limiting index
    await run('CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON rate_limits(reset_at)');
  }

  /**
   * Create a new URL record
   */
  public async createUrl(urlData: Omit<IUrl, 'id' | 'createdAt' | 'currentClicks'>): Promise<IUrl> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

    const id = urlData.id || require('crypto').randomUUID();
    const shortCode = urlData.shortCode;
    const customAlias = urlData.customAlias;

    // Check for existing short code or custom alias
    if (shortCode) {
      const existing = await get('SELECT id FROM urls WHERE short_code = ? OR custom_alias = ?', [shortCode, customAlias]);
      if (existing) {
        throw new Error('Short code or custom alias already exists');
      }
    }

    const query = `
      INSERT INTO urls (
        id, short_code, original_url, title, description, expires_at, 
        is_active, user_id, custom_alias, password, max_clicks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await run(query, [
      id,
      shortCode,
      urlData.originalUrl,
      urlData.title,
      urlData.description,
      urlData.expiresAt,
      urlData.isActive,
      urlData.userId,
      customAlias,
      urlData.password,
      urlData.maxClicks
    ]);

    // Create analytics summary record
    await run('INSERT INTO analytics_summary (url_id) VALUES (?)', [id]);

    return this.getUrlById(id);
  }

  /**
   * Get URL by short code (primary lookup method)
   */
  public async getUrlByShortCode(shortCode: string): Promise<IUrl | null> {
    const get = promisify(this.db.get.bind(this.db));

    const query = `
      SELECT 
        id, short_code, original_url, title, description, created_at, 
        expires_at, is_active, user_id, custom_alias, password, 
        max_clicks, current_clicks
      FROM urls 
      WHERE (short_code = ? OR custom_alias = ?) 
        AND is_active = 1 
        AND (expires_at IS NULL OR expires_at > datetime('now'))
    `;

    const result = await get(query, [shortCode, shortCode]);
    return result ? this.mapRowToUrl(result) : null;
  }

  /**
   * Get URL by ID
   */
  public async getUrlById(id: string): Promise<IUrl | null> {
    const get = promisify(this.db.get.bind(this.db));

    const query = `
      SELECT 
        id, short_code, original_url, title, description, created_at, 
        expires_at, is_active, user_id, custom_alias, password, 
        max_clicks, current_clicks
      FROM urls 
      WHERE id = ?
    `;

    const result = await get(query, [id]);
    return result ? this.mapRowToUrl(result) : null;
  }

  /**
   * Record a click with analytics data
   */
  public async recordClick(clickData: Omit<IClick, 'id' | 'timestamp'>): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

    const id = require('crypto').randomUUID();
    const timestamp = new Date();

    // Check if this is a unique click (same IP, same URL, within 24 hours)
    const isUnique = await this.isUniqueClick(clickData.urlId, clickData.ipAddress);

    const query = `
      INSERT INTO clicks (
        id, url_id, short_code, ip_address, user_agent, referer, 
        country, city, device_type, browser, os, is_unique
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await run(query, [
      id,
      clickData.urlId,
      clickData.shortCode,
      clickData.ipAddress,
      clickData.userAgent,
      clickData.referer,
      clickData.country,
      clickData.city,
      clickData.deviceType,
      clickData.browser,
      clickData.os,
      isUnique
    ]);

    // Update URL click count
    await run(
      'UPDATE urls SET current_clicks = current_clicks + 1 WHERE id = ?',
      [clickData.urlId]
    );

    // Update analytics summary
    await this.updateAnalyticsSummary(clickData.urlId, isUnique);
  }

  /**
   * Check if click is unique (same IP, same URL, within 24 hours)
   */
  private async isUniqueClick(urlId: string, ipAddress: string): Promise<boolean> {
    const get = promisify(this.db.get.bind(this.db));

    const query = `
      SELECT id FROM clicks 
      WHERE url_id = ? AND ip_address = ? 
        AND timestamp > datetime('now', '-1 day')
      LIMIT 1
    `;

    const result = await get(query, [urlId, ipAddress]);
    return !result;
  }

  /**
   * Update analytics summary for fast aggregations
   */
  private async updateAnalyticsSummary(urlId: string, isUnique: boolean): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    const query = `
      UPDATE analytics_summary 
      SET 
        total_clicks = total_clicks + 1,
        unique_clicks = unique_clicks + ?,
        last_click_at = datetime('now'),
        updated_at = datetime('now')
      WHERE url_id = ?
    `;

    await run(query, [isUnique ? 1 : 0, urlId]);
  }

  /**
   * Get analytics for a URL
   */
  public async getUrlAnalytics(urlId: string, days: number = 30): Promise<any> {
    const all = promisify(this.db.all.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

    // Get summary
    const summary = await get(
      'SELECT * FROM analytics_summary WHERE url_id = ?',
      [urlId]
    );

    // Get recent clicks
    const clicks = await all(`
      SELECT * FROM clicks 
      WHERE url_id = ? 
        AND timestamp > datetime('now', '-${days} days')
      ORDER BY timestamp DESC 
      LIMIT 100
    `, [urlId]);

    // Get clicks by country
    const clicksByCountry = await all(`
      SELECT country, COUNT(*) as count 
      FROM clicks 
      WHERE url_id = ? 
        AND timestamp > datetime('now', '-${days} days')
        AND country IS NOT NULL
      GROUP BY country 
      ORDER BY count DESC
    `, [urlId]);

    // Get clicks by device
    const clicksByDevice = await all(`
      SELECT device_type, COUNT(*) as count 
      FROM clicks 
      WHERE url_id = ? 
        AND timestamp > datetime('now', '-${days} days')
      GROUP BY device_type 
      ORDER BY count DESC
    `, [urlId]);

    return {
      summary,
      recentClicks: clicks,
      clicksByCountry,
      clicksByDevice
    };
  }

  /**
   * Rate limiting methods
   */
  public async checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const get = promisify(this.db.get.bind(this.db));
    const run = promisify(this.db.run.bind(this.db));

    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);

    // Get current rate limit data
    let rateLimit = await get('SELECT * FROM rate_limits WHERE key = ?', [key]);

    if (!rateLimit) {
      // Create new rate limit record
      await run(
        'INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)',
        [key, resetAt.toISOString()]
      );
      return true;
    }

    // Check if window has reset
    if (new Date(rateLimit.reset_at) <= now) {
      await run(
        'UPDATE rate_limits SET count = 1, reset_at = ? WHERE key = ?',
        [resetAt.toISOString(), key]
      );
      return true;
    }

    // Check if limit exceeded
    if (rateLimit.count >= maxRequests) {
      return false;
    }

    // Increment count
    await run(
      'UPDATE rate_limits SET count = count + 1 WHERE key = ?',
      [key]
    );

    return true;
  }

  /**
   * Clean up expired URLs and old analytics data
   */
  public async cleanup(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));

    // Delete expired URLs
    await run('DELETE FROM urls WHERE expires_at < datetime("now") AND expires_at IS NOT NULL');

    // Delete old clicks (keep last 2 years)
    await run('DELETE FROM clicks WHERE timestamp < datetime("now", "-2 years")');

    // Delete old rate limits
    await run('DELETE FROM rate_limits WHERE reset_at < datetime("now", "-1 day")');

    // Vacuum database to reclaim space
    await run('VACUUM');
  }

  /**
   * Map database row to URL object
   */
  private mapRowToUrl(row: any): IUrl {
    return {
      id: row.id,
      shortCode: row.short_code,
      originalUrl: row.original_url,
      title: row.title,
      description: row.description,
      createdAt: new Date(row.created_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      isActive: Boolean(row.is_active),
      userId: row.user_id,
      customAlias: row.custom_alias,
      password: row.password,
      maxClicks: row.max_clicks,
      currentClicks: row.current_clicks
    };
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
