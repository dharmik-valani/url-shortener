import NodeCache from 'node-cache';
import { ICacheConfig } from '../types';

/**
 * High-performance caching service for URL shortener
 * Reduces database load and improves response times
 * 
 * Cache Strategy:
 * 1. Hot URLs cached in memory for fast access
 * 2. LRU eviction for memory management
 * 3. TTL-based expiration
 * 4. Cache warming for popular URLs
 * 5. Cache invalidation on updates
 */

export class CacheService {
  private static instance: CacheService;
  private cache: NodeCache;
  private hitCount = 0;
  private missCount = 0;

  private constructor(private config: ICacheConfig) {
    this.cache = new NodeCache({
      stdTTL: config.ttl,
      checkperiod: config.checkperiod,
      maxKeys: config.maxKeys,
      useClones: false, // Better performance
      deleteOnExpire: true
    });

    // Monitor cache performance
    this.cache.on('expired', (key) => {
      console.log(`Cache key expired: ${key}`);
    });

    this.cache.on('flush', () => {
      console.log('Cache flushed');
    });
  }

  public static getInstance(config?: ICacheConfig): CacheService {
    if (!CacheService.instance) {
      if (!config) {
        throw new Error('Cache config required for first initialization');
      }
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  /**
   * Cache key generators for different data types
   */
  private static readonly CACHE_KEYS = {
    URL: (shortCode: string) => `url:${shortCode}`,
    ANALYTICS: (urlId: string) => `analytics:${urlId}`,
    RATE_LIMIT: (key: string) => `rate_limit:${key}`,
    USER_URLS: (userId: string) => `user_urls:${userId}`,
    POPULAR_URLS: () => 'popular_urls',
    STATS: () => 'stats'
  };

  /**
   * Cache a URL for fast lookups
   */
  public setUrl(shortCode: string, urlData: any, ttl?: number): void {
    const key = CacheService.CACHE_KEYS.URL(shortCode);
    this.cache.set(key, urlData, ttl || this.config.ttl);
  }

  /**
   * Get cached URL data
   */
  public getUrl(shortCode: string): any | undefined {
    const key = CacheService.CACHE_KEYS.URL(shortCode);
    const data = this.cache.get(key);
    
    if (data !== undefined) {
      this.hitCount++;
      return data;
    } else {
      this.missCount++;
      return undefined;
    }
  }

  /**
   * Cache analytics data
   */
  public setAnalytics(urlId: string, analyticsData: any, ttl: number = 300): void {
    const key = CacheService.CACHE_KEYS.ANALYTICS(urlId);
    this.cache.set(key, analyticsData, ttl);
  }

  /**
   * Get cached analytics data
   */
  public getAnalytics(urlId: string): any | undefined {
    const key = CacheService.CACHE_KEYS.ANALYTICS(urlId);
    const data = this.cache.get(key);
    
    if (data !== undefined) {
      this.hitCount++;
      return data;
    } else {
      this.missCount++;
      return undefined;
    }
  }

  /**
   * Cache rate limit data
   */
  public setRateLimit(key: string, data: any, ttl: number): void {
    const cacheKey = CacheService.CACHE_KEYS.RATE_LIMIT(key);
    this.cache.set(cacheKey, data, ttl);
  }

  /**
   * Get cached rate limit data
   */
  public getRateLimit(key: string): any | undefined {
    const cacheKey = CacheService.CACHE_KEYS.RATE_LIMIT(key);
    return this.cache.get(cacheKey);
  }

  /**
   * Cache user URLs for dashboard
   */
  public setUserUrls(userId: string, urls: any[], ttl: number = 600): void {
    const key = CacheService.CACHE_KEYS.USER_URLS(userId);
    this.cache.set(key, urls, ttl);
  }

  /**
   * Get cached user URLs
   */
  public getUserUrls(userId: string): any[] | undefined {
    const key = CacheService.CACHE_KEYS.USER_URLS(userId);
    const data = this.cache.get(key);
    
    if (data !== undefined) {
      this.hitCount++;
      return data as any[];
    } else {
      this.missCount++;
      return undefined;
    }
  }

  /**
   * Cache popular URLs for homepage
   */
  public setPopularUrls(urls: any[], ttl: number = 1800): void {
    const key = CacheService.CACHE_KEYS.POPULAR_URLS();
    this.cache.set(key, urls, ttl);
  }

  /**
   * Get cached popular URLs
   */
  public getPopularUrls(): any[] | undefined {
    const key = CacheService.CACHE_KEYS.POPULAR_URLS();
    const data = this.cache.get(key);
    
    if (data !== undefined) {
      this.hitCount++;
      return data as any[];
    } else {
      this.missCount++;
      return undefined;
    }
  }

  /**
   * Cache statistics
   */
  public setStats(stats: any, ttl: number = 3600): void {
    const key = CacheService.CACHE_KEYS.STATS();
    this.cache.set(key, stats, ttl);
  }

  /**
   * Get cached statistics
   */
  public getStats(): any | undefined {
    const key = CacheService.CACHE_KEYS.STATS();
    const data = this.cache.get(key);
    
    if (data !== undefined) {
      this.hitCount++;
      return data;
    } else {
      this.missCount++;
      return undefined;
    }
  }

  /**
   * Invalidate URL cache when URL is updated
   */
  public invalidateUrl(shortCode: string): void {
    const key = CacheService.CACHE_KEYS.URL(shortCode);
    this.cache.del(key);
  }

  /**
   * Invalidate analytics cache
   */
  public invalidateAnalytics(urlId: string): void {
    const key = CacheService.CACHE_KEYS.ANALYTICS(urlId);
    this.cache.del(key);
  }

  /**
   * Invalidate user URLs cache
   */
  public invalidateUserUrls(userId: string): void {
    const key = CacheService.CACHE_KEYS.USER_URLS(userId);
    this.cache.del(key);
  }

  /**
   * Invalidate popular URLs cache
   */
  public invalidatePopularUrls(): void {
    const key = CacheService.CACHE_KEYS.POPULAR_URLS();
    this.cache.del(key);
  }

  /**
   * Invalidate statistics cache
   */
  public invalidateStats(): void {
    const key = CacheService.CACHE_KEYS.STATS();
    this.cache.del(key);
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    keys: number;
    hits: number;
    misses: number;
    hitRate: number;
    memoryUsage: any;
  } {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

    return {
      keys: this.cache.keys().length,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: this.cache.getStats()
    };
  }

  /**
   * Warm up cache with popular URLs
   */
  public async warmCache(popularUrls: any[]): Promise<void> {
    console.log(`Warming cache with ${popularUrls.length} popular URLs`);
    
    for (const url of popularUrls) {
      this.setUrl(url.shortCode, url, this.config.ttl * 2); // Longer TTL for popular URLs
    }
  }

  /**
   * Clear all cache
   */
  public flush(): void {
    this.cache.flushAll();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get all cached keys (for debugging)
   */
  public getKeys(): string[] {
    return this.cache.keys();
  }

  /**
   * Check if key exists in cache
   */
  public has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Get cache size
   */
  public getSize(): number {
    return this.cache.keys().length;
  }

  /**
   * Close cache service
   */
  public close(): void {
    this.cache.close();
  }
}
