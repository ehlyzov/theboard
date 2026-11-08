import { test, expect } from "@playwright/test";
import { zipSync, strToU8, unzipSync, strFromU8 } from "fflate";
import fs from "node:fs";
test("LAYOUT-01 labels avoid nodes/each other; manual geometry exports separately", async ({
  page,
}) => {
  const board = {
    version: 1,
    title: "Layout",
    nodes: [
      { id: "a", type: "screen", data: { title: "A", image: "assets/a.png" } },
      { id: "b", type: "screen", data: { title: "B", image: "assets/a.png" } },
      { id: "n", type: "note", data: { title: "Note", text: "Do not cover" } },
    ],
    edges: [
      { id: "e1", source: "a", target: "b", label: "First transition" },
      { id: "e2", source: "a", target: "b", label: "Second transition" },
    ],
    layout: {
      nodes: {
        a: { x: 60, y: 100 },
        b: { x: 650, y: 100 },
        n: { x: 300, y: 250 },
      },
      edges: {},
    },
  };
  const zip = zipSync({
    "board.json": strToU8(JSON.stringify(board)),
    "assets/a.png": fs.readFileSync("tests/fixtures/Вход.png"),
  });
  await page.goto("/?board=layout-test");
  await page
    .getByLabel("Импорт архива")
    .setInputFiles({
      name: "layout.zip",
      mimeType: "application/zip",
      buffer: Buffer.from(zip),
    });
  await expect(page.getByTestId("edge-label-e1")).toBeVisible();
  const labels = await page.locator(".transition-label").all();
  const nodes = await page
    .locator('[data-testid="screen-node"],[data-testid="note-node"]')
    .all();
  const bounds = await Promise.all(nodes.map((n) => n.boundingBox()));
  const rects = await Promise.all(labels.map((n) => n.boundingBox()));
  function overlap(a: any, b: any) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
  for (const r of rects)
    for (const b of bounds) expect(overlap(r, b)).toBe(false);
  expect(overlap(rects[0], rects[1])).toBe(false);
  const target = page.getByTestId("edge-label-e1");
  const before = await target.boundingBox();
  await page.mouse.move(before!.x + 12, before!.y + 12);
  await page.mouse.down();
  await page.mouse.move(before!.x + 110, before!.y + 110, { steps: 8 });
  await page.mouse.up();
  await expect(
    page.getByRole("status").filter({ hasText: "Сохранено" }),
  ).toBeVisible();
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Экспорт архива" }).click();
  const archive = await (await promise).path();
  const data = JSON.parse(
    strFromU8(unzipSync(fs.readFileSync(archive!))["board.json"]),
  );
  expect(data.nodes.every((n: any) => n.position === undefined)).toBe(true);
  expect(data.layout.nodes.a).toEqual({ x: 60, y: 100 });
  expect(data.layout.edges.e1.manual).toBe(true);
  await page.reload();
  await expect(page.getByTestId("edge-label-e1")).toBeVisible();
});
test("IMAGE-01 portrait/landscape preserve intrinsic ratio without letterboxing", async ({
  page,
}) => {
  await page.goto("/?board=aspect-test");
  await page
    .getByLabel("Загрузить скриншоты")
    .setInputFiles(["tests/fixtures/Вход.png", "tests/fixtures/landscape.png"]);
  await expect(page.getByTestId("screen-node")).toHaveCount(2);
  const frames = page.getByTestId("annotation-image");
  await expect(async () => {
    const a = await frames.nth(0).boundingBox(),
      b = await frames.nth(1).boundingBox();
    expect(a!.width / a!.height).toBeCloseTo(0.6, 1);
    expect(b!.width / b!.height).toBeCloseTo(300 / 180, 1);
  }).toPass();
});

test('IMAGE-01 cached image dimensions survive focus remount before the load event', async ({page}) => {
  // Hold React's image load callback: the first rendered frame must already
  // use known dimensions, including after hidden cards mount again.
  await page.addInitScript(() => {
    const listen = HTMLImageElement.prototype.addEventListener;
    HTMLImageElement.prototype.addEventListener = function(type, listener, options) {
      if (type !== 'load') return listen.call(this, type, listener, options);
    };
  });
  await page.goto('/?board=cached-aspect-test');
  await page.getByLabel('Загрузить скриншоты').setInputFiles(['tests/fixtures/Вход.png','tests/fixtures/landscape.png']);
  const ratios = async () => page.getByTestId('annotation-image').evaluateAll(elements => elements.map(el => {
    const r=el.getBoundingClientRect();return Math.round(r.width/r.height*100)/100;
  }));
  await expect.poll(ratios).toEqual([.6,1.67]);
  await page.locator('.screen-list').getByRole('button',{name:/01 Вход/}).click();
  await page.getByRole('switch',{name:'Режим фокуса'}).click();
  await expect(page.getByTestId('screen-node')).toHaveCount(1);
  await page.getByRole('switch',{name:'Режим фокуса'}).click();
  await expect.poll(ratios).toEqual([.6,1.67]);
});
