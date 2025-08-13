# URL Shortener Service

A high-performance URL shortening service built with React TypeScript (Frontend) and Node.js TypeScript (Backend).

## Features

- 🚀 Fast URL shortening with <100ms redirect time
- 📱 Modern, responsive UI
- 🔄 QR code generation
- 📊 Click tracking and analytics
- 🔒 Secure and scalable
- 💾 SQLite database (easily upgradable to PostgreSQL)
- 🚦 Rate limiting and abuse prevention
- 🎯 Custom URL aliases support

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Material-UI (MUI) for components
- React Query for state management
- React Hot Toast for notifications

### Backend
- Node.js with TypeScript
- Express.js for API
- SQLite for database
- Node-cache for in-memory caching
- QR Code generation
- Rate limiting and security features

## Getting Started

### Prerequisites
- Node.js (Latest LTS version)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/dharmik-valani/url-shortener.git
cd url-shortener
```

2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

3. Install Backend Dependencies
```bash
cd ../backend
npm install
```

### Running the Application

1. Start the Backend Server
```bash
cd backend
npm run dev
```
The backend will start on http://localhost:3001

2. Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will start on http://localhost:5173

## Architecture

- Separate frontend and backend services
- RESTful API design
- In-memory caching for hot URLs
- Asynchronous analytics tracking
- Prepared statements for SQL queries
- Rate limiting per IP
- Security headers and CORS protection

## Performance

- <100ms target for URL redirects
- Optimized database queries
- Connection pooling
- Batch operations support
- CDN-ready static assets
- Compressed responses

## Security Features

- Input validation and sanitization
- Rate limiting
- SQL injection prevention
- XSS protection
- Security headers
- CORS configuration
- Request validation

## Scalability

The service is designed to handle billions of URLs and redirections with:
- Database sharding capability
- Horizontal scaling support
- Cache optimization
- Batch processing
- Asynchronous operations
- Load balancer ready

## License

MIT License - see the [LICENSE](LICENSE) file for details