#!/bin/bash

echo "Running integration tests..."

BACKEND_URL=${BACKEND_URL:-http://localhost:3000}

echo "Testing health endpoint..."
curl -s $BACKEND_URL/health | grep -q '"status":"ok"' && echo "✓ Health check passed" || echo "✗ Health check failed"

echo "Testing GitHub trending API..."
curl -s $BACKEND_URL/api/github/trending | grep -q '"data"' && echo "✓ Trending API passed" || echo "✗ Trending API failed"

echo "Testing with language filter..."
curl -s $BACKEND_URL/api/github/trending/javascript | grep -q '"data"' && echo "✓ Language filter passed" || echo "✗ Language filter failed"

echo "Testing error handling..."
curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/github/invalid | grep -q "404\|500" && echo "✓ Error handling passed" || echo "✗ Error handling failed"

echo "All tests completed."
