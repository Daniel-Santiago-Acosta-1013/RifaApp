import { test, expect } from "./fixtures";
import { createMockState, setupMockApi } from "./mocks";
import { seedStorage } from "./storage";

test("flujo comprador reserva y confirma compra", async ({ page }) => {
  const state = createMockState();
  await setupMockApi(page, state);
  await seedStorage(page, { user: state.user, mode: "buy" });

  const raffleId = state.raffles[0].id;
  await page.goto(`/raffles/${raffleId}`);

  await expect(page.getByText("Selecciona tus numeros")).toBeVisible();

  const numbers = state.numbersByRaffleId[raffleId];
  const firstLabel = numbers[0]?.label || "0";
  const secondLabel = numbers[1]?.label || "1";

  const grid = page.getByRole("grid", { name: "Selector de numeros" });
  await grid.getByRole("gridcell", { name: firstLabel }).click();
  await grid.getByRole("gridcell", { name: secondLabel }).click();

  await page.getByRole("button", { name: "Reservar numeros" }).click();
  await expect(page.getByText("Reserva activa")).toBeVisible();

  await page.getByRole("button", { name: "Confirmar compra" }).click();
  await expect(page.getByText("Compra completada")).toBeVisible();

  await page.getByRole("link", { name: "Ver mis compras" }).click();
  await expect(page).toHaveURL("/purchases");
  await expect(page.getByRole("heading", { name: "Tus numeros y comprobantes demo" })).toBeVisible();
});
