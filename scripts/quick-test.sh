#!/bin/bash

# Quick Test Script - Simplified version
# Just check if server and basic endpoints work

BASE_URL="http://localhost:3000"

echo "🧪 Quick API Test"
echo "================="
echo ""

# Check server
echo -n "1. Checking server... "
if curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo "✓ Running"
else
  echo "✗ Not running"
  echo "   Start with: npm run dev"
  exit 1
fi

# Test Products
echo -n "2. Testing GET /api/products... "
RESPONSE=$(curl -s "$BASE_URL/api/products")
if [ ! -z "$RESPONSE" ]; then
  echo "✓"
else
  echo "✗"
fi

# Test Search
echo -n "3. Testing GET /api/search/global... "
RESPONSE=$(curl -s "$BASE_URL/api/search/global?q=test")
if [ ! -z "$RESPONSE" ]; then
  echo "✓"
else
  echo "✗"
fi

# Test Analytics
echo -n "4. Testing GET /api/analytics/dashboard... "
RESPONSE=$(curl -s "$BASE_URL/api/analytics/dashboard")
if [ ! -z "$RESPONSE" ]; then
  echo "✓"
else
  echo "✗"
fi

echo ""
echo "✓ Basic tests complete!"
