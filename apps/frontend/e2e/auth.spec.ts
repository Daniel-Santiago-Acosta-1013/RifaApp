import { test, expect } from "./fixtures";
import { createMockState, setupMockApi } from "./mocks";

test("guest ve onboarding y navega a login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Crear cuenta" })).toBeVisible();
  await page.getByRole("link", { name: "Ya tengo cuenta" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Bienvenido de vuelta" })).toBeVisible();
});

test("registro inicia sesion y carga home", async ({ page }) => {
  const state = createMockState();
  await setupMockApi(page, state);

  await page.goto("/register");
  await page.getByLabel("Nombre").fill("Demo User");
  await page.getByLabel("Email").fill(state.user.email);
  await page.getByLabel("Contrasena").fill("password123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /elige tus numeros/i })).toBeVisible();
});

test("login inicia sesion y carga home", async ({ page }) => {
  const state = createMockState();
  await setupMockApi(page, state);

  await page.goto("/login");
  await page.getByLabel("Email").fill(state.user.email);
  await page.getByLabel("Contrasena").fill("password123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /elige tus numeros/i })).toBeVisible();
});
