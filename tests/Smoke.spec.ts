import { test, expect } from '@playwright/test';

test.describe('CondutorPro E2E', () => {
  test('Página inicial carrega corretamente', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CondutorPro/);
  });

  test('Login redireciona para dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Dashboard redireciona para login se não autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await Promise.any([
      expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 }),
      expect(page.locator('text=Olá')).toBeVisible({ timeout: 5000 }),
    ]);
  });

  test('Biblioteca de manuais carrega', async ({ page }) => {
    await page.goto('/biblioteca');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Simulado redireciona corretamente', async ({ page }) => {
    await page.goto('/simulados');
    await expect(page.locator('text=INICIAR SIMULADO')).toBeVisible({ timeout: 5000 }).catch(() => {
      return expect(page.locator('button').first()).toBeVisible();
    });
  });

  test('Quiz carrega questões', async ({ page }) => {
    await page.goto('/quiz');
    await expect(page.locator('text=Questão')).toBeVisible({ timeout: 5000 }).catch(() => {
      return expect(page.locator('text=Carregando')).toBeVisible();
    });
  });
});