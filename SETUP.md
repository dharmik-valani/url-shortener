# URL Shortener Setup Guide

This guide will help you set up and run the URL Shortener application locally.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## Project Structure

```
URLShortner/
├── backend/          # Node.js TypeScript backend
├── frontend/         # React TypeScript frontend
├── README.md         # Project overview
└── SETUP.md         # This setup guide
```

## Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Start development server
npm run dev
```

The backend will start on `http://localhost:3001`

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will start on `http://localhost:3000`

## Environment Configuration

### Backend (.env)

```env
# Server Configuration
PORT=3001
NODE_ENV=development
BASE_URL=http://localhost:3001

# Database Configuration
DB_FILENAME=./urlshortener.db

# Cache Configuration
CACHE_TTL=3600
CACHE_CHECK_PERIOD=600
CACHE_MAX_KEYS=10000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_BASE_URL=http://localhost:3000
```

## Testing the Application

1. **Create a Short URL:**
   - Go to `http://localhost:3000`
   - Enter a long URL (e.g., `https://www.google.com/search?q=very+long+search+query`)
   - Click "Create Short URL"
   - Copy the generated short URL

2. **Test URL Redirection:**
   - Open the short URL in a new tab
   - Verify it redirects to the original URL

3. **Test Analytics:**
   - Click "View Analytics" on the created URL
   - Check the analytics dashboard

## API Endpoints

### URL Management
- `POST /api/urls` - Create a new short URL
- `GET /:shortCode` - Redirect to original URL
- `GET /api/urls/:shortCode/analytics` - Get URL analytics
- `PUT /api/urls/:shortCode` - Update URL
- `DELETE /api/urls/:shortCode` - Delete URL

### System
- `GET /health` - Health check
- `GET /api/stats` - Service statistics

## Features Implemented

### ✅ Core Features
- URL shortening with Base62 encoding
- Custom aliases
- URL expiration dates
- Maximum click limits
- Password protection
- QR code generation
- Click tracking and analytics
- Rate limiting
- Input validation and security

### ✅ Performance Optimizations
- In-memory caching (NodeCache)
- Database indexing for fast lookups
- Async analytics tracking
- Connection pooling
- WAL mode for SQLite
- Compression middleware

### ✅ Security Features
- Input sanitization
- Malicious URL detection
- Rate limiting (100 requests/minute)
- CORS configuration
- Helmet security headers
- SQL injection prevention

### ✅ Frontend Features
- Modern React with TypeScript
- Responsive design with Tailwind CSS
- Real-time form validation
- Copy to clipboard functionality
- QR code display and download
- Web Share API integration
- Error handling and user feedback

## Database Schema

### URLs Table
```sql
CREATE TABLE urls (
  id TEXT PRIMARY KEY,
  short_code TEXT UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  is_active BOOLEAN DEFAULT 1,
  user_id TEXT,
  custom_alias TEXT UNIQUE,
  password TEXT,
  max_clicks INTEGER,
  current_clicks INTEGER DEFAULT 0
);
```

### Clicks Table
```sql
CREATE TABLE clicks (
  id TEXT PRIMARY KEY,
  url_id TEXT NOT NULL,
  short_code TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_unique BOOLEAN DEFAULT 1
);
```

## Performance Targets

- **URL Generation:** < 50ms
- **URL Redirection:** < 100ms
- **Support:** 1M+ URLs, 1B+ redirects/month
- **Uptime:** 99.9%

## Scalability Considerations

### Current Implementation
- SQLite for development (easily migratable to PostgreSQL)
- In-memory caching (can be replaced with Redis)
- Single-server architecture

### Production Scaling
- **Database:** PostgreSQL with read replicas
- **Caching:** Redis cluster
- **Load Balancing:** Nginx/HAProxy
- **CDN:** Cloudflare/AWS CloudFront
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Kill process on port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **Database locked:**
   ```bash
   # Remove database file and restart
   rm backend/urlshortener.db
   npm run dev
   ```

3. **CORS errors:**
   - Check CORS_ORIGIN in backend .env
   - Ensure frontend is running on correct port

4. **Module not found errors:**
   ```bash
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```

## Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Run linter
npm run lint:fix     # Fix linting issues
```

### Frontend
```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Run linter
npm run lint:fix     # Fix linting issues
```

## Next Steps

1. **Add Authentication:** Implement user registration/login
2. **Enhance Analytics:** Add charts and graphs
3. **API Documentation:** Add Swagger/OpenAPI docs
4. **Testing:** Add unit and integration tests
5. **Deployment:** Set up CI/CD pipeline
6. **Monitoring:** Add application monitoring
7. **Internationalization:** Add multi-language support

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the code comments
3. Check the console logs for errors
4. Verify environment configuration

---

**Happy URL Shortening! 🚀**
