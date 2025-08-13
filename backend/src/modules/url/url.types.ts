export interface IUrlCreate {
  originalUrl: string;
  title?: string;
  description?: string;
  expiresAt?: Date;
  customAlias?: string;
  maxClicks?: number;
  password?: string;
}

export interface IUrlResponse {
  shortUrl: string;
  originalUrl: string;
  qrCode: string;
}

export interface IUrlStats {
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  topUrls: Array<{
    shortCode: string;
    clicks: number;
    originalUrl: string;
  }>;
}

export interface IUrlAnalytics {
  shortCode: string;
  clicks: number;
  uniqueVisitors: number;
  countries: Record<string, number>;
  browsers: Record<string, number>;
  devices: Record<string, number>;
  referrers: Record<string, number>;
  clicksOverTime: Array<{
    date: string;
    clicks: number;
  }>;
}

export interface ICacheEntry {
  originalUrl: string;
  expiresAt?: Date;
  clicks: number;
}
