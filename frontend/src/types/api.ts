export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UrlData {
  shortUrl: string;
  originalUrl: string;
  qrCode: string;
}
