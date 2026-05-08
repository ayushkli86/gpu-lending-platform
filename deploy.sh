#!/bin/bash

# Deployment script for GPU Lending Platform

set -e

echo "🚀 Starting deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual values!"
    exit 1
fi

# Build Docker images
echo "📦 Building Docker images..."
docker-compose build

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for database
echo "⏳ Waiting for database..."
sleep 5

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec -T app npx prisma migrate deploy

# Seed database (optional)
echo "🌱 Seeding database..."
docker-compose exec -T app npx prisma db seed || true

# Check health
echo "🏥 Checking health..."
sleep 3
curl -f http://localhost:3000/health || echo "⚠️  Health check failed"

echo "✅ Deployment complete!"
echo ""
echo "📊 Service URLs:"
echo "  - API: http://localhost:3000"
echo "  - Health: http://localhost:3000/health"
echo "  - Swagger: http://localhost:3000/api-docs"
echo ""
echo "📝 View logs:"
echo "  docker-compose logs -f app"
echo ""
echo "🛑 Stop services:"
echo "  docker-compose down"
