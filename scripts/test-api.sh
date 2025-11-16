#!/bin/bash

# API Testing Script
# Tests all main endpoints

set -e

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0
TOTAL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to print status
print_status() {
  local status=$1
  local message=$2
  if [ $status -eq 0 ]; then
    echo -e "${GREEN}✓${NC} $message"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $message"
    ((FAILED++))
  fi
  ((TOTAL++))
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  API Testing Suite - Omni Sales${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if server is running
echo -e "${YELLOW}[1] Checking if server is running...${NC}"
if curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Server is running at $BASE_URL${NC}"
else
  echo -e "${RED}✗ Server is NOT running at $BASE_URL${NC}"
  echo -e "${YELLOW}Start the server with: npm run dev${NC}"
  exit 1
fi
echo ""

# ===== PRODUCTS API =====
echo -e "${BLUE}========== PRODUCTS API ==========${NC}"

# Test 1: GET /api/products
echo -e "${YELLOW}Test: GET /api/products${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/products")
if echo "$RESPONSE" | grep -q "error" || [ -z "$RESPONSE" ]; then
  print_status 1 "GET /api/products - Failed to fetch products"
  echo "  Response: $RESPONSE"
else
  print_status 0 "GET /api/products - Retrieved products"
fi
echo ""

# Test 2: POST /api/products (Create)
echo -e "${YELLOW}Test: POST /api/products (Create Product)${NC}"
PRODUCT_DATA='{
  "name":"Test Product",
  "category":"Electronics",
  "price":1000,
  "cost":500,
  "stock":10,
  "sku":"TEST-001",
  "description":"Test product description"
}'

RESPONSE=$(curl -s -X POST "$BASE_URL/api/products" \
  -H "Content-Type: application/json" \
  -d "$PRODUCT_DATA")

if echo "$RESPONSE" | grep -q '"id"'; then
  print_status 0 "POST /api/products - Product created successfully"
  # Extract product ID from response
  PRODUCT_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "  Product ID: $PRODUCT_ID"
else
  print_status 1 "POST /api/products - Failed to create product"
  echo "  Response: $RESPONSE"
  PRODUCT_ID=""
fi
echo ""

# Test 3: GET /api/products/{id}
if [ ! -z "$PRODUCT_ID" ]; then
  echo -e "${YELLOW}Test: GET /api/products/{id}${NC}"
  RESPONSE=$(curl -s "$BASE_URL/api/products/$PRODUCT_ID")
  if echo "$RESPONSE" | grep -q '"id"'; then
    print_status 0 "GET /api/products/{id} - Retrieved product"
  else
    print_status 1 "GET /api/products/{id} - Failed to retrieve product"
    echo "  Response: $RESPONSE"
  fi
  echo ""

  # Test 4: PUT /api/products/{id} (Update)
  echo -e "${YELLOW}Test: PUT /api/products/{id} (Update Product)${NC}"
  UPDATE_DATA='{
    "name":"Updated Test Product",
    "price":1200,
    "stock":15
  }'

  RESPONSE=$(curl -s -X PUT "$BASE_URL/api/products/$PRODUCT_ID" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_DATA")

  if echo "$RESPONSE" | grep -q '"id"'; then
    print_status 0 "PUT /api/products/{id} - Product updated successfully"
  else
    print_status 1 "PUT /api/products/{id} - Failed to update product"
    echo "  Response: $RESPONSE"
  fi
  echo ""

  # Test 5: DELETE /api/products/{id}
  echo -e "${YELLOW}Test: DELETE /api/products/{id}${NC}"
  RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/products/$PRODUCT_ID")
  if echo "$RESPONSE" | grep -q "successfully\|success"; then
    print_status 0 "DELETE /api/products/{id} - Product deleted successfully"
  else
    print_status 1 "DELETE /api/products/{id} - Failed to delete product"
    echo "  Response: $RESPONSE"
  fi
  echo ""
fi

# ===== CUSTOMERS API =====
echo -e "${BLUE}========== CUSTOMERS API ==========${NC}"

# Test 6: GET /api/customers
echo -e "${YELLOW}Test: GET /api/customers${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/customers")
if echo "$RESPONSE" | grep -q "error" || [ -z "$RESPONSE" ]; then
  print_status 1 "GET /api/customers - Failed to fetch customers"
else
  print_status 0 "GET /api/customers - Retrieved customers"
fi
echo ""

# ===== ORDERS API =====
echo -e "${BLUE}========== ORDERS API ==========${NC}"

# Test 7: GET /api/orders
echo -e "${YELLOW}Test: GET /api/orders${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/orders")
if echo "$RESPONSE" | grep -q "error" || [ -z "$RESPONSE" ]; then
  print_status 1 "GET /api/orders - Failed to fetch orders"
else
  print_status 0 "GET /api/orders - Retrieved orders"
fi
echo ""

# ===== SEARCH API =====
echo -e "${BLUE}========== SEARCH API ==========${NC}"

# Test 8: GET /api/search/global
echo -e "${YELLOW}Test: GET /api/search/global?q=test${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/search/global?q=test")
if [ ! -z "$RESPONSE" ]; then
  print_status 0 "GET /api/search/global - Search working"
else
  print_status 1 "GET /api/search/global - Search failed"
fi
echo ""

# ===== ANALYTICS API =====
echo -e "${BLUE}========== ANALYTICS API ==========${NC}"

# Test 9: GET /api/analytics/dashboard
echo -e "${YELLOW}Test: GET /api/analytics/dashboard${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/analytics/dashboard")
if [ ! -z "$RESPONSE" ]; then
  print_status 0 "GET /api/analytics/dashboard - Analytics working"
else
  print_status 1 "GET /api/analytics/dashboard - Analytics failed"
fi
echo ""

# ===== CURRENCY API =====
echo -e "${BLUE}========== CURRENCY API ==========${NC}"

# Test 10: GET /api/currency/convert
echo -e "${YELLOW}Test: GET /api/currency/convert?amount=100&from=USD&to=EUR${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/currency/convert?amount=100&from=USD&to=EUR")
if echo "$RESPONSE" | grep -q "converted"; then
  print_status 0 "GET /api/currency/convert - Currency conversion working"
else
  print_status 1 "GET /api/currency/convert - Currency conversion failed"
  echo "  Response: $RESPONSE"
fi
echo ""

# ===== SUMMARY =====
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed! ✓${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed. Check the errors above.${NC}"
  exit 1
fi
