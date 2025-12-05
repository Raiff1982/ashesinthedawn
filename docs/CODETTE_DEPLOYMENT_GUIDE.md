# Codette AI - Deployment Guide
## Production Deployment & DevOps

---

## ?? Quick Deployment (Docker Compose)

### 1. Create `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Codette AI Backend Server
  codette-server:
    build:
      context: .
      dockerfile: Dockerfile.codette
    environment:
      - CODETTE_HOST=0.0.0.0
      - CODETTE_PORT=8000
    ports:
      - "8000:8000"
    volumes:
      - ./Codette:/app/Codette:ro
      - ./codette_server_production.py:/app/codette_server_production.py:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - corelogic

  # React Frontend
  corelogic-studio:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    environment:
      - VITE_CODETTE_API=http://codette-server:8000
      - VITE_CODETTE_ENABLED=true
    ports:
      - "5173:5173"
    depends_on:
      - codette-server
    restart: unless-stopped
    networks:
      - corelogic

  # Nginx Reverse Proxy (Optional, for production)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - corelogic-studio
      - codette-server
    restart: unless-stopped
    networks:
      - corelogic

networks:
  corelogic:
    driver: bridge
```

### 2. Create `Dockerfile.codette`

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY Codette/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY codette_server_production.py .
COPY Codette ./Codette

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start server
CMD ["python", "codette_server_production.py"]
```

### 3. Create `Dockerfile.frontend`

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
```

### 4. Deploy

```bash
# Clone repo
git clone https://github.com/yourusername/ashesinthedawn.git
cd ashesinthedawn

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check health
curl http://localhost:8000/health
curl http://localhost:5173

# Stop services
docker-compose down
```

---

## ?? Manual Deployment (Ubuntu/Debian)

### 1. Install Dependencies

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Python 3.10
sudo apt-get install -y python3.10 python3.10-venv

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Supervisor (for process management)
sudo apt-get install -y supervisor

# Install Nginx (for reverse proxy)
sudo apt-get install -y nginx
```

### 2. Setup Backend

```bash
# Create app directory
mkdir -p /opt/corelogic
cd /opt/corelogic

# Clone repository
git clone <repo-url> .

# Create Python virtual environment
python3.10 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r Codette/requirements.txt
pip install fastapi uvicorn

# Create supervisor config
sudo nano /etc/supervisor/conf.d/codette.conf
```

### 3. Supervisor Configuration

```ini
[program:codette]
directory=/opt/corelogic
command=/opt/corelogic/venv/bin/python codette_server_production.py
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/codette.log
environment=CODETTE_HOST=127.0.0.1,CODETTE_PORT=8000

[program:corelogic-studio]
directory=/opt/corelogic
command=/usr/bin/npm run preview
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/corelogic-studio.log
environment=NODE_ENV=production
```

### 4. Nginx Configuration

```nginx
# /etc/nginx/sites-available/corelogic

upstream codette {
    server 127.0.0.1:8000;
}

upstream studio {
    server 127.0.0.1:5173;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://codette;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /ws/ {
        proxy_pass http://codette;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://studio;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 5. Start Services

```bash
# Reload supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all

# Check status
sudo supervisorctl status

# View logs
sudo tail -f /var/log/codette.log
sudo tail -f /var/log/corelogic-studio.log

# Enable Nginx sites
sudo ln -s /etc/nginx/sites-available/corelogic /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ?? Cloud Deployment (AWS)

### 1. EC2 Setup

```bash
# Launch EC2 instance (Ubuntu 22.04 LTS, t3.medium)
# Create security group with ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)

# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run setup
curl -fsSL https://raw.githubusercontent.com/yourusername/ashesinthedawn/main/deploy/ec2-setup.sh | bash
```

### 2. ECR & ECS Deployment

```bash
# Create ECR repositories
aws ecr create-repository --repository-name codette-server --region us-east-1
aws ecr create-repository --repository-name corelogic-studio --region us-east-1

# Build & push images
docker build -t codette-server -f Dockerfile.codette .
docker tag codette-server:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/codette-server:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/codette-server:latest

# Similar for frontend...

# Create ECS cluster and task definitions (use AWS console or terraform)
```

### 3. RDS Database (Optional)

```bash
# Create RDS instance for persistent storage
aws rds create-db-instance \
  --db-instance-identifier corelogic-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password <your-secure-password>
```

---

## ?? SSL/TLS Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Create certificate
sudo certbot certonly --nginx -d yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify
sudo certbot renew --dry-run
```

---

## ?? Monitoring & Logging

### Prometheus Metrics

```python
# Add to codette_server_production.py
from prometheus_client import Counter, Histogram, generate_latest

chat_requests = Counter('chat_requests_total', 'Total chat requests')
request_duration = Histogram('request_duration_seconds', 'Request duration')

@app.get("/metrics")
async def metrics():
    return generate_latest()
```

### ELK Stack (Elasticsearch, Logstash, Kibana)

```bash
# Docker Compose for ELK
docker-compose -f docker-compose.elk.yml up -d

# Configure Logstash to collect logs
# View dashboards at http://localhost:5601
```

---

## ?? Continuous Deployment (CI/CD)

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker images
        run: |
          docker build -t codette-server:${{ github.sha }} -f Dockerfile.codette .
          docker build -t corelogic-studio:${{ github.sha }} -f Dockerfile.frontend .
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin ${{ secrets.AWS_ECR_URI }}
          docker push ${{ secrets.AWS_ECR_URI }}/codette-server:${{ github.sha }}
          docker push ${{ secrets.AWS_ECR_URI }}/corelogic-studio:${{ github.sha }}
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster production --service corelogic --force-new-deployment
```

---

## ? Production Checklist

- [ ] Environment variables configured (.env file)
- [ ] SSL/TLS certificates installed
- [ ] Database backups automated
- [ ] Monitoring & alerting enabled
- [ ] Rate limiting configured
- [ ] CORS properly restricted
- [ ] API keys secured (env vars, not hardcoded)
- [ ] Logs centralized & rotated
- [ ] Health checks configured
- [ ] Auto-scaling enabled (if cloud)
- [ ] Disaster recovery plan documented
- [ ] Load balancer configured
- [ ] CDN enabled (for static assets)
- [ ] DDoS protection enabled
- [ ] Security headers configured

---

## ?? Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs codette-server

# Verify Python version
python3.10 --version

# Check port availability
netstat -tuln | grep 8000

# Restart container
docker-compose restart codette-server
```

### High memory usage
```bash
# Monitor memory
docker stats

# Reduce cache size in .env
VITE_CODETTE_CACHE_SIZE=100

# Restart services
docker-compose restart
```

### WebSocket connection issues
```bash
# Check reverse proxy config (Nginx)
sudo nginx -t

# Verify WebSocket headers
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:8000/ws/codette
```

---

## ?? Support

- **Documentation**: See CODETTE_COMPLETE_GUIDE.md
- **Issues**: https://github.com/yourusername/ashesinthedawn/issues
- **Email**: support@yourdomain.com

---

**Last Updated**: December 2025  
**Status**: Production Ready ?
