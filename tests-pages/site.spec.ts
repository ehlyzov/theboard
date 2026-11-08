import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

test('PAGES-01 production prefix supports editor, lazy layout, reload and archive transfer',async({page,browser,baseURL})=>{
  const basePath=new URL(baseURL!).pathname;
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('link',{name:'TheBoard — главная'})).toHaveAttribute('href',basePath);
  await page.getByLabel('Загрузить скриншоты').setInputFiles(['tests/fixtures/Вход.png','tests/fixtures/Главная.png']);
  const screens=page.getByTestId('screen-node');
  await expect(screens).toHaveCount(2);
  await screens.nth(0).getByRole('button',{name:'Начать стрелку'}).click();
  await screens.nth(1).getByRole('button',{name:'Завершить стрелку'}).click();
  await page.getByLabel('Подпись перехода').fill('Hosted transition');
  await page.getByRole('button',{name:'Добавить заметку',exact:true}).click();
  await page.getByLabel('Текст заметки',{exact:true}).fill('Hosted note');
  await page.getByRole('checkbox',{name:'Автоматическая компоновка'}).click();
  await page.getByRole('button',{name:'Включить автокомпоновку',exact:true}).click();
  await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(1);
  await expect(page.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Текст заметки',{exact:true})).toHaveValue('Hosted note');
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'Экспорт архива'}).click();
  const archive=await(await download).path();
  const context=await browser.newContext();
  try{
    const imported=await context.newPage();
    await imported.goto(baseURL!);
    await imported.getByLabel('Импорт архива').setInputFiles(archive!);
    await imported.waitForURL(url=>url.pathname===basePath&&url.searchParams.has('board'));
    await expect(imported.getByTestId('screen-node')).toHaveCount(2);
    await expect(imported.getByLabel('Текст заметки',{exact:true})).toHaveValue('Hosted note');
    await expect(imported.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible();
    await imported.getByRole('link',{name:'TheBoard — главная'}).click();
    await imported.waitForURL(url=>url.pathname===basePath&&!url.search);
    await expect(imported.getByTestId('screen-node')).toHaveCount(2);
  }finally{await context.close();}
  expect(errors).toEqual([]);
});

test('LICENSE-01/PAGES-02 distribution serves canonical license and dependency notices',async({request,baseURL})=>{
  const license=await request.get(new URL('LICENSE.txt',baseURL!).href);
  expect(license.ok()).toBe(true);
  expect(await license.text()).toBe(await fs.readFile('LICENSE','utf8'));
  const notice=await request.get(new URL('NOTICE.txt',baseURL!).href);
  expect(notice.ok()).toBe(true);
  expect(await notice.text()).toBe(await fs.readFile('NOTICE','utf8'));
  const thirdParty=await request.get(new URL('THIRD_PARTY_NOTICES.txt',baseURL!).href);
  expect(thirdParty.ok()).toBe(true);
  expect(await thirdParty.text()).toContain('elkjs@0.12.1');
  expect(await thirdParty.text()).toContain('Eclipse Public License');
  expect(await thirdParty.text()).toContain('react@');
});
