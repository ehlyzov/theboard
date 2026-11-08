import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from 'node:fs';
import {unzipSync,strFromU8} from 'fflate';
test('MASK-14 pending mask stays visible while writing a note and commits or cancels cleanly', async ({page}) => {
  await page.goto('/?board=pending-mask-test');
  await page.getByLabel('Загрузить скриншоты').setInputFiles(['tests/fixtures/Вход.png','tests/fixtures/Главная.png']);
  const screens=page.getByTestId('screen-node'), source=screens.nth(0);
  const preview=source.getByTestId('pending-region-preview');
  const paintPending=async()=>{
    await source.getByRole('button',{name:'Кисть выделения',exact:true}).click();
    const box=await source.getByTestId('annotation-image').boundingBox();
    await page.mouse.move(box!.x+box!.width*.2,box!.y+box!.height*.4);
    await page.mouse.down();
    await page.mouse.move(box!.x+box!.width*.7,box!.y+box!.height*.6,{steps:8});
    await page.mouse.up();
    const points=await source.locator('.brush-draft polyline').getAttribute('points');
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Текст новой заметки')).toBeVisible();
    await expect(preview).toBeVisible();
    await expect(preview.locator('polyline')).toHaveAttribute('points',points!);
    await expect(screens.nth(1).getByTestId('pending-region-preview')).toHaveCount(0);
    return points!;
  };
  await paintPending();
  await page.getByLabel('Текст новой заметки').fill('Keep this target visible');
  await page.getByLabel('Текст новой заметки').press('Enter');
  await expect(preview).toBeVisible();
  await expect(page.getByTestId('note-node')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Область 1',exact:true})).toHaveCount(0);
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'Экспорт архива'}).click();
  const raw=JSON.parse(strFromU8(unzipSync(fs.readFileSync((await(await download).path())!))['board.json']));
  expect(raw.nodes.every((n:any)=>!(n.data.regions??[]).length)).toBe(true);
  expect(raw.nodes.filter((n:any)=>n.type==='note')).toHaveLength(0);
  await page.getByRole('button',{name:'Отменить выбор заметки'}).click();
  await expect(preview).toHaveCount(0);
  await expect(page.getByTestId('note-node')).toHaveCount(0);
  const points=await paintPending();
  await page.getByLabel('Текст новой заметки').fill('Visible target note');
  await expect(preview).toBeVisible();
  await page.getByRole('button',{name:'Создать и связать',exact:true}).click();
  await expect(preview).toHaveCount(0);
  await expect(source.getByRole('button',{name:'Область 1',exact:true})).toHaveCount(1);
  await expect(source.locator('.brush-mask polyline')).toHaveAttribute('points',points);
  await expect(page.getByTestId('note-node')).toHaveCount(1);
  await expect(page.getByTestId('note-node')).toHaveClass(/is-linked/);
  await expect(page.locator('.mask-note-connector')).toHaveCount(1);
});
test('MASK-13 active screen marker exposes pointer size control synchronized with brackets', async ({page}) => {
  await page.goto('/?board=marker-size-test');
  await page.getByLabel('Загрузить скриншоты').setInputFiles(['tests/fixtures/Вход.png','tests/fixtures/Главная.png']);
  const screens=page.getByTestId('screen-node');
  await screens.nth(0).getByRole('button',{name:'Кисть выделения',exact:true}).click();
  const slider=page.getByRole('slider',{name:'Размер маркера'});
  await expect(slider).toHaveCount(1);
  await expect(screens.nth(0).getByRole('slider')).toBeVisible();
  await expect(screens.nth(1).getByRole('slider')).toHaveCount(0);
  await expect(slider).toHaveValue('6');
  await slider.press(']');
  await expect(slider).toHaveValue('7');
  await slider.press('[');
  await expect(slider).toHaveValue('6');
  const before=await page.locator('.react-flow__node-screen').first().getAttribute('style');
  const box=await slider.boundingBox();
  await slider.click({position:{x:box!.width*.75,y:box!.height/2}});
  const size=Number(await slider.inputValue());
  expect(size).toBeGreaterThan(6);
  await expect(screens.nth(0).locator('output')).toHaveText(size+'%');
  await expect(page.locator('.react-flow__node-screen').first()).toHaveAttribute('style',before!);
  await expect(page.getByRole('button',{name:'Область 1',exact:true})).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(slider).toHaveCount(0);
});
test("MASK-12/UI-03 contextual screen marker and UI-04 footer hint", async ({ page }) => {
  await page.goto("/?board=contextual-marker-test");
  await page.getByLabel("Загрузить скриншоты").setInputFiles([
    path.resolve("tests/fixtures/Вход.png"),
    path.resolve("tests/fixtures/Вход.png"),
  ]);
  const screens = page.getByTestId("screen-node");
  await expect(screens).toHaveCount(2);
  await expect(page.getByRole("toolbar").getByRole("button", { name: "Кисть выделения", exact: true })).toHaveCount(0);
  const marker = (index: number) => screens.nth(index).getByRole("button", { name: "Кисть выделения", exact: true });
  await marker(0).click();
  await expect(marker(0)).toHaveAttribute("aria-pressed", "true");
  await expect(marker(1)).toBeDisabled();
  const image = await screens.nth(0).getByTestId("annotation-image").boundingBox();
  await page.mouse.move(image!.x + image!.width * .3, image!.y + image!.height * .3);
  await page.mouse.down();
  await page.mouse.move(image!.x + image!.width * .6, image!.y + image!.height * .6, { steps: 5 });
  await page.mouse.up();
  await expect(screens.nth(0).locator(".brush-draft")).toHaveCount(1);
  await expect(screens.nth(1).locator(".brush-draft")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(marker(1)).toBeEnabled();
  await screens.nth(1).hover();
  await page.keyboard.press("b");
  await expect(marker(1)).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  await expect(screens.locator(".brush-draft")).toHaveCount(0);
  const hint = page.locator(".status-bar .canvas-tip");
  await expect(hint).toBeVisible();
  const hintBox = await hint.boundingBox();
  const canvasBox = await page.getByLabel("Полотно пользовательского потока").boundingBox();
  expect(hintBox!.y).toBeGreaterThanOrEqual(canvasBox!.y + canvasBox!.height);
});
async function paint(page: any) {
  await page
    .getByRole("button", { name: "Кисть выделения", exact: true })
    .click();
  const r = await page.getByTestId("annotation-image").boundingBox();
  await page.mouse.move(r.x + r.width * 0.2, r.y + r.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width * 0.7, r.y + r.height * 0.6, {
    steps: 12,
  });
  await page.mouse.up();
  await page.keyboard.press("]");
  await page.mouse.move(r.x + r.width * 0.3, r.y + r.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(r.x + r.width * 0.6, r.y + r.height * 0.75, {
    steps: 5,
  });
  await page.mouse.up();
  await page.keyboard.press("Enter");
}
test("MASK-01..05 brush links existing/new notes, cancel, reload and archive", async ({
  page,
  browser,
}) => {
  await page.goto("/?board=mask-test");
  await page
    .getByRole("button", { name: "Добавить заметку", exact: true })
    .click();
  await page.getByLabel("Текст заметки").fill("Existing audit note");
  await page
    .getByLabel("Загрузить скриншоты")
    .setInputFiles(path.resolve("tests/fixtures/Вход.png"));
  await page.getByRole('button',{name:'Приклеить заметку',exact:true}).click();
  await page.getByLabel('Экран для приклеивания').selectOption({label:'Вход'});
  await page.getByLabel('Сторона приклеивания').selectOption('bottom');
  await page.getByRole('button',{name:'Приклеить',exact:true}).click();
  await paint(page);
  await page
    .getByLabel("Заметка для области")
    .selectOption({ label: "Existing audit note" });
  await page
    .getByRole("button", { name: "Связать с заметкой", exact: true })
    .click();
  await expect(page.getByTestId("note-node")).toHaveClass(/is-linked/);
  await expect(page.getByTestId("note-node")).toHaveCount(1);
  await page.getByRole("button", { name: "Закрыть связанные заметки" }).click();
  const imageBounds = await page.getByTestId("annotation-image").boundingBox();
  await page.mouse.move(
    imageBounds!.x + imageBounds!.width * 0.3,
    imageBounds!.y + imageBounds!.height * 0.36,
  );
  await expect(page.locator(".mask-note-connector")).toHaveCount(1);
  await expect(page.getByTestId("note-node")).toHaveClass(/is-linked/);
  await page
    .getByRole("button", { name: "Область 1", exact: true })
    .press("Enter");
  await expect(page.getByTestId("note-node")).toHaveClass(/is-linked/);
  await page
    .getByRole("button", { name: "Добавить связь с заметкой", exact: true })
    .click();
  await page.getByLabel("Текст новой заметки").fill("Second note");
  await page
    .getByRole("button", { name: "Создать и связать", exact: true })
    .click();
  await expect(page.getByTestId("note-node")).toHaveCount(2);
  await page.getByRole("button", { name: "Удалить выбранную область" }).click();
  await expect(
    page.getByRole("button", { name: "Область 1", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByTestId("note-node")).toHaveCount(2);
  await page.getByRole("button", { name: "Отменить удаление области" }).click();
  await page
    .getByRole("button", { name: "Область 1", exact: true })
    .press("Enter");
  await page.getByRole("button", { name: "Закрыть связанные заметки" }).click();
  await paint(page);
  await page.getByRole("button", { name: "Отменить выбор заметки" }).click();
  await expect(page.getByTestId("note-node")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Область 2", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("status").filter({ hasText: "Сохранено" }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole("button", { name: "Область 1", exact: true })
    .press("Enter");
  await expect(page.locator(".note-card.is-linked")).toHaveCount(2);
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Экспорт архива" }).click();
  const archive = await (await promise).path();
  const ctx = await browser.newContext();
  const next = await ctx.newPage();
  await next.goto("/");
  await next.getByLabel("Импорт архива").setInputFiles(archive!);
  await next
    .getByRole("button", { name: "Область 1", exact: true })
    .press("Enter");
  await expect(next.locator(".note-card.is-linked")).toHaveCount(2);
  await ctx.close();
});
test("VIEW-01..02 zoom to 400 percent and restore viewport", async ({
  page,
}) => {
  await page.goto("/?board=viewport-test");
  for (let i = 0; i < 18; i++)
    await page.getByRole("button", { name: "Увеличить масштаб" }).click();
  await expect(page.locator(".zoom-controls")).toContainText("400%");
  await page.waitForTimeout(100);
  await page.reload();
  await expect(page.locator(".zoom-controls")).toContainText("400%");
});
test("VIEW-03 Alt-drag pans over an editable note without editing it", async ({
  page,
}) => {
  await page.goto("/?board=pan-test");
  await page
    .getByRole("button", { name: "Добавить заметку", exact: true })
    .click();
  await page.getByLabel("Текст заметки").fill("Keep text");
  const note = page.getByTestId("note-node");
  const before = await note.boundingBox();
  const box = await page.getByLabel("Текст заметки").boundingBox();
  await page.keyboard.down("Alt");
  await page.mouse.move(box!.x + 30, box!.y + 30);
  await page.mouse.down();
  await page.mouse.move(box!.x + 140, box!.y + 100, { steps: 10 });
  await page.mouse.up();
  await page.keyboard.up("Alt");
  const after = await note.boundingBox();
  expect(after!.x - before!.x).toBeGreaterThan(80);
  await expect(page.getByLabel("Текст заметки")).toHaveValue("Keep text");
});
