import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * High-performance URL shortener generator
 * Designed for billions of URLs with collision avoidance
 * 
 * Strategy:
 * 1. Use Base62 encoding for maximum character efficiency
 * 2. Combine UUID + timestamp + random salt for uniqueness
 * 3. Hash to fixed length for consistent short codes
 * 4. Implement retry mechanism for collision handling
 */

const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SHORT_CODE_LENGTH = 8; // 8 characters = 62^8 = ~218 trillion combinations
const MAX_RETRIES = 5;

export class UrlGenerator {
  private static instance: UrlGenerator;
  private collisionCache: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): UrlGenerator {
    if (!UrlGenerator.instance) {
      UrlGenerator.instance = new UrlGenerator();
    }
    return UrlGenerator.instance;
  }

  /**
   * Generate a unique short code for URL shortening
   * Optimized for high throughput and collision avoidance
   */
  public generateShortCode(): string {
    let attempts = 0;
    let shortCode: string;

    do {
      if (attempts >= MAX_RETRIES) {
        throw new Error('Unable to generate unique short code after maximum retries');
      }

      // Create a unique seed combining multiple entropy sources
      const seed = this.createUniqueSeed();
      
      // Generate hash for consistent length
      const hash = crypto.createHash('sha256').update(seed).digest('hex');
      
      // Convert to Base62 for maximum character efficiency
      shortCode = this.hashToBase62(hash).substring(0, SHORT_CODE_LENGTH);
      
      attempts++;
    } while (this.collisionCache.has(shortCode));

    // Add to collision cache (in production, this would be a distributed cache)
    this.collisionCache.add(shortCode);
    
    return shortCode;
  }

  /**
   * Generate custom alias with validation
   * For user-defined short URLs
   */
  public generateCustomAlias(alias: string): string {
    const cleanAlias = this.sanitizeAlias(alias);
    
    if (cleanAlias.length < 3 || cleanAlias.length > 20) {
      throw new Error('Custom alias must be between 3 and 20 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanAlias)) {
      throw new Error('Custom alias can only contain letters, numbers, hyphens, and underscores');
    }

    if (this.collisionCache.has(cleanAlias)) {
      throw new Error('Custom alias already exists');
    }

    this.collisionCache.add(cleanAlias);
    return cleanAlias;
  }

  /**
   * Create a unique seed combining multiple entropy sources
   * This ensures uniqueness even at scale
   */
  private createUniqueSeed(): string {
    const components = [
      uuidv4(), // UUID for uniqueness
      Date.now().toString(), // Timestamp
      Math.random().toString(36), // Random number
      process.hrtime.bigint().toString(), // High-resolution time
      crypto.randomBytes(16).toString('hex') // Cryptographic randomness
    ];

    return components.join('');
  }

  /**
   * Convert hash to Base62 encoding
   * More efficient than Base64 for URL shortening
   */
  private hashToBase62(hash: string): string {
    let num = BigInt('0x' + hash);
    let result = '';

    while (num > 0n) {
      result = BASE62_CHARS[Number(num % 62n)] + result;
      num = num / 62n;
    }

    // Pad with leading zeros if needed
    while (result.length < SHORT_CODE_LENGTH) {
      result = '0' + result;
    }

    return result;
  }

  /**
   * Sanitize custom alias input
   */
  private sanitizeAlias(alias: string): string {
    return alias
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .replace(/_{2,}/g, '_')
      .replace(/-{2,}/g, '-');
  }

  /**
   * Validate if a short code is valid
   */
  public isValidShortCode(code: string): boolean {
    if (!code || code.length !== SHORT_CODE_LENGTH) {
      return false;
    }

    return /^[0-9A-Za-z]+$/.test(code);
  }

  /**
   * Get collision statistics (for monitoring)
   */
  public getCollisionStats(): { totalCodes: number; collisionRate: number } {
    return {
      totalCodes: this.collisionCache.size,
      collisionRate: 0 // In production, track actual collision attempts
    };
  }

  /**
   * Clear collision cache (for testing)
   */
  public clearCache(): void {
    this.collisionCache.clear();
  }
}

// Export singleton instance
export const urlGenerator = UrlGenerator.getInstance();
