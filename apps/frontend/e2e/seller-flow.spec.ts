import { test, expect } from "./fixtures";
import { createMockState, setupMockApi } from "./mocks";
import { seedStorage } from "./storage";

test("flujo vendedor crea rifa y aparece en listado", async ({ page }) => {
  const state = createMockState();
  await setupMockApi(page, state);
  await seedStorage(page, { user: state.user, mode: "sell" });

  await page.goto("/create");
  await page.getByLabel("Titulo").fill("Rifa demo nueva");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Revisar" }).click();
  await page.getByRole("button", { name: "Crear rifa" }).click();

  await expect(page).toHaveURL(/\/raffles\//);
  await expect(page.getByText("Selecciona tus numeros")).toBeVisible();

  await page.goto("/sell/raffles");
  await expect(page.getByText("Inventario y progreso")).toBeVisible();
  await expect(page.getByText("Rifa demo nueva")).toBeVisible();
});
