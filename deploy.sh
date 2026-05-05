#!/bin/bash

set -e

echo "Starting deployment..."

# Build and start containers
docker-compose down || true
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Run health checks
if curl -sf http://localhost:3000/health > /dev/null; then
    echo "✓ Backend is healthy"
else
    echo "✗ Backend health check failed"
    exit 1
fi

if curl -sf http://localhost:80 > /dev/null; then
    echo "✓ Frontend is healthy"
else
    echo "✗ Frontend health check failed"
    exit 1
fi

echo "Deployment completed successfully!"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:3000"
echo "API Docs: http://localhost:3000/api/github/trending"
