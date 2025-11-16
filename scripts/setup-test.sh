#!/bin/bash

# Setup & Configuration Test Script
# Checks all prerequisites and configurations

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CHECKS_PASSED=0
CHECKS_FAILED=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Setup & Configuration Checker${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check existence
check_exists() {
  local name=$1
  local path=$2

  if [ -f "$path" ] || [ -d "$path" ]; then
    echo -e "${GREEN}✓${NC} $name found at $path"
    ((CHECKS_PASSED++))
    return 0
  else
    echo -e "${RED}✗${NC} $name NOT found at $path"
    ((CHECKS_FAILED++))
    return 1
  fi
}

# Function to check npm package
check_npm_package() {
  local package=$1

  if npm list "$package" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} NPM package '$package' is installed"
    ((CHECKS_PASSED++))
    return 0
  else
    echo -e "${RED}✗${NC} NPM package '$package' is NOT installed"
    ((CHECKS_FAILED++))
    return 1
  fi
}

# Function to check environment variable
check_env_var() {
  local var_name=$1

  if [ -n "${!var_name}" ]; then
    echo -e "${GREEN}✓${NC} Environment variable '$var_name' is set"
    ((CHECKS_PASSED++))
    return 0
  else
    echo -e "${YELLOW}⚠${NC} Environment variable '$var_name' is NOT set (optional)"
    return 1
  fi
}

echo -e "${BLUE}[1] Checking Project Structure${NC}"
check_exists "app directory" "/home/user/omni-sales/app"
check_exists "lib directory" "/home/user/omni-sales/lib"
check_exists "components directory" "/home/user/omni-sales/components"
check_exists "package.json" "/home/user/omni-sales/package.json"
check_exists "tsconfig.json" "/home/user/omni-sales/tsconfig.json"
echo ""

echo -e "${BLUE}[2] Checking API Routes${NC}"
check_exists "Products API" "/home/user/omni-sales/app/api/products/route.ts"
check_exists "Customers API" "/home/user/omni-sales/app/api/customers/route.ts"
check_exists "Orders API" "/home/user/omni-sales/app/api/orders/route.ts"
check_exists "Search API" "/home/user/omni-sales/app/api/search/global/route.ts"
check_exists "Currency API" "/home/user/omni-sales/app/api/currency/convert/route.ts"
check_exists "Forecast API" "/home/user/omni-sales/app/api/forecast/sales/route.ts"
echo ""

echo -e "${BLUE}[3] Checking Service Files${NC}"
check_exists "Stripe Service" "/home/user/omni-sales/lib/services/stripe.ts"
check_exists "Inventory Service" "/home/user/omni-sales/lib/services/inventory.ts"
check_exists "Email Service" "/home/user/omni-sales/lib/services/email.ts"
check_exists "Excel Service" "/home/user/omni-sales/lib/services/excel.ts"
check_exists "Push Notifications" "/home/user/omni-sales/lib/services/push-notifications.ts"
check_exists "SMS Notifications" "/home/user/omni-sales/lib/services/sms-notifications.ts"
check_exists "2FA Service" "/home/user/omni-sales/lib/services/two-factor-auth.ts"
check_exists "Multi-currency Service" "/home/user/omni-sales/lib/services/multi-currency.ts"
check_exists "Search Service" "/home/user/omni-sales/lib/services/search.ts"
check_exists "Forecasting Service" "/home/user/omni-sales/lib/services/forecasting.ts"
echo ""

echo -e "${BLUE}[4] Checking Environment Configuration${NC}"
if [ -f "/home/user/omni-sales/.env.local" ]; then
  echo -e "${GREEN}✓${NC} .env.local file exists"
  ((CHECKS_PASSED++))

  # Check key environment variables
  export $(cat /home/user/omni-sales/.env.local | grep -v '#' | xargs)

  if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${GREEN}✓${NC} NEXT_PUBLIC_SUPABASE_URL is set"
    ((CHECKS_PASSED++))
  else
    echo -e "${YELLOW}⚠${NC} NEXT_PUBLIC_SUPABASE_URL is NOT set"
  fi

  if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${GREEN}✓${NC} NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
    ((CHECKS_PASSED++))
  else
    echo -e "${YELLOW}⚠${NC} NEXT_PUBLIC_SUPABASE_ANON_KEY is NOT set"
  fi
else
  echo -e "${YELLOW}⚠${NC} .env.local file NOT found"
  echo -e "${YELLOW}   Copy .env.local.example to .env.local and fill in your values${NC}"
  echo ""
fi
echo ""

echo -e "${BLUE}[5] Checking Required NPM Packages${NC}"
check_npm_package "@supabase/supabase-js"
check_npm_package "stripe"
check_npm_package "next"
check_npm_package "react"
check_npm_package "nodemailer"
check_npm_package "xlsx"
check_npm_package "i18next"
echo ""

echo -e "${BLUE}[6] Checking Optional NPM Packages${NC}"
check_npm_package "firebase-admin" || echo -e "${YELLOW}   Install with: npm install firebase-admin${NC}"
check_npm_package "twilio" || echo -e "${YELLOW}   Install with: npm install twilio${NC}"
check_npm_package "speakeasy" || echo -e "${YELLOW}   Install with: npm install speakeasy${NC}"
check_npm_package "qrcode" || echo -e "${YELLOW}   Install with: npm install qrcode${NC}"
check_npm_package "axios" || echo -e "${YELLOW}   Install with: npm install axios${NC}"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CONFIGURATION SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Checks Passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks Failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo -e "${BLUE}Next steps:${NC}"
  echo "1. Run: npm run dev"
  echo "2. Run: ./scripts/test-api.sh"
  echo ""
else
  echo -e "${YELLOW}⚠ Some checks failed. Fix the issues above.${NC}"
  echo ""
  echo -e "${BLUE}Quick fixes:${NC}"
  echo "1. Create .env.local from .env.local.example"
  echo "2. Add your Supabase credentials"
  echo "3. Run: npm install"
  echo ""
fi
