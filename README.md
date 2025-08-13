# URL Shortener Service - Production Ready Guide

A high-performance URL shortening service designed to handle billions of redirects per month with sub-100ms latency.

## System Architecture

### Key Components
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CDN/LB    │────▶│   Frontend  │────▶│    Redis    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │            ┌─────────────┐            │
       └──────────▶│   Backend   │◀───────────┘
                   └─────────────┘
                         │
                  ┌─────────────┐
                  │  Database   │
                  └─────────────┘
```

## Production Readiness Checklist

### 1. Key Generation Strategy
- **Base62 Encoding**: Using [a-zA-Z0-9] for human-readable URLs
- **Collision Prevention**:
  - UUID + Timestamp + Random Salt combination
  - Pre-generation of unique keys in batches
  - Distributed ID generation using Snowflake algorithm
- **Length Optimization**: 6-8 characters supporting 62^8 = ~218 trillion unique combinations
- **Custom Alias Support**: With validation and reservation system

### 2. Storage Model
- **Primary Database**: PostgreSQL for ACID compliance
  - Partitioning by creation date
  - Hash partitioning for even distribution
  - Regular archival of expired URLs
- **Schema Optimization**:
  ```sql
  CREATE TABLE urls (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(8) UNIQUE,
    original_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    custom_alias VARCHAR(50) UNIQUE,
    user_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_short_code (short_code),
    INDEX idx_expires_at (expires_at),
    INDEX idx_custom_alias (custom_alias)
  ) PARTITION BY RANGE (created_at);
  ```

### 3. Caching Strategy
- **Multi-Level Caching**:
  1. L1: Application Memory Cache (Node-Cache)
  2. L2: Redis Cluster
  3. L3: CDN Caching
- **Cache Configuration**:
  - Redis Cluster with 3 master-slave pairs
  - Cache warm-up for popular URLs
  - LRU eviction policy
  - TTL-based expiration

### 4. Scalability & Performance
- **Horizontal Scaling**:
  - Kubernetes for container orchestration
  - Auto-scaling based on CPU/Memory metrics
  - Load balancing with consistent hashing
- **Database Scaling**:
  - Read replicas for analytics
  - Write sharding for URL creation
  - Connection pooling
- **Performance Optimizations**:
  - Async logging
  - Batch processing for analytics
  - Connection keep-alive
  - Response compression

### 5. High Availability & Fault Tolerance
- **Infrastructure**:
  - Multi-AZ deployment
  - Active-Active configuration
  - Automated failover
- **Monitoring & Alerts**:
  - Prometheus + Grafana
  - Custom dashboards for:
    - Redirect latency
    - Cache hit rates
    - Error rates
    - System resources
- **Circuit Breakers**:
  - For database connections
  - For external service calls
  - For rate limiting

### 6. Security Measures
- **Rate Limiting**:
  ```javascript
  // Per IP: 100 requests/minute
  // Per User: 1000 requests/minute
  // Global: 1M requests/minute
  ```
- **Input Validation**:
  - URL format validation
  - Domain blacklisting
  - Content-type verification
- **Attack Prevention**:
  - DDoS protection
  - SQL injection prevention
  - XSS protection
  - CSRF tokens
- **Access Control**:
  - API authentication
  - Role-based access
  - IP whitelisting

### 7. Analytics & Tracking
- **Click Tracking**:
  - Asynchronous logging
  - Batch processing
  - Real-time aggregation
- **Metrics Collected**:
  - Timestamp
  - User Agent
  - IP Address (anonymized)
  - Referrer
  - Device info
- **Storage**:
  - Time-series database (InfluxDB)
  - Data warehousing (BigQuery)

### 8. Infrastructure Requirements
For handling billions of redirects/month:
- **Compute**:
  - 20+ application servers
  - 8 CPU cores each
  - 32GB RAM minimum
- **Cache**:
  - Redis Cluster: 6 nodes (3 master-slave pairs)
  - 64GB RAM per node
- **Database**:
  - Primary: 1 master, 2 read replicas
  - 32 CPU cores
  - 128GB RAM
  - 2TB NVMe SSD
- **Network**:
  - 10Gbps network
  - CDN with global PoPs
  - Load balancers with SSL termination

### 9. Performance Targets
- **Latency**:
  - P95 < 100ms for redirects
  - P99 < 200ms for redirects
  - Creation < 500ms
- **Throughput**:
  - 50K redirects/second
  - 1K creations/second
- **Availability**:
  - 99.99% uptime
  - < 5min monthly downtime

### 10. Cost Optimization
- **CDN Caching**: ~70% hit rate
- **Database Optimization**:
  - Connection pooling
  - Query optimization
  - Regular maintenance
- **Resource Scaling**:
  - Auto-scaling policies
  - Reserved instances
  - Spot instances for analytics

### 11. Deployment Strategy
- **CI/CD Pipeline**:
  ```yaml
  stages:
    - test
    - build
    - security_scan
    - deploy_staging
    - performance_test
    - deploy_production
  ```
- **Blue-Green Deployment**:
  - Zero-downtime updates
  - Quick rollback capability
- **Monitoring**:
  - Health checks
  - Performance metrics
  - Error tracking

### 12. Maintenance
- **Database**:
  - Regular backups
  - Index optimization
  - Vacuum operations
- **Cache**:
  - Regular eviction
  - Memory monitoring
  - Hit rate optimization
- **Analytics**:
  - Data aggregation
  - Regular archival
  - Compliance checks

## Quick Start for Development

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
npm install
npm run dev
```

## Production Deployment

```bash
# Build Docker images
docker-compose build

# Deploy to Kubernetes
kubectl apply -f k8s/

# Monitor
kubectl get pods
kubectl logs -f deployment/url-shortener
```

## Performance Testing
```bash
# Run load test
k6 run load-tests/redirect-test.js

# Target metrics
- 50K requests/second
- P95 latency < 100ms
- Error rate < 0.1%
```

## License
MIT License - see the [LICENSE](LICENSE) file for details