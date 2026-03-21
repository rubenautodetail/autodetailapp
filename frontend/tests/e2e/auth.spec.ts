/**
 * Auth E2E Tests — Production (https://www.dtailwash.com)
 *
 * Required env vars (create tests/e2e/.env.test or export before running):
 *   TEST_CUSTOMER_EMAIL      — a confirmed customer (role: user) account
 *   TEST_CUSTOMER_PASSWORD
 *   TEST_CONTRACTOR_EMAIL    — a confirmed, approved contractor account
 *   TEST_CONTRACTOR_PASSWORD
 *   TEST_ADMIN_EMAIL         — admin account
 *   TEST_ADMIN_PASSWORD
 *
 * Run: npx playwright test --project=chromium
 */

import { test, expect, type Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env.test') });

const BASE = 'https://www.dtailwash.com';

const creds = {
  customer:   { email: process.env.TEST_CUSTOMER_EMAIL!,   password: process.env.TEST_CUSTOMER_PASSWORD! },
  contractor: { email: process.env.TEST_CONTRACTOR_EMAIL!, password: process.env.TEST_CONTRACTOR_PASSWORD! },
  admin:      { email: process.env.TEST_ADMIN_EMAIL!,      password: process.env.TEST_ADMIN_PASSWORD! },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

async function logout(page: Page, lang = 'en') {
  // Navigate away from protected routes to avoid middleware loops
  await page.goto(`${BASE}/${lang}`);
  // Try clicking a logout button if present, otherwise clear cookies
  const logoutBtn = page.locator('button:has-text("Sign out"), button:has-text("Log out"), button:has-text("Cerrar sesión"), button:has-text("Logout")').first();
  if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await logoutBtn.click();
  } else {
    // Force clear session via Supabase logout endpoint
    await page.goto(`${BASE}/api/auth/signout`, { waitUntil: 'load' }).catch(() => {});
    await page.context().clearCookies();
  }
}

// ─── Customer Login ──────────────────────────────────────────────────────────

test.describe('Customer login (/en/login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('renders login form', async ({ page }) => {
    await page.goto(`${BASE}/en/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    // Should show link to contractor portal
    await expect(page.locator('a[href*="contractor/login"]')).toBeVisible();
  });

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto(`${BASE}/en/login`);
    await fillLoginForm(page, 'nobody@example.com', 'wrongpass123');
    // Should stay on login page and show an error
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
    const errorEl = page.locator('text=/incorrect|invalid|failed|error/i').first();
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });

  test('customer logs in and lands on /dashboard', async ({ page }) => {
    test.skip(!creds.customer.email, 'TEST_CUSTOMER_EMAIL not set');
    await page.goto(`${BASE}/en/login`);
    await fillLoginForm(page, creds.customer.email, creds.customer.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test('contractor cannot login at customer page — shows wrong-role screen and signs out', async ({ page }) => {
    test.skip(!creds.contractor.email, 'TEST_CONTRACTOR_EMAIL not set');
    await page.goto(`${BASE}/en/login`);
    await fillLoginForm(page, creds.contractor.email, creds.contractor.password);
    // Should show wrong-role message, NOT redirect to dashboard
    await expect(page.locator('text=/technician|técnico/i').first()).toBeVisible({ timeout: 15000 });
    // Should NOT be on /dashboard
    await expect(page).not.toHaveURL(/\/dashboard/);
    // Contractor portal link should be visible
    await expect(page.locator('a[href*="contractor/login"]')).toBeVisible();
  });

  test('admin cannot login at customer page — shows wrong-role screen', async ({ page }) => {
    test.skip(!creds.admin.email, 'TEST_ADMIN_EMAIL not set');
    await page.goto(`${BASE}/en/login`);
    await fillLoginForm(page, creds.admin.email, creds.admin.password);
    await expect(page.locator('text=/admin/i').first()).toBeVisible({ timeout: 15000 });
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test('already-logged-in customer is redirected away from /login', async ({ page }) => {
    test.skip(!creds.customer.email, 'TEST_CUSTOMER_EMAIL not set');
    // Login first
    await page.goto(`${BASE}/en/login`);
    await fillLoginForm(page, creds.customer.email, creds.customer.password);
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    // Now go back to login — should redirect away
    await page.goto(`${BASE}/en/login`);
    await expect(page).not.toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('?next= param is respected after login', async ({ page }) => {
    test.skip(!creds.customer.email, 'TEST_CUSTOMER_EMAIL not set');
    await page.goto(`${BASE}/en/login?next=/en/booking/select`);
    await fillLoginForm(page, creds.customer.email, creds.customer.password);
    await expect(page).toHaveURL(/\/booking\/select/, { timeout: 15000 });
  });

  test('Spanish locale login works', async ({ page }) => {
    await page.goto(`${BASE}/es/login`);
    await expect(page.locator('text=/Bienvenido|Iniciar sesión/i').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

// ─── Contractor Login ────────────────────────────────────────────────────────

test.describe('Contractor login (/en/contractor/login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('renders technician portal form', async ({ page }) => {
    await page.goto(`${BASE}/en/contractor/login`);
    await expect(page.locator('text=/Technician Portal|Portal de Técnicos/i').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Should have link to apply
    await expect(page.locator('a[href*="contractors/apply"]')).toBeVisible();
    // Should have link to customer login (added in latest deploy)
    await expect(page.locator('a[href*="/en/login"], a[href*="/es/login"]').first()).toBeVisible();
  });

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto(`${BASE}/en/contractor/login`);
    await fillLoginForm(page, 'nobody@example.com', 'wrongpass123');
    await expect(page).toHaveURL(/contractor\/login/, { timeout: 8000 });
    const errorEl = page.locator('text=/incorrect|invalid|incorrectos/i').first();
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });

  test('contractor logs in and lands on /contractor/dashboard or /contractor/pending', async ({ page }) => {
    test.skip(!creds.contractor.email, 'TEST_CONTRACTOR_EMAIL not set');
    await page.goto(`${BASE}/en/contractor/login`);
    await fillLoginForm(page, creds.contractor.email, creds.contractor.password);
    await expect(page).toHaveURL(/\/contractor\/(dashboard|pending)/, { timeout: 15000 });
  });

  test('customer (user role) cannot login at contractor page — shows wrong-role screen', async ({ page }) => {
    test.skip(!creds.customer.email, 'TEST_CUSTOMER_EMAIL not set');
    await page.goto(`${BASE}/en/contractor/login`);
    await fillLoginForm(page, creds.customer.email, creds.customer.password);
    // Should show "not a technician account" message
    await expect(page.locator('text=/technician account|cuenta de técnico/i').first()).toBeVisible({ timeout: 15000 });
    await expect(page).not.toHaveURL(/\/dashboard/);
    // Should offer apply link and customer login link
    await expect(page.locator('a[href*="contractors/apply"]')).toBeVisible();
  });

  test('already-logged-in contractor is redirected away from /contractor/login', async ({ page }) => {
    test.skip(!creds.contractor.email, 'TEST_CONTRACTOR_EMAIL not set');
    await page.goto(`${BASE}/en/contractor/login`);
    await fillLoginForm(page, creds.contractor.email, creds.contractor.password);
    await page.waitForURL(/\/contractor\/(dashboard|pending)/, { timeout: 15000 });
    await page.goto(`${BASE}/en/contractor/login`);
    await expect(page).not.toHaveURL(/\/contractor\/login/, { timeout: 8000 });
  });
});

// ─── Admin Login ─────────────────────────────────────────────────────────────

test.describe('Admin login (/en/admin/login)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('renders admin portal form', async ({ page }) => {
    await page.goto(`${BASE}/en/admin/login`);
    await expect(page.locator('text=/Admin Portal|Portal Administrador/i').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto(`${BASE}/en/admin/login`);
    await fillLoginForm(page, 'nobody@example.com', 'wrongpass123');
    await expect(page).toHaveURL(/admin\/login/, { timeout: 8000 });
    const errorEl = page.locator('[class*="red"],[class*="error"]').first();
    await expect(errorEl).toBeVisible({ timeout: 5000 });
  });

  test('admin logs in and lands on /admin', async ({ page }) => {
    test.skip(!creds.admin.email, 'TEST_ADMIN_EMAIL not set');
    await page.goto(`${BASE}/en/admin/login`);
    await fillLoginForm(page, creds.admin.email, creds.admin.password);
    await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 15000 });
  });

  test('non-admin is rejected and signed out', async ({ page }) => {
    test.skip(!creds.customer.email, 'TEST_CUSTOMER_EMAIL not set');
    await page.goto(`${BASE}/en/admin/login`);
    await fillLoginForm(page, creds.customer.email, creds.customer.password);
    // Should stay on admin login with forbidden message, not redirect to /admin
    await expect(page).not.toHaveURL(/\/admin(?!\/login)/, { timeout: 10000 });
    await expect(page.locator('text=/Access denied|Acceso denegado/i').first()).toBeVisible({ timeout: 10000 });
  });
});

// ─── Route Protection ────────────────────────────────────────────────────────

test.describe('Route protection (unauthenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('/en/booking/select requires auth → redirects to login', async ({ page }) => {
    await page.goto(`${BASE}/en/booking/select`);
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('/en/contractor/dashboard requires contractor auth → redirects to contractor/login', async ({ page }) => {
    await page.goto(`${BASE}/en/contractor/dashboard`);
    await expect(page).toHaveURL(/contractor\/login/, { timeout: 10000 });
  });

  test('/en/admin requires admin auth → redirects to admin/login', async ({ page }) => {
    await page.goto(`${BASE}/en/admin`);
    await expect(page).toHaveURL(/admin\/login/, { timeout: 10000 });
  });

  test('/en/admin/services requires admin auth → redirects to admin/login', async ({ page }) => {
    await page.goto(`${BASE}/en/admin/services`);
    await expect(page).toHaveURL(/admin\/login/, { timeout: 10000 });
  });
});

// ─── Role-based Route Access ─────────────────────────────────────────────────

test.describe('Role-based route access', () => {
  test('customer cannot access /contractor/dashboard — redirected to contractor login', async ({ page }) => {
    test.skip(!creds.customer.email, 'TEST_CUSTOMER_EMAIL not set');
    await page.context().clearCookies();
    // Login as customer first
    await page.goto(`${BASE}/en/login`);
    await fillLoginForm(page, creds.customer.email, creds.customer.password);
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    // Now try to access contractor route
    await page.goto(`${BASE}/en/contractor/dashboard`);
    await expect(page).toHaveURL(/contractor\/login/, { timeout: 10000 });
  });

  test('customer cannot access /admin — redirected to admin login', async ({ page }) => {
    test.skip(!creds.customer.email, 'TEST_CUSTOMER_EMAIL not set');
    await page.context().clearCookies();
    await page.goto(`${BASE}/en/login`);
    await fillLoginForm(page, creds.customer.email, creds.customer.password);
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE}/en/admin`);
    await expect(page).toHaveURL(/admin\/login/, { timeout: 10000 });
  });
});

// ─── Registration Page ───────────────────────────────────────────────────────

test.describe('Registration page', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('renders customer registration form', async ({ page }) => {
    await page.goto(`${BASE}/en/register`);
    await expect(page.locator('input[placeholder*="John Doe"], input[placeholder*="name"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('contractor application flow has different label', async ({ page }) => {
    await page.goto(`${BASE}/en/register?next=/en/contractors/apply`);
    await expect(page.locator('text=/Contractor application|Solicitud de contratista/i').first()).toBeVisible();
  });

  test('already-logged-in user is redirected away from /register', async ({ page }) => {
    test.skip(!creds.customer.email, 'TEST_CUSTOMER_EMAIL not set');
    await page.goto(`${BASE}/en/login`);
    await fillLoginForm(page, creds.customer.email, creds.customer.password);
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await page.goto(`${BASE}/en/register`);
    await expect(page).not.toHaveURL(/\/register/, { timeout: 8000 });
  });
});

// ─── Locale Routing ──────────────────────────────────────────────────────────

test.describe('Locale routing', () => {
  test('/ redirects to /en or /es', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page).toHaveURL(/\/(en|es)(\/|$)/, { timeout: 10000 });
  });

  test('/es/login shows Spanish UI', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE}/es/login`);
    await expect(page.locator('text=/Bienvenido/i').first()).toBeVisible();
  });

  test('/es/contractor/login shows Spanish UI', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(`${BASE}/es/contractor/login`);
    await expect(page.locator('text=/Portal de Técnicos/i').first()).toBeVisible();
  });
});
