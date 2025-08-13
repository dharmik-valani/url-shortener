declare module 'user-agents' {
  export default class UserAgent {
    constructor(userAgent?: string);
    userAgent: string;
    browser: {
      name: string;
      version: string;
    };
    os: {
      name: string;
      version: string;
    };
    device: {
      type: 'mobile' | 'tablet' | 'desktop';
    };
  }
}
