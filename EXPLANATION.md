# URL Shortener Service - Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Decisions](#architecture-decisions)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Security Implementation](#security-implementation)
6. [Performance Optimizations](#performance-optimizations)
7. [Scalability Considerations](#scalability-considerations)
8. [Development Practices](#development-practices)

## Project Overview

### Purpose
The URL Shortener Service is designed to handle billions of redirects per month while maintaining sub-100ms latency. It provides secure, scalable, and efficient URL shortening with features like click tracking, QR code generation, and optional URL expiry.

### Key Features
- Short URL generation (6-8 characters)
- QR code generation
- Click analytics
- Custom aliases
- URL expiration
- UTM parameter support
- Security validations
- Real-time statistics

## Architecture Decisions

### Technology Stack Selection

#### Frontend
```typescript
Stack: {
  Framework: "React 18 with TypeScript",
  Build Tool: "Vite",
  UI Library: "Material-UI v5",
  State Management: "@tanstack/react-query",
  Form Handling: "React Hook Form",
  Notifications: "React Hot Toast",
  HTTP Client: "Axios"
}

Rationale: {
  Vite: "Faster build times, better DX",
  MUI: "Production-ready components, consistent design",
  React Query: "Efficient server state management",
  TypeScript: "Type safety, better maintainability"
}
```

#### Backend
```typescript
Stack: {
  Runtime: "Node.js 20.x",
  Framework: "Express.js with TypeScript",
  Database: "SQLite (PostgreSQL-ready)",
  Caching: "node-cache (Redis-ready)",
  Security: ["helmet", "cors", "rate-limit"],
  Validation: "joi",
  Documentation: "OpenAPI/Swagger"
}

Rationale: {
  Node.js: "Non-blocking I/O, ideal for high concurrency",
  TypeScript: "Type safety, better error catching",
  SQLite: "Quick development, easy migration path",
  Express: "Lightweight, extensible, battle-tested"
}
```

## Frontend Architecture

### Modular Structure
```
frontend/
├── src/
│   ├── features/           # Feature-based modules
│   │   └── url-shortener/  # URL shortener feature
│   │       ├── components/ # Feature-specific components
│   │       ├── hooks/      # Custom hooks
│   │       └── types/      # Type definitions
│   ├── components/         # Shared components
│   ├── layouts/           # Layout components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── utils/             # Utility functions
│   └── styles/            # Global styles
```

### Why This Structure?

1. **Feature-First Organization**
   ```typescript
   // Example: URL Shortener Feature Module
   features/
     url-shortener/
       ├── components/      // UI Components
       │   ├── UrlForm.tsx    // URL input form
       │   └── UrlResult.tsx  // Shortened URL display
       ├── hooks/           // Business Logic
       │   └── useUrlShortener.ts
       └── types/           // Type Definitions
           └── url.types.ts
   ```
   - Isolates feature-specific code
   - Makes the codebase more maintainable
   - Easier to implement new features
   - Better code reusability

2. **Shared Components**
   ```typescript
   components/
     ├── SecurityBadges.tsx   // Security indicators
     ├── LoadingSpinner.tsx   // Loading states
     └── ErrorBoundary.tsx    // Error handling
   ```
   - Reusable across features
   - Consistent UI/UX
   - Easier maintenance

3. **Service Layer**
   ```typescript
   // Example: API Service
   services/api.ts
   
   export const apiRequest = async <T>(
     endpoint: string,
     options?: RequestInit
   ): Promise<T> => {
     const response = await fetch(`${API_URL}${endpoint}`, {
       ...options,
       headers: {
         'Content-Type': 'application/json',
         ...options?.headers,
       },
     });
     
     if (!response.ok) {
       throw new Error('API request failed');
     }
     
     return response.json();
   };
   ```
   - Centralized API communication
   - Consistent error handling
   - Type-safe responses

## Security Implementation

### Frontend Security

1. **URL Validation**
   ```typescript
   // utils/validation.ts
   export const validateUrl = (url: string): boolean => {
     try {
       const urlObj = new URL(url);
       
       // Protocol validation
       if (!['http:', 'https:'].includes(urlObj.protocol)) {
         return false;
       }
       
       // Malicious pattern check
       const maliciousPatterns = [
         'javascript:',
         'data:',
         'vbscript:',
         '<script',
         'onclick='
       ];
       
       if (maliciousPatterns.some(pattern => 
           url.toLowerCase().includes(pattern))) {
         return false;
       }
       
       // UTM parameter validation
       const utmParams = ['source', 'medium', 'campaign', 'term', 'content'];
       const searchParams = new URLSearchParams(urlObj.search);
       
       for (const [key, value] of searchParams.entries()) {
         if (key.startsWith('utm_')) {
           const param = key.replace('utm_', '');
           if (!utmParams.includes(param) || !value) {
             return false;
           }
         }
       }
       
       return true;
     } catch {
       return false;
     }
   };
   ```

2. **Input Sanitization**
   ```typescript
   // utils/sanitization.ts
   export const sanitizeInput = (input: string): string => {
     return input
       .replace(/[<>]/g, '') // Remove < >
       .replace(/javascript:/gi, '') // Remove javascript:
       .trim();
   };
   ```

3. **Rate Limiting**
   ```typescript
   // hooks/useRateLimit.ts
   export const useRateLimit = (limit: number, windowMs: number) => {
     const [requests, setRequests] = useState<number[]>([]);
     
     const checkLimit = useCallback(() => {
       const now = Date.now();
       const windowStart = now - windowMs;
       
       // Clean old requests
       const validRequests = requests.filter(time => time > windowStart);
       setRequests(validRequests);
       
       // Check limit
       return validRequests.length < limit;
     }, [requests, limit, windowMs]);
     
     const addRequest = useCallback(() => {
       if (checkLimit()) {
         setRequests(prev => [...prev, Date.now()]);
         return true;
       }
       return false;
     }, [checkLimit]);
     
     return { addRequest, checkLimit };
   };
   ```

## Performance Optimizations

### Frontend Performance

1. **Code Splitting**
   ```typescript
   // App.tsx
   const Analytics = lazy(() => import('./features/analytics'));
   const QRCode = lazy(() => import('./features/qr-code'));
   ```

2. **Memoization**
   ```typescript
   // components/UrlResult.tsx
   const MemoizedQRCode = memo(QRCode);
   const MemoizedCopyButton = memo(CopyButton);
   ```

3. **Debouncing**
   ```typescript
   // hooks/useDebounce.ts
   export const useDebounce = <T>(value: T, delay: number): T => {
     const [debouncedValue, setDebouncedValue] = useState<T>(value);
     
     useEffect(() => {
       const handler = setTimeout(() => {
         setDebouncedValue(value);
       }, delay);
       
       return () => {
         clearTimeout(handler);
       };
     }, [value, delay]);
     
     return debouncedValue;
   };
   ```

## Development Practices

### Code Quality

1. **TypeScript Best Practices**
   ```typescript
   // Good: Strong typing
   interface UrlData {
     originalUrl: string;
     customAlias?: string;
     expiresAt?: Date;
   }
   
   // Bad: Avoid any
   function processUrl(data: any) { ... }
   
   // Good: Generic type
   function processUrl<T extends UrlData>(data: T) { ... }
   ```

2. **Error Handling**
   ```typescript
   // services/api.ts
   export class ApiError extends Error {
     constructor(
       public status: number,
       public message: string,
       public data?: any
     ) {
       super(message);
       this.name = 'ApiError';
     }
   }
   
   export const handleApiError = (error: unknown) => {
     if (error instanceof ApiError) {
       toast.error(error.message);
     } else {
       toast.error('An unexpected error occurred');
       console.error(error);
     }
   };
   ```

3. **Testing Strategy**
   ```typescript
   // __tests__/UrlForm.test.tsx
   describe('UrlForm', () => {
     it('validates URLs correctly', async () => {
       const { getByRole, findByText } = render(<UrlForm />);
       
       // Invalid URL
       fireEvent.change(getByRole('textbox'), {
         target: { value: 'invalid-url' }
       });
       fireEvent.click(getByRole('button'));
       
       expect(await findByText('Invalid URL')).toBeInTheDocument();
       
       // Valid URL
       fireEvent.change(getByRole('textbox'), {
         target: { value: 'https://example.com' }
       });
       fireEvent.click(getByRole('button'));
       
       expect(await findByText('URL shortened successfully')).toBeInTheDocument();
     });
   });
   ```

## Scalability Considerations

### Frontend Scalability

1. **State Management**
   ```typescript
   // hooks/useUrlShortener.ts
   export const useUrlShortener = () => {
     const queryClient = useQueryClient();
     
     const shortenMutation = useMutation({
       mutationFn: (url: string) => api.shortenUrl(url),
       onSuccess: (data) => {
         queryClient.setQueryData(['shortUrl', data.id], data);
         queryClient.invalidateQueries(['recentUrls']);
       }
     });
     
     return {
       shortenUrl: shortenMutation.mutate,
       isLoading: shortenMutation.isLoading,
       error: shortenMutation.error
     };
   };
   ```

2. **Caching Strategy**
   ```typescript
   // services/queryClient.ts
   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         cacheTime: 30 * 60 * 1000, // 30 minutes
         retry: 3,
         retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
       }
     }
   });
   ```

## Conclusion

This modular architecture provides:
- Clear separation of concerns
- Easy maintenance and updates
- Strong security measures
- Optimal performance
- Scalability readiness
- Type safety
- Consistent error handling
- Comprehensive testing capabilities

The structure is designed to support growth from a small application to a system handling billions of requests while maintaining code quality and developer productivity.
