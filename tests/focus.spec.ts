import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from 'node:fs';
import {zipSync,strToU8} from 'fflate';
test('FOCUS-02 distant neighbors retain readable source framing and current-menu navigation',async({page})=>{
 const board={version:1,title:'Distant flow',nodes:[['a','Near',70,100],['b','Far',10000,100],['c','Below',70,12000]].map(([id,title,x,y])=>({id,type:'screen',position:{x,y},data:{title,image:'assets/a.png'}})),edges:[{id:'ab',source:'a',target:'b',label:'Go far'},{id:'ac',source:'a',target:'c',label:'Go below'}]};
 await page.goto('/');await page.getByLabel('Импорт архива').setInputFiles({name:'distant.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'board.json':strToU8(JSON.stringify(board)),'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png')}))});
 const current=page.locator('.screen-list').getByRole('button',{name:/Near/});await current.click();
 await page.getByRole('switch',{name:'Режим фокуса'}).click();
 const zoom=async()=>Number((await page.locator('.zoom-controls>span').innerText()).replace(/[^\d.]/g,''));
 await expect.poll(zoom).toBeGreaterThanOrEqual(50);
 await expect(page.getByTestId('screen-node')).toHaveCount(3);
 for(let i=0;i<8;i++)await page.getByRole('button',{name:'Уменьшить масштаб'}).click();
 await current.click();await expect.poll(zoom).toBeGreaterThanOrEqual(50);
 await page.locator('.screen-list').getByRole('button',{name:/Far/}).click();
 await expect(page.getByTestId('screen-node')).toHaveCount(1);
 await expect(page.getByRole('textbox',{name:'Название экрана'})).toHaveValue('Far');
});
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
  await expect(page.getByRole('switch',{name:'Режим фокуса'})).toBeChecked();
  await expect(page.locator('.screen-list .is-current')).toHaveCount(1);
  await expect(page.locator('.screen-list .in-focus')).toHaveCount(2);
  await expect(screens).toHaveCount(2);
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
  const outside = page.locator('.screen-list').getByRole('button', {name: /Детали/});
  await expect(outside).toHaveClass(/out-of-focus/);
  await expect(outside).toBeEnabled();
  await outside.click();
  await expect(screens).toHaveCount(1);
  await expect(page.getByRole('textbox', {name:'Название экрана'})).toHaveValue('Детали');
  await page.locator('.screen-list').getByRole('button', {name:/Вход/}).click();
  await expect(screens).toHaveCount(2);
  await screens.nth(1).locator(".node-grip").click();
  await expect(screens).toHaveCount(2);
  await expect(
    page.getByRole("textbox", { name: "Название экрана" }).first(),
  ).toHaveValue("Главная");
  await page.getByRole("switch", { name: "Режим фокуса" }).click();
  await expect(page.getByRole('switch',{name:'Режим фокуса'})).not.toBeChecked();
  await expect(screens).toHaveCount(3);
  await expect(page.locator(".react-flow__edge")).toHaveCount(2);
  await expect(page.locator('.screen-list .out-of-focus')).toHaveCount(0);
});
