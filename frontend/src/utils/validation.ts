import { toast } from 'react-hot-toast';

export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    
    // Check for allowed protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      toast.error('Only HTTP and HTTPS URLs are allowed');
      return false;
    }

    // Check for malicious patterns
    const maliciousPatterns = [
      'javascript:', 'data:', 'vbscript:', 'file:', 
      '<script', 'onclick=', 'onerror=', 'onload=',
      '../', '..\\'
    ];
    
    if (maliciousPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
      toast.error('URL contains potentially unsafe content');
      return false;
    }

    // Check URL length
    if (url.length > 2048) {
      toast.error('URL is too long (max 2048 characters)');
      return false;
    }

    // Check for valid hostname
    if (!urlObj.hostname || urlObj.hostname.length < 1) {
      toast.error('Invalid URL format');
      return false;
    }

    // Check for localhost and private IPs
    const blockedDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'internal',
      'local',
    ];

    if (blockedDomains.some(pattern => urlObj.hostname.includes(pattern))) {
      toast.error('Local or internal URLs are not allowed');
      return false;
    }

    return true;
  } catch (err) {
    toast.error('Invalid URL format');
    return false;
  }
};
