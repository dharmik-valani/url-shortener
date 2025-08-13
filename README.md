# URL Shortener Service - Production Deployment Guide

A high-performance URL shortening service designed to handle billions of redirects per month with sub-100ms latency.

## Step-by-Step Production Deployment Guide

### Step 1: Infrastructure Setup

1. **Cloud Provider Setup** (Example with AWS):
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install

   # Configure AWS
   aws configure
   ```

2. **Kubernetes Cluster Setup**:
   ```bash
   # Create EKS cluster
   eksctl create cluster \\
     --name url-shortener \\
     --region us-east-1 \\
     --nodes 3 \\
     --nodes-min 3 \\
     --nodes-max 10 \\
     --node-type t3.xlarge
   ```

3. **Database Setup**:
   ```bash
   # Create PostgreSQL RDS instance
   aws rds create-db-instance \\
     --db-instance-identifier url-shortener-db \\
     --db-instance-class db.r5.2xlarge \\
     --engine postgres \\
     --master-username admin \\
     --master-user-password <password> \\
     --allocated-storage 1000 \\
     --multi-az

   # Initialize database schema
   psql -h <db-host> -U admin -d url_shortener -f schema.sql
   ```

4. **Redis Cluster Setup**:
   ```bash
   # Create Redis cluster
   aws elasticache create-replication-group \\
     --replication-group-id url-shortener-cache \\
     --replication-group-description "Cache for URL Shortener" \\
     --num-cache-clusters 6 \\
     --cache-node-type cache.r5.xlarge
   ```

### Step 2: Application Configuration

1. **Environment Variables**:
   ```bash
   # Create ConfigMap
   kubectl create configmap url-shortener-config \\
     --from-literal=NODE_ENV=production \\
     --from-literal=DB_HOST=<db-host> \\
     --from-literal=REDIS_HOST=<redis-host>

   # Create Secrets
   kubectl create secret generic url-shortener-secrets \\
     --from-literal=DB_PASSWORD=<password> \\
     --from-literal=REDIS_PASSWORD=<password>
   ```

2. **SSL Certificate**:
   ```bash
   # Install cert-manager
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.7.1/cert-manager.yaml

   # Create certificate
   kubectl apply -f k8s/certificate.yaml
   ```

### Step 3: Application Deployment

1. **Build Docker Images**:
   ```bash
   # Frontend
   cd frontend
   docker build -t url-shortener-frontend:v1 .
   docker push url-shortener-frontend:v1

   # Backend
   cd backend
   docker build -t url-shortener-backend:v1 .
   docker push url-shortener-backend:v1
   ```

2. **Deploy Applications**:
   ```bash
   # Apply Kubernetes manifests
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/frontend-deployment.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

3. **Setup CDN**:
   ```bash
   # Create CloudFront distribution
   aws cloudfront create-distribution \\
     --origin-domain-name <load-balancer-dns> \\
     --default-cache-behavior-forwarded-values-query-string true
   ```

### Step 4: Monitoring Setup

1. **Prometheus & Grafana**:
   ```bash
   # Install Prometheus Operator
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm install prometheus prometheus-community/kube-prometheus-stack

   # Configure dashboards
   kubectl apply -f monitoring/dashboards/
   ```

2. **Logging**:
   ```bash
   # Install ELK Stack
   helm repo add elastic https://helm.elastic.co
   helm install elasticsearch elastic/elasticsearch
   helm install kibana elastic/kibana
   helm install filebeat elastic/filebeat
   ```

3. **Alerts**:
   ```bash
   # Configure alert rules
   kubectl apply -f monitoring/alerts/
   ```

### Step 5: Security Configuration

1. **Network Policies**:
   ```bash
   # Apply network policies
   kubectl apply -f k8s/network-policies/
   ```

2. **WAF Setup**:
   ```bash
   # Create AWS WAF rules
   aws wafv2 create-web-acl \\
     --name url-shortener-waf \\
     --scope REGIONAL \\
     --default-action Block={} \\
     --rules file://waf-rules.json
   ```

### Step 6: Performance Testing

1. **Load Testing**:
   ```bash
   # Install k6
   docker pull loadimpact/k6

   # Run load test
   k6 run load-tests/redirect-test.js
   ```

2. **Performance Monitoring**:
   ```bash
   # Monitor metrics
   watch kubectl top pods
   
   # Check logs
   kubectl logs -f -l app=url-shortener
   ```

### Step 7: Backup & Recovery

1. **Database Backup**:
   ```bash
   # Setup automated backups
   aws rds modify-db-instance \\
     --db-instance-identifier url-shortener-db \\
     --backup-retention-period 7 \\
     --preferred-backup-window "00:00-01:00"
   ```

2. **Disaster Recovery**:
   ```bash
   # Create read replica in different region
   aws rds create-db-instance-read-replica \\
     --db-instance-identifier url-shortener-db-replica \\
     --source-db-instance-identifier url-shortener-db \\
     --region us-west-2
   ```

### Step 8: Scaling Configuration

1. **Horizontal Pod Autoscaling**:
   ```bash
   kubectl autoscale deployment url-shortener-backend \\
     --cpu-percent=70 \\
     --min=3 \\
     --max=10
   ```

2. **Database Scaling**:
   ```bash
   # Create read replicas
   aws rds create-db-instance-read-replica \\
     --db-instance-identifier url-shortener-db-read \\
     --source-db-instance-identifier url-shortener-db
   ```

### Production Checklist

- [ ] Infrastructure setup complete
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Monitoring and alerts active
- [ ] Load balancing configured
- [ ] CDN setup complete
- [ ] Security policies applied
- [ ] Auto-scaling configured
- [ ] Performance tests passed
- [ ] Documentation updated

### Maintenance Tasks

1. **Daily**:
   - Monitor error rates
   - Check system metrics
   - Review security alerts

2. **Weekly**:
   - Review performance metrics
   - Check backup status
   - Update security patches

3. **Monthly**:
   - Rotate access keys
   - Review and optimize costs
   - Update documentation

### Troubleshooting Guide

1. **High Latency**:
   ```bash
   # Check pod metrics
   kubectl top pods

   # Check slow queries
   kubectl exec -it postgres-pod -- psql -U admin -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
   ```

2. **High Error Rate**:
   ```bash
   # Check application logs
   kubectl logs -f -l app=url-shortener

   # Check system metrics
   kubectl get --raw /apis/metrics.k8s.io/v1beta1/nodes
   ```

## License
MIT License - see the [LICENSE](LICENSE) file for details