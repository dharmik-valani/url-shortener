export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  maxRequestsPerMinute: Number(import.meta.env.VITE_MAX_REQUESTS_PER_MINUTE) || 50,
  maxUrlLength: Number(import.meta.env.VITE_MAX_URL_LENGTH) || 2048,
  security: {
    allowedProtocols: ['http:', 'https:'],
    blockedDomains: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'internal',
      'local',
    ],
    maliciousPatterns: [
      'javascript:',
      'data:',
      'vbscript:',
      'file:',
      '<script',
      'onclick=',
      'onerror=',
      'onload=',
      '../',
      '..\\'
    ],
    botPatterns: [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /perl/i
    ],
  }
} as const;
