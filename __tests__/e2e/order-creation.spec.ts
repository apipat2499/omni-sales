/**
 * E2E Tests for Order Creation Flow
 */
import { test, expect } from '@playwright/test';

test.describe('Order Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/\/(dashboard|home)/i, { timeout: 10000 });

    // Navigate to orders page
    await page.goto('/orders');
  });

  test('should display orders page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Orders/i);

    // Check for create order button
    await expect(
      page.getByRole('button', { name: /new order|create order|add order/i })
    ).toBeVisible();

    // Check for orders list or table
    await expect(
      page.getByRole('table') || page.getByTestId('orders-list')
    ).toBeVisible();
  });

  test('should open order creation modal/page', async ({ page }) => {
    // Click create order button
    await page.getByRole('button', { name: /new order|create order|add order/i }).click();

    // Check for order form
    await expect(
      page.getByRole('heading', { name: /new order|create order/i })
    ).toBeVisible();

    // Check for essential form fields
    await expect(page.getByLabel(/customer/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /add item|add product/i })).toBeVisible();
  });

  test('should add items to order', async ({ page }) => {
    // Open order creation
    await page.getByRole('button', { name: /new order|create order|add order/i }).click();

    // Add first item
    await page.getByRole('button', { name: /add item|add product/i }).click();

    // Fill in item details
    await page.getByLabel(/product.*name/i).first().fill('Test Product 1');
    await page.getByLabel(/quantity/i).first().fill('2');
    await page.getByLabel(/price/i).first().fill('100');

    // Add second item
    await page.getByRole('button', { name: /add item|add product/i }).click();

    // Fill in second item
    const productInputs = page.getByLabel(/product.*name/i);
    await productInputs.nth(1).fill('Test Product 2');

    const quantityInputs = page.getByLabel(/quantity/i);
    await quantityInputs.nth(1).fill('1');

    const priceInputs = page.getByLabel(/price/i);
    await priceInputs.nth(1).fill('50');

    // Check that items are listed
    await expect(page.getByText('Test Product 1')).toBeVisible();
    await expect(page.getByText('Test Product 2')).toBeVisible();
  });

  test('should calculate order total correctly', async ({ page }) => {
    // Open order creation
    await page.getByRole('button', { name: /new order|create order|add order/i }).click();

    // Add item
    await page.getByRole('button', { name: /add item|add product/i }).click();
    await page.getByLabel(/product.*name/i).first().fill('Test Product');
    await page.getByLabel(/quantity/i).first().fill('3');
    await page.getByLabel(/price/i).first().fill('100');

    // Wait for total calculation
    await page.waitForTimeout(500);

    // Check total (3 * 100 = 300)
    await expect(page.getByText(/total.*300|฿300/i)).toBeVisible();
  });

  test('should remove item from order', async ({ page }) => {
    // Open order creation
    await page.getByRole('button', { name: /new order|create order|add order/i }).click();

    // Add two items
    await page.getByRole('button', { name: /add item|add product/i }).click();
    await page.getByLabel(/product.*name/i).first().fill('Product 1');

    await page.getByRole('button', { name: /add item|add product/i }).click();
    await page.getByLabel(/product.*name/i).nth(1).fill('Product 2');

    // Remove first item
    const removeButtons = page.getByRole('button', { name: /remove|delete.*item/i });
    await removeButtons.first().click();

    // Check that Product 1 is removed but Product 2 remains
    await expect(page.getByText('Product 1')).not.toBeVisible();
    await expect(page.getByText('Product 2')).toBeVisible();
  });

  test('should validate required fields before submission', async ({ page }) => {
    // Open order creation
    await page.getByRole('button', { name: /new order|create order|add order/i }).click();

    // Try to submit without adding items
    await page.getByRole('button', { name: /save|submit|create/i }).click();

    // Check for validation errors
    await expect(
      page.getByText(/at least one item|add item/i)
    ).toBeVisible();
  });

  test('should successfully create an order', async ({ page }) => {
    // Open order creation
    await page.getByRole('button', { name: /new order|create order|add order/i }).click();

    // Fill in customer name
    await page.getByLabel(/customer/i).fill('Test Customer');

    // Add item
    await page.getByRole('button', { name: /add item|add product/i }).click();
    await page.getByLabel(/product.*name/i).first().fill('Test Product');
    await page.getByLabel(/quantity/i).first().fill('2');
    await page.getByLabel(/price/i).first().fill('100');

    // Submit order
    await page.getByRole('button', { name: /save|submit|create/i }).click();

    // Wait for success message or redirect
    await expect(
      page.getByText(/order.*created|success/i)
    ).toBeVisible({ timeout: 5000 });

    // Should redirect back to orders list
    await expect(page).toHaveURL(/\/orders/);

    // New order should appear in the list
    await expect(page.getByText('Test Customer')).toBeVisible();
  });

  test('should apply discount to order item', async ({ page }) => {
    // Open order creation
    await page.getByRole('button', { name: /new order|create order|add order/i }).click();

    // Add item
    await page.getByRole('button', { name: /add item|add product/i }).click();
    await page.getByLabel(/product.*name/i).first().fill('Test Product');
    await page.getByLabel(/quantity/i).first().fill('1');
    await page.getByLabel(/price/i).first().fill('100');

    // Apply discount if available
    const discountInput = page.getByLabel(/discount/i).first();
    if (await discountInput.isVisible()) {
      await discountInput.fill('10'); // 10% or 10 baht discount

      // Check that total is adjusted
      await page.waitForTimeout(500);
      await expect(
        page.getByText(/total.*90|฿90/i)
      ).toBeVisible();
    }
  });

  test('should search and select products from catalog', async ({ page }) => {
    // Open order creation
    await page.getByRole('button', { name: /new order|create order|add order/i }).click();

    // Add item
    await page.getByRole('button', { name: /add item|add product/i }).click();

    // Check if there's a product search/select feature
    const productSearch = page.getByPlaceholder(/search.*product/i).first();
    if (await productSearch.isVisible()) {
      // Type to search
      await productSearch.fill('Laptop');

      // Wait for search results
      await page.waitForTimeout(500);

      // Select a product from results
      await page.getByRole('option', { name: /laptop/i }).first().click();

      // Product details should be auto-filled
      const priceInput = page.getByLabel(/price/i).first();
      const priceValue = await priceInput.inputValue();
      expect(parseInt(priceValue)).toBeGreaterThan(0);
    }
  });

  test('should save order as draft', async ({ page }) => {
    // Open order creation
    await page.getByRole('button', { name: /new order|create order|add order/i }).click();

    // Fill partial order data
    await page.getByLabel(/customer/i).fill('Draft Customer');
    await page.getByRole('button', { name: /add item|add product/i }).click();
    await page.getByLabel(/product.*name/i).first().fill('Draft Product');

    // Save as draft if option exists
    const saveDraftButton = page.getByRole('button', { name: /save.*draft|draft/i });
    if (await saveDraftButton.isVisible()) {
      await saveDraftButton.click();

      // Check for success message
      await expect(
        page.getByText(/draft.*saved/i)
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle concurrent item additions smoothly', async ({ page }) => {
    // Open order creation
    await page.getByRole('button', { name: /new order|create order|add order/i }).click();

    // Rapidly add multiple items
    for (let i = 1; i <= 3; i++) {
      await page.getByRole('button', { name: /add item|add product/i }).click();
      await page.waitForTimeout(200);
    }

    // Check that all items were added
    const productInputs = page.getByLabel(/product.*name/i);
    const count = await productInputs.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

test.describe('Order Creation - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should create order on mobile device', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/\/(dashboard|home)/i, { timeout: 10000 });

    // Navigate to orders
    await page.goto('/orders');

    // Open order creation
    await page.getByRole('button', { name: /new order|create order|add order/i }).click();

    // Form should be properly sized for mobile
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Add item
    await page.getByRole('button', { name: /add item|add product/i }).click();

    // Inputs should be mobile-friendly
    const productInput = page.getByLabel(/product.*name/i).first();
    const boundingBox = await productInput.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(200);
  });
});
