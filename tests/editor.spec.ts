import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';

async function uploadScreens(page: Page) {
  await page.getByLabel('Загрузить скриншоты').setInputFiles([
    path.resolve('tests/fixtures/Вход.png'),
    path.resolve('tests/fixtures/Главная.png'),
    path.resolve('tests/fixtures/Детали.png'),
  ]);
  await expect(page.getByTestId('screen-node')).toHaveCount(3);
}

test('UFD-01 — загрузить изображения, переименовать и переместить экран', async ({ page }) => {
  await page.goto('/');
  await uploadScreens(page);
  const screen = page.getByTestId('screen-node').first();
  await expect(screen.getByRole('img')).toBeVisible();
  expect(await screen.getByRole('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await screen.getByRole('textbox', { name: 'Название экрана' }).fill('Авторизация');
  await expect(screen.getByRole('textbox')).toHaveValue('Авторизация');
  const box = await screen.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 80, box!.y + 18);
  await page.mouse.down();
  await page.mouse.move(box!.x + 150, box!.y + 78, { steps: 12 });
  await page.mouse.up();
  const moved = await screen.boundingBox();
  expect(moved!.x - box!.x).toBeGreaterThan(40);
  expect(moved!.y - box!.y).toBeGreaterThan(30);
});

test('UFD-02 — соединить экраны направленной стрелкой и сохранить связь при перемещении', async ({ page }) => {
  await page.goto('/');
  await uploadScreens(page);
  const screens = page.getByTestId('screen-node');
  await screens.nth(0).getByRole('button', { name: 'Начать стрелку' }).click();
  await screens.nth(1).getByRole('button', { name: 'Завершить стрелку' }).click();
  const edge = page.locator('.react-flow__edge-path');
  await expect(edge).toHaveCount(1);
  await expect(edge).toHaveAttribute('marker-end', /url\(.+\)/);
  const before = await edge.getAttribute('d');
  const box = await screens.nth(1).boundingBox();
  await page.mouse.move(box!.x + 70, box!.y + 18);
  await page.mouse.down();
  await page.mouse.move(box!.x + 100, box!.y + 88, { steps: 12 });
  await page.mouse.up();
  await expect(edge).toHaveCount(1);
  await expect(edge).not.toHaveAttribute('d', before!);
  // Удаление экрана удаляет связанную стрелку, а не оставляет висящий переход.
  await screens.nth(1).getByRole('button', { name: 'Удалить экран' }).click();
  await expect(screens).toHaveCount(2);
  await expect(edge).toHaveCount(0);
});

test('UFD-03 — создать, изменить и удалить заметку', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Добавить заметку', exact: true }).click();
  const note = page.getByTestId('note-node');
  await note.getByRole('textbox', { name: 'Текст заметки' }).fill('Что происходит при неверном пароле?');
  await expect(note.getByRole('textbox')).toHaveValue('Что происходит при неверном пароле?');
  const box = await note.boundingBox();
  await page.mouse.move(box!.x + 60, box!.y + 18);
  await page.mouse.down();
  await page.mouse.move(box!.x + 120, box!.y + 68, { steps: 10 });
  await page.mouse.up();
  expect((await note.boundingBox())!.x - box!.x).toBeGreaterThan(30);
  await note.getByRole('button', { name: 'Удалить заметку' }).click();
  await expect(note).toHaveCount(0);
});

test('UFD-04 — ошибка файла не повреждает доску; граница сохранения видна', async ({ page }) => {
  await page.goto('/');
  await uploadScreens(page);
  await page.getByLabel('Загрузить скриншоты').setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('not an image') });
  await expect(page.getByRole('alert')).toContainText('Не удалось');
  await expect(page.getByTestId('screen-node')).toHaveCount(3);
  await expect(page.getByText('Доска хранится только в этой вкладке', { exact: false })).toBeVisible();
});
