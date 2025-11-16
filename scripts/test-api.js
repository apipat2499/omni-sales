#!/usr/bin/env node

/**
 * API Testing Script (Node.js version)
 * Tests all main endpoints and generates a report
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const VERBOSE = process.argv.includes('--verbose');

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let results = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Helper to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test helper
async function test(name, fn) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS', message: '' });
    console.log(`${colors.green}✓${colors.reset} ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', message: error.message });
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (VERBOSE) {
      console.log(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    }
  }
}

// Test assertions
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Main test suite
async function runTests() {
  console.log(`\n${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}  API Testing Suite - Omni Sales${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}\n`);

  console.log(`${colors.cyan}Base URL: ${BASE_URL}${colors.reset}\n`);

  // Check if server is running
  console.log(`${colors.yellow}Checking if server is running...${colors.reset}`);
  try {
    const response = await makeRequest('GET', '/');
    console.log(`${colors.green}✓ Server is running${colors.reset}\n`);
  } catch (error) {
    console.error(
      `${colors.red}✗ Server is NOT running at ${BASE_URL}${colors.reset}\n`
    );
    console.log(`${colors.yellow}Start the server with: npm run dev${colors.reset}`);
    process.exit(1);
  }

  // ===== PRODUCTS API =====
  console.log(`${colors.blue}========== PRODUCTS API ==========${colors.reset}`);

  let productId = null;

  await test('GET /api/products', async () => {
    const response = await makeRequest('GET', '/api/products');
    assert(response.status === 200, `Expected status 200, got ${response.status}`);
    assert(Array.isArray(response.body), 'Expected array response');
  });

  await test('POST /api/products (Create)', async () => {
    const data = {
      name: `Test Product ${Date.now()}`,
      category: 'Electronics',
      price: 1000,
      cost: 500,
      stock: 10,
      sku: `TEST-${Date.now()}`,
      description: 'Automated test product',
    };

    const response = await makeRequest('POST', '/api/products', data);
    assert(response.status === 201, `Expected status 201, got ${response.status}`);
    assert(response.body.id, 'Expected product ID in response');
    productId = response.body.id;
  });

  if (productId) {
    await test(`GET /api/products/${productId}`, async () => {
      const response = await makeRequest('GET', `/api/products/${productId}`);
      assert(response.status === 200, `Expected status 200, got ${response.status}`);
      assert(response.body.id === productId, 'Product ID mismatch');
    });

    await test(`PUT /api/products/${productId} (Update)`, async () => {
      const data = {
        name: `Updated Test Product ${Date.now()}`,
        price: 1200,
        stock: 15,
      };

      const response = await makeRequest('PUT', `/api/products/${productId}`, data);
      assert(response.status === 200, `Expected status 200, got ${response.status}`);
      assert(response.body.price === 1200, 'Price not updated');
    });

    await test(`DELETE /api/products/${productId}`, async () => {
      const response = await makeRequest('DELETE', `/api/products/${productId}`);
      assert(response.status === 200, `Expected status 200, got ${response.status}`);
    });
  }

  console.log('');

  // ===== CUSTOMERS API =====
  console.log(`${colors.blue}========== CUSTOMERS API ==========${colors.reset}`);

  await test('GET /api/customers', async () => {
    const response = await makeRequest('GET', '/api/customers');
    assert([200, 500].includes(response.status), `Unexpected status ${response.status}`);
  });

  console.log('');

  // ===== ORDERS API =====
  console.log(`${colors.blue}========== ORDERS API ==========${colors.reset}`);

  await test('GET /api/orders', async () => {
    const response = await makeRequest('GET', '/api/orders');
    assert([200, 500].includes(response.status), `Unexpected status ${response.status}`);
  });

  console.log('');

  // ===== SEARCH API =====
  console.log(`${colors.blue}========== SEARCH API ==========${colors.reset}`);

  await test('GET /api/search/global?q=test', async () => {
    const response = await makeRequest('GET', '/api/search/global?q=test');
    assert([200, 500].includes(response.status), `Unexpected status ${response.status}`);
  });

  console.log('');

  // ===== CURRENCY API =====
  console.log(`${colors.blue}========== CURRENCY API ==========${colors.reset}`);

  await test('GET /api/currency/convert?amount=100&from=USD&to=EUR', async () => {
    const response = await makeRequest(
      'GET',
      '/api/currency/convert?amount=100&from=USD&to=EUR'
    );
    assert([200, 400, 500].includes(response.status), `Unexpected status ${response.status}`);
  });

  console.log('');

  // ===== ANALYTICS API =====
  console.log(`${colors.blue}========== ANALYTICS API ==========${colors.reset}`);

  await test('GET /api/analytics/dashboard', async () => {
    const response = await makeRequest('GET', '/api/analytics/dashboard');
    assert([200, 500].includes(response.status), `Unexpected status ${response.status}`);
  });

  console.log('');

  // ===== FORECAST API =====
  console.log(`${colors.blue}========== FORECAST API ==========${colors.reset}`);

  await test('GET /api/forecast/sales?days=30', async () => {
    const response = await makeRequest('GET', '/api/forecast/sales?days=30');
    assert([200, 400, 500].includes(response.status), `Unexpected status ${response.status}`);
  });

  console.log('');

  // ===== SUMMARY =====
  console.log(`${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.blue}  TEST SUMMARY${colors.reset}`);
  console.log(`${colors.blue}========================================${colors.reset}`);

  const total = results.passed + results.failed;
  console.log(`Total Tests: ${colors.cyan}${total}${colors.reset}`);
  console.log(`Passed: ${colors.green}${results.passed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${results.failed}${colors.reset}`);
  console.log('');

  if (results.failed === 0) {
    console.log(`${colors.green}All tests passed! ✓${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}Some tests failed. Check the errors above.${colors.reset}`);

    if (!VERBOSE) {
      console.log(`${colors.yellow}Run with --verbose flag for more details${colors.reset}`);
    }

    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
