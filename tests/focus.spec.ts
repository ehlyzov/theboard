import { test, expect } from "@playwright/test";
import path from "node:path";
test("FOCUS-01 one-hop outgoing destinations only; full board survives", async ({
  page,
}) => {
  await page.goto("/?board=focus-test");
  await page
    .getByLabel("Загрузить скриншоты")
    .setInputFiles(
      ["Вход", "Главная", "Детали"].map((n) =>
        path.resolve("tests/fixtures/" + n + ".png"),
      ),
    );
  const screens = page.getByTestId("screen-node");
  await screens.nth(0).getByRole("button", { name: "Начать стрелку" }).click();
  await screens
    .nth(1)
    .getByRole("button", { name: "Завершить стрелку" })
    .click();
  await screens.nth(1).getByRole("button", { name: "Начать стрелку" }).click();
  await screens
    .nth(2)
    .getByRole("button", { name: "Завершить стрелку" })
    .click();
  await screens.nth(0).locator(".node-grip").click();
  await page.getByRole("button", { name: "Режим фокуса" }).click();
  await expect(screens).toHaveCount(2);
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
  await screens.nth(1).locator(".node-grip").click();
  await expect(screens).toHaveCount(2);
  await expect(
    page.getByRole("textbox", { name: "Название экрана" }).first(),
  ).toHaveValue("Главная");
  await page.getByRole("button", { name: "Режим фокуса" }).click();
  await expect(screens).toHaveCount(3);
  await expect(page.locator(".react-flow__edge")).toHaveCount(2);
});
