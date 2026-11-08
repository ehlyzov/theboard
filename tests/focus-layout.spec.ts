import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';

for (const automatic of [false, true]) {
  test(`FOCUS-04..06 temporary compact layout preserves canonical geometry (${automatic ? 'automatic' : 'manual'})`, async ({ page }) => {
    const board = {
      version: 1, title: 'Temporary focus',
      nodes: ['a', 'b', 'c', 'd'].map((id, i) => ({ id, type: 'screen', position: { x: i * 7000, y: i * 4000 }, data: { title: id.toUpperCase(), image: 'assets/a.png' } })).concat([
        { id: 'attached', type: 'note', position: { x: 0, y: 600 }, data: { title: 'Attached', text: 'Docked content' } },
        { id: 'linked', type: 'note', position: { x: -8000, y: -5000 }, data: { title: 'Linked', text: 'Linked content' } },
      ] as any),
      edges: [
        { id: 'ab', source: 'a', target: 'b', label: 'Continue B' },
        { id: 'ac', source: 'a', target: 'c', label: 'Continue C' },
        { id: 'bd', source: 'b', target: 'd', label: 'Continue D' },
      ],
      layout: { docks: { attached: { screenId: 'a', side: 'bottom' } }, edges: { ab: { label: { x: 6000, y: -1000 }, manual: true, points: [{ x: 230, y: 200 }, { x: 7000, y: 200 }] } } },
    };
    (board.nodes[0].data as any).regions = [{ id: 'mask', x: .1, y: .1, width: .2, height: .2, comments: [], noteIds: ['linked'] }];
    await page.goto('/');
    await page.getByLabel('Импорт архива').setInputFiles({ name: 'focus.zip', mimeType: 'application/zip', buffer: Buffer.from(zipSync({ 'board.json': strToU8(JSON.stringify(board)), 'assets/a.png': fs.readFileSync('tests/fixtures/Вход.png') })) });
    await expect(page.getByTestId('screen-node')).toHaveCount(4);
    if (automatic) {
      await page.getByRole('checkbox', { name: 'Автоматическая компоновка' }).click();
      await page.getByRole('button', { name: 'Включить автокомпоновку', exact: true }).click();
      await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(3);
      await expect(page.getByText('Расчёт компоновки…', { exact: true })).toHaveCount(0);
    }
    const exported = async () => {
      await expect(page.getByRole('status').filter({ hasText: 'Сохранено' })).toBeVisible();
      const download = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Экспорт архива' }).click();
      return JSON.parse(strFromU8(unzipSync(fs.readFileSync((await (await download).path())!))['board.json']));
    };
    const rootPositions = () => page.locator('.react-flow__node-screen').evaluateAll(elements => Object.fromEntries(elements.map(el => {
      const m = new DOMMatrix(getComputedStyle(el).transform);
      return [el.getAttribute('data-id'), { x: m.m41, y: m.m42 }];
    })));
    const before = await exported();
    const rootsBefore = await rootPositions();
    const source = page.locator('.screen-list').getByRole('button', { name: /^01 A$/ });
    await source.click();
    await page.getByRole('switch', { name: 'Режим фокуса' }).click();
    await expect(page.getByTestId('screen-node')).toHaveCount(3);
    await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(2);
    await expect.poll(async () => {
      const positions = Object.values(await rootPositions()) as {x:number;y:number}[];
      return Math.max(...positions.map(p => p.x)) - Math.min(...positions.map(p => p.x));
    }).toBeLessThan(2500);
    await expect(page.locator('.docked-slot [data-testid="note-node"]')).toHaveCount(1);
    expect((await exported()).layout).toEqual(before.layout);
    // Visiting another source must not accumulate or commit previous focus geometry.
    await page.locator('.screen-list').getByRole('button', { name: /^02 B$/ }).click();
    await expect(page.getByTestId('screen-node')).toHaveCount(2);
    await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(1);
    expect((await exported()).layout).toEqual(before.layout);
    await source.click();
    await expect(page.getByTestId('screen-node')).toHaveCount(3);
    await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(2);
    if (!automatic) {
      await page.locator('[data-board-node-id="attached"]').getByLabel('Текст заметки').fill('Edited without moving the board');
    }
    await page.reload();
    await expect(page.getByRole('switch', { name: 'Режим фокуса' })).toBeChecked();
    await expect(page.getByTestId('screen-node')).toHaveCount(3);
    await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(2);
    expect((await exported()).layout).toEqual(before.layout);
    await page.getByRole('switch', { name: 'Режим фокуса' }).click();
    await expect(page.getByTestId('screen-node')).toHaveCount(4);
    await expect.poll(rootPositions).toEqual(rootsBefore);
    const after = await exported();
    expect(after.layout).toEqual(before.layout);
    if (!automatic) expect(after.nodes.find((n: any) => n.id === 'attached').data.text).toBe('Edited without moving the board');
    // A pending source change followed immediately by exit cannot apply later.
    await page.getByRole('switch', { name: 'Режим фокуса' }).click();
    await page.locator('.screen-list').getByRole('button', { name: /^02 B$/ }).click();
    await page.getByRole('switch', { name: 'Режим фокуса' }).click();
    await page.waitForTimeout(500);
    expect(await rootPositions()).toEqual(rootsBefore);
    expect((await exported()).layout).toEqual(before.layout);
  });
}
