# GPU Lending Platform - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (if not using Docker)

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env
```

### 2. Docker Deployment (Recommended)

```bash
# Deploy everything
./deploy.sh

# Or manually:
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
docker-compose exec app npx prisma db seed
```

### 3. Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start development server
npm run dev
```

---

## 📦 Docker Commands

### Build & Start
```bash
docker-compose build
docker-compose up -d
```

### View Logs
```bash
docker-compose logs -f app
docker-compose logs -f db
```

### Stop Services
```bash
docker-compose down
docker-compose down -v  # Remove volumes
```

### Database Operations
```bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed database
docker-compose exec app npx prisma db seed

# Prisma Studio
docker-compose exec app npx prisma studio
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection | Required |
| `JWT_SECRET` | JWT signing key | Required |
| `STRIPE_SECRET_KEY` | Stripe API key | Required |
| `REDIS_URL` | Redis connection | Optional |
| `LOG_LEVEL` | Logging level | `info` |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000` |

---

## 🏥 Health Checks

### Application Health
```bash
curl http://localhost:3000/health
```

### Database Health
```bash
docker-compose exec db pg_isready -U postgres
```

### Redis Health
```bash
docker-compose exec redis redis-cli ping
```

---

## 📊 Monitoring

### View Logs
```bash
# Application logs
tail -f logs/combined.log
tail -f logs/error.log

# Docker logs
docker-compose logs -f
```

### Metrics
- Health endpoint: `GET /health`
- Swagger docs: `GET /api-docs`

---

## 🔐 Security

### Production Checklist
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Update `STRIPE_SECRET_KEY` with production key
- [ ] Set `ALLOWED_ORIGINS` to your domain
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable monitoring/alerting

### SSL/TLS Setup
```bash
# Using Let's Encrypt with Nginx
# Add reverse proxy configuration
```

---

## 🔄 Updates & Maintenance

### Update Application
```bash
git pull
docker-compose build
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
```

### Database Backup
```bash
docker-compose exec db pg_dump -U postgres gpu_lending > backup.sql
```

### Database Restore
```bash
docker-compose exec -T db psql -U postgres gpu_lending < backup.sql
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
```

### Database Connection Failed
```bash
# Check database is running
docker-compose ps

# Check logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Prisma Client Not Generated
```bash
docker-compose exec app npx prisma generate
```

---

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale app instances
docker-compose up -d --scale app=3
```

### Load Balancer
Add Nginx or Traefik for load balancing multiple instances.

---

## 🔗 Useful Links

- API Documentation: http://localhost:3000/api-docs
- Health Check: http://localhost:3000/health
- Prisma Studio: `npx prisma studio`

---

## 📞 Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review documentation
3. Open GitHub issue
