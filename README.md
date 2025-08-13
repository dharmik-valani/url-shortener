# URL Shortener Service - Production Ready Architecture

A high-performance URL shortening service designed to handle billions of redirects per month with sub-100ms latency.

## System Architecture

### High-Level Architecture
```
                                     ┌─────────────────┐
                                     │   CloudFlare    │
                                     │      CDN        │
                                     └────────┬────────┘
                                              │
                                     ┌────────┴────────┐
                                     │   AWS Route53   │
                                     │  DNS + Routing  │
                                     └────────┬────────┘
                                              │
                                     ┌────────┴────────┐
                                     │    AWS WAF +    │
                                     │ Shield (DDoS)   │
                                     └────────┬────────┘
                                              │
┌─────────────────┐              ┌───────────┴──────────┐
│  Elastic Cache  │◀─────────────│    Load Balancer     │
│  Redis Cluster  │              │    (AWS ALB/NLB)     │
└─────────────────┘              └───────────┬──────────┘
                                             │
                                  ┌──────────┴───────────┐
                                  │    Kubernetes (EKS)   │
                                  │                       │
                     ┌───────────►│ ┌─────┐ ┌─────┐     │
┌─────────────────┐  │           │ │Pod 1│ │Pod 2│     │◀──┐
│   PostgreSQL    │  │           │ └─────┘ └─────┘     │   │
│ Primary + Reads │◀─┘           │                       │   │
└─────────────────┘              └───────────┬───────────┘   │
        │                                    │                │
        │                         ┌──────────┴───────────┐   │
        │                         │  Prometheus + Grafana │   │
        └────────────────────────►│     Monitoring       │───┘
                                 └──────────────────────┘
```

### Components for Billion-Scale Operations

1. **Global CDN Layer**
   ```
   CloudFlare Enterprise
   ├── 250+ Edge Locations
   ├── DDoS Protection (100 Tbps)
   ├── SSL/TLS Termination
   ├── Cache Hit Ratio: ~85%
   └── Load Balancing
   ```

2. **Database Cluster**
   ```
   PostgreSQL (Amazon Aurora)
   ├── Primary Node (Write)
   │   └── 32 vCPUs, 128GB RAM
   ├── Read Replicas (6x)
   │   └── 16 vCPUs, 64GB RAM each
   ├── Storage: Auto-scaling
   └── Backup: Continuous + Snapshots
   ```

3. **Caching Layer**
   ```
   Redis Enterprise Cluster
   ├── 6 Shards (3 Master-Replica pairs)
   ├── 64GB RAM per node
   ├── AOF Persistence
   ├── Cross-zone replication
   └── Auto-failover
   ```

4. **Application Layer**
   ```
   Kubernetes Cluster (EKS)
   ├── 3 Availability Zones
   ├── Node Groups
   │   ├── Application: 20+ nodes
   │   │   └── t3.2xlarge (8 vCPU, 32GB)
   │   └── Monitoring: 3 nodes
   │       └── t3.xlarge (4 vCPU, 16GB)
   └── Auto-scaling (3-50 nodes)
   ```

## Production Readiness Features

### 1. High Performance Architecture
```yaml
Performance Targets:
  Redirect Latency:
    p50: < 50ms
    p95: < 100ms
    p99: < 200ms
  Throughput:
    Redirects: 50K/second
    Creations: 1K/second
  Cache Hit Ratio: > 85%
  Error Rate: < 0.01%
```

### 2. Security Measures
```yaml
Security Layers:
  Network:
    - AWS Shield Advanced (DDoS)
    - WAF Rules
    - Network ACLs
    - Security Groups
    - Private Subnets
  
  Application:
    - Rate Limiting:
        global: 1M/minute
        per_ip: 100/minute
        per_user: 1000/minute
    - Input Validation
    - SQL Injection Prevention
    - XSS Protection
    - CSRF Tokens
    
  Authentication:
    - API Keys
    - JWT Tokens
    - OAuth2 (optional)
    
  Encryption:
    - TLS 1.3
    - Data at Rest
    - Data in Transit
```

### 3. Scalability Features
```yaml
Horizontal Scaling:
  - Auto-scaling groups
  - Multi-AZ deployment
  - Read replicas
  - Sharded caching

Vertical Scaling:
  - CPU optimization
  - Memory management
  - Connection pooling
  - Query optimization

Data Management:
  - Database partitioning
  - Archival strategy
  - Backup automation
  - Data retention policies
```

### 4. Monitoring & Alerting
```yaml
Metrics Collection:
  System:
    - CPU/Memory usage
    - Network I/O
    - Disk usage
    - Connection counts
  
  Application:
    - Request latency
    - Error rates
    - Cache hit rates
    - URL creation rate
  
  Business:
    - Active URLs
    - Click patterns
    - Geographic distribution
    - Peak usage times

Alerting:
  - PagerDuty integration
  - Slack notifications
  - Email alerts
  - SMS for critical issues
```

## Production Deployment Steps

### 1. Infrastructure Setup
```bash
# Create VPC and Networking
terraform init
terraform apply -var-file=prod.tfvars

# Setup Kubernetes Cluster
eksctl create cluster -f cluster-config.yaml

# Setup Database
helm install postgresql bitnami/postgresql -f values-prod.yaml

# Setup Redis
helm install redis bitnami/redis -f values-prod.yaml
```

### 2. Application Deployment
```bash
# Deploy Backend
kubectl apply -f k8s/backend/
kubectl apply -f k8s/frontend/
kubectl apply -f k8s/ingress/

# Setup Monitoring
helm install prometheus prometheus-community/kube-prometheus-stack
helm install grafana grafana/grafana

# Setup Logging
helm install elasticsearch elastic/elasticsearch
helm install kibana elastic/kibana
helm install filebeat elastic/filebeat
```

### 3. Security Configuration
```bash
# Setup WAF
aws wafv2 create-web-acl --name url-shortener-waf \
  --scope REGIONAL \
  --default-action Block={} \
  --rules file://waf-rules.json

# Setup Network Policies
kubectl apply -f k8s/network-policies/

# Setup SSL
kubectl apply -f k8s/cert-manager/
```

## Scaling for Billions

### 1. Database Scaling
```sql
-- Partitioning Strategy
CREATE TABLE urls (
    id BIGSERIAL,
    short_code VARCHAR(8),
    original_url TEXT,
    created_at TIMESTAMP,
    expires_at TIMESTAMP,
    clicks BIGINT,
    PRIMARY KEY (created_at, id)
) PARTITION BY RANGE (created_at);

-- Create Monthly Partitions
CREATE TABLE urls_y2024m01 PARTITION OF urls
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 2. Caching Strategy
```yaml
Cache Layers:
  L1: Application Memory
    - Size: 1GB per pod
    - TTL: 60 seconds
    
  L2: Redis Cluster
    - Size: 384GB total
    - TTL: 24 hours
    
  L3: CDN
    - TTL: 7 days
    - Purge: On-demand
```

### 3. Load Balancing
```yaml
Load Balancer Configuration:
  Algorithm: Least Connections
  Health Checks:
    Interval: 5s
    Timeout: 2s
    Healthy Threshold: 2
    Unhealthy Threshold: 3
  SSL Termination: Yes
  Connection Draining: 60s
```

## Performance Testing

```bash
# Run load test
k6 run -e URLS=1000000 -e RATE=1000 load-tests/redirect-test.js

# Monitor metrics
watch 'kubectl top pods -n url-shortener'

# Check error rates
kubectl logs -l app=url-shortener | grep ERROR | wc -l
```

## Production Checklist

- [ ] Infrastructure
  - [ ] Multi-AZ deployment
  - [ ] Auto-scaling configured
  - [ ] Backup strategy implemented
  - [ ] DR plan tested

- [ ] Security
  - [ ] WAF rules configured
  - [ ] SSL certificates installed
  - [ ] Rate limiting tested
  - [ ] Security scanning setup

- [ ] Monitoring
  - [ ] Metrics collection active
  - [ ] Alerts configured
  - [ ] Dashboards created
  - [ ] Log aggregation setup

- [ ] Performance
  - [ ] Load testing completed
  - [ ] Cache warming strategy
  - [ ] CDN configuration
  - [ ] Database optimization

## License
MIT License - see the [LICENSE](LICENSE) file for details