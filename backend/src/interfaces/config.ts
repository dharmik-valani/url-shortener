export interface IConfig {
  app: {
    port: number;
    nodeEnv: string;
    baseUrl: string;
  };
  database: {
    filename: string;
    verbose: boolean;
    maxConnections: number;
    timeout: number;
  };
  cache: {
    ttl: number;
    checkperiod: number;
    maxKeys: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    message: string;
  };
  security: {
    apiKey: string;
    jwtSecret: string;
    maxRequestSize: number;
    blockedIps: string[];
    allowedOrigins: string[];
    corsEnabled: boolean;
    sslEnabled: boolean;
    bcryptRounds: number;
  };
  url: {
    minLength: number;
    maxLength: number;
    codeLength: number;
    defaultExpiry: number;
    allowCustomAlias: boolean;
    reservedPaths: string[];
  };
  analytics: {
    enabled: boolean;
    retentionDays: number;
    detailedLogs: boolean;
    trackBots: boolean;
  };
  monitoring: {
    enabled: boolean;
    logLevel: string;
    logFormat: string;
    sentryDsn?: string;
  };
}
