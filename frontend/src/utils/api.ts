import { toast } from 'react-hot-toast';

import { config } from '../config';

// API Configuration
const API_BASE_URL = config.apiUrl;

// Security headers for all requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

// URL validation with security checks
export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    
    // Check for allowed protocols
    if (!config.security.allowedProtocols.includes(urlObj.protocol)) {
      toast.error('Only HTTP and HTTPS URLs are allowed');
      return false;
    }

    // Check for malicious patterns
    if (config.security.maliciousPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
      toast.error('URL contains potentially unsafe content');
      return false;
    }

    // Check URL length (including UTM parameters)
    if (url.length > config.maxUrlLength) {
      toast.error(`URL is too long (max ${config.maxUrlLength} characters)`);
      return false;
    }

    // Check for valid hostname
    if (!urlObj.hostname || urlObj.hostname.length < 1) {
      toast.error('Invalid URL format');
      return false;
    }

    // Check for localhost and private IPs
    if (config.security.blockedDomains.some(pattern => urlObj.hostname.includes(pattern))) {
      toast.error('Local or internal URLs are not allowed');
      return false;
    }

    // Validate UTM parameters if present
    const validUtmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const searchParams = new URLSearchParams(urlObj.search);
    
    for (const [key, value] of searchParams.entries()) {
      // Check if it's a UTM parameter
      if (key.startsWith('utm_')) {
        // Validate UTM parameter name
        if (!validUtmParams.includes(key)) {
          toast.error(`Invalid UTM parameter: ${key}`);
          return false;
        }
        
        // Validate UTM parameter value
        if (!value || value.length > 100 || /[<>'"()]/.test(value)) {
          toast.error(`Invalid value for ${key}`);
          return false;
        }
      }
    }

    // Validate path for security
    if (/[<>'"()]/.test(urlObj.pathname)) {
      toast.error('URL path contains invalid characters');
      return false;
    }

    return true;
  } catch (err) {
    toast.error('Invalid URL format');
    return false;
  }
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove JavaScript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 2048); // Limit length
};

// API request wrapper with security enhancements
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  try {
    // Merge default and custom headers
    const headers = {
      ...DEFAULT_HEADERS,
      ...options.headers,
    };

    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'omit', // Don't send credentials for now
    });

    // Check for rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Too many requests. Please try again in ${retryAfter || 'a few'} seconds.`);
    }

    // Handle other error responses
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'An error occurred');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the server. Please check your internet connection.');
      }
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
};

interface ApiResponse {
  success: boolean;
  data?: {
    shortUrl: string;
    originalUrl: string;
    qrCode: string;
  };
  error?: string;
}

// URL shortening API call
export const shortenUrl = async (originalUrl: string): Promise<ApiResponse> => {
  // Validate and sanitize input
  const sanitizedUrl = sanitizeInput(originalUrl);
  if (!validateUrl(sanitizedUrl)) {
    return {
      success: false,
      error: 'Invalid URL'
    };
  }

  return apiRequest('/api/urls', {
    method: 'POST',
    body: JSON.stringify({ originalUrl: sanitizedUrl }),
  });
};

// Rate limiting state
let requestCount = 0;
const WINDOW_MS = 60000; // 1 minute

// Reset request count periodically
setInterval(() => {
  requestCount = 0;
}, WINDOW_MS);

// Rate limiting middleware
export const checkRateLimit = (): boolean => {
  if (requestCount >= config.maxRequestsPerMinute) {
    toast.error(`Too many requests. Please try again in ${Math.ceil(WINDOW_MS / 1000)} seconds.`);
    return false;
  }
  requestCount++;
  return true;
};
