# 🧪 Testing Guide - Omni Sales

Comprehensive testing guide for all API endpoints and features.

## Quick Start

### 1. Setup Configuration

Copy the example environment file:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2. Check Setup

Run the setup checker:
```bash
./scripts/setup-test.sh
```

Output will show:
- ✓ Project structure
- ✓ API routes
- ✓ Service files
- ✓ Environment variables
- ✓ NPM packages

### 3. Start Development Server

```bash
npm run dev
```

Server will run at: `http://localhost:3000`

### 4. Run API Tests

#### Option A: Bash Script
```bash
./scripts/test-api.sh
```

#### Option B: Node.js Script
```bash
node scripts/test-api.js
```

With verbose output:
```bash
node scripts/test-api.js --verbose
```

---

## Manual Testing with cURL

### Products API

**Create Product:**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "category": "Electronics",
    "price": 1000,
    "cost": 500,
    "stock": 10,
    "sku": "TEST-001",
    "description": "Test product"
  }'
```

**Get All Products:**
```bash
curl http://localhost:3000/api/products
```

**Get Product by ID:**
```bash
curl http://localhost:3000/api/products/{id}
```

**Update Product:**
```bash
curl -X PUT http://localhost:3000/api/products/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product",
    "price": 1200,
    "stock": 15
  }'
```

**Delete Product:**
```bash
curl -X DELETE http://localhost:3000/api/products/{id}
```

---

### Customers API

**Get All Customers:**
```bash
curl http://localhost:3000/api/customers
```

**Create Customer:**
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }'
```

---

### Orders API

**Get All Orders:**
```bash
curl http://localhost:3000/api/orders
```

---

### Search API

**Global Search:**
```bash
curl "http://localhost:3000/api/search/global?q=iphone"
```

---

### Currency API

**Convert Currency:**
```bash
curl "http://localhost:3000/api/currency/convert?amount=100&from=USD&to=EUR"
```

---

### Analytics API

**Dashboard Analytics:**
```bash
curl http://localhost:3000/api/analytics/dashboard
```

---

### Forecasting API

**Sales Forecast:**
```bash
curl "http://localhost:3000/api/forecast/sales?days=30"
```

---

## Postman Collection

You can import this collection into Postman for easier testing:

[Import this JSON into Postman](./postman-collection.json)

Or create manually:

**Endpoint:** `POST /api/products`
- **Headers:** `Content-Type: application/json`
- **Body:** JSON with product data

---

## Expected Responses

### Success Response (201/200)
```json
{
  "id": "uuid-here",
  "name": "Product Name",
  "price": 1000,
  "cost": 500,
  "stock": 10,
  "sku": "SKU-001",
  "category": "Electronics",
  "createdAt": "2024-11-16T10:30:00Z",
  "updatedAt": "2024-11-16T10:30:00Z"
}
```

### Error Response (400/500)
```json
{
  "error": "Error message describing what went wrong",
  "details": "Additional error details (optional)"
}
```

---

## Common Issues

### Issue: "Failed to create product"

**Cause:** Supabase not configured
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify credentials are correct

**Fix:**
```bash
./scripts/setup-test.sh  # Check what's missing
```

### Issue: "NEXT_PUBLIC_SUPABASE_URL is empty"

**Cause:** Environment variables not loaded
- Restart dev server after editing `.env.local`

**Fix:**
```bash
npm run dev  # Restart the server
```

### Issue: "Product not found" (404)

**Cause:** Product was deleted or ID is wrong
- Double-check the product ID
- Verify product exists with GET /api/products

### Issue: "A product with this SKU already exists" (409)

**Cause:** SKU is not unique
- Use a different SKU value
- Or delete the existing product first

---

## Database Setup (Supabase)

Required tables and schema:

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  cost NUMERIC NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  description TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Customers Table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  items JSONB,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

---

## Continuous Testing

For continuous testing during development:

### Watch Mode
```bash
npm run dev  # Auto-reloads on file changes
```

### Automated Tests (Future)
```bash
npm run test  # Run Jest/Vitest (when configured)
```

---

## Performance Testing

Monitor API response times:

### Using Apache Bench
```bash
ab -n 100 -c 10 http://localhost:3000/api/products
```

### Using Artillery
```bash
npm install -g artillery
artillery quick --count 10 --num 100 http://localhost:3000/api/products
```

---

## Coverage Report

After implementing automated tests:

```bash
npm run test -- --coverage
```

---

## Debugging

### Enable Verbose Logging

Edit your API route and add:
```typescript
console.log('Request:', request);
console.log('Body:', body);
```

Check logs in server terminal.

### Browser DevTools

Press `F12` to open DevTools:
- **Network tab:** See API requests/responses
- **Console tab:** View errors
- **Application tab:** Check localStorage/cookies

---

## Next Steps

1. ✅ Setup `.env.local`
2. ✅ Run `./scripts/setup-test.sh`
3. ✅ Run `npm run dev`
4. ✅ Run API tests
5. 📝 Fix any failing tests
6. ✅ Test in browser
7. 🚀 Deploy!

---

**Last Updated:** November 16, 2024
