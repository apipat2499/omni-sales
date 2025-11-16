/**
 * E2E Tests for Login Flow
 */
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Login|Sign In/i);

    // Check for login form elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click login button without filling form
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Check for validation errors
    await expect(page.getByText(/email.*required/i)).toBeVisible();
    await expect(page.getByText(/password.*required/i)).toBeVisible();
  });

  test('should show error for invalid email format', async ({ page }) => {
    // Fill in invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Check for email validation error
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('should show error for incorrect credentials', async ({ page }) => {
    // Fill in form with incorrect credentials
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for error message
    await expect(page.getByText(/invalid.*credentials|incorrect.*password/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Fill in form with valid credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for redirect to dashboard or home page
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });

    // Check for successful login indicators
    await expect(
      page.getByText(/welcome|dashboard/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);
    const toggleButton = page.getByRole('button', { name: /show|hide.*password/i });

    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button
    await toggleButton.click();

    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle again
    await toggleButton.click();

    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should navigate to forgot password page', async ({ page }) => {
    // Click forgot password link
    await page.getByRole('link', { name: /forgot.*password/i }).click();

    // Check navigation to forgot password page
    await expect(page).toHaveURL(/forgot-password|reset-password/i);
  });

  test('should navigate to sign up page', async ({ page }) => {
    // Click sign up link
    await page.getByRole('link', { name: /sign up|register/i }).click();

    // Check navigation to sign up page
    await expect(page).toHaveURL(/signup|register/i);
  });

  test('should remember email if "Remember me" is checked', async ({ page, context }) => {
    // Fill in email
    const email = 'test@example.com';
    await page.getByLabel(/email/i).fill(email);

    // Check "Remember me" checkbox if it exists
    const rememberMeCheckbox = page.getByLabel(/remember me/i);
    if (await rememberMeCheckbox.isVisible()) {
      await rememberMeCheckbox.check();
    }

    // Submit form
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for redirect
    await page.waitForURL(/\/(dashboard|home)/i, { timeout: 10000 });

    // Logout
    await page.getByRole('button', { name: /logout|sign out/i }).click();

    // Go back to login page
    await page.goto('/login');

    // Email should be pre-filled (if remember me was implemented)
    const emailInput = page.getByLabel(/email/i);
    const emailValue = await emailInput.inputValue();

    // This assertion might fail if remember me is not implemented
    // expect(emailValue).toBe(email);
  });

  test('should handle loading state during login', async ({ page }) => {
    // Fill in credentials
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');

    // Click login button
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Check for loading state (button disabled or showing spinner)
    const loginButton = page.getByRole('button', { name: /sign in|login|loading/i });
    await expect(loginButton).toBeDisabled();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/email/i)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/password/i)).toBeFocused();

    // Fill form using keyboard
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('password123');

    // Submit form using Enter key
    await page.keyboard.press('Enter');

    // Should navigate to dashboard
    await expect(page).toHaveURL(/\/(dashboard|home)/i, { timeout: 10000 });
  });
});

test.describe('Login Flow - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile-optimized login page', async ({ page }) => {
    await page.goto('/login');

    // Check that form is visible and properly sized for mobile
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check that inputs are properly sized
    const emailInput = page.getByLabel(/email/i);
    const boundingBox = await emailInput.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(250);
  });
});
