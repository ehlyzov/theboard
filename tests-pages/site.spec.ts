import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {zipSync,strToU8} from 'fflate';

test('UI-06 board title stays above the canvas at 400% and narrow widths',async({page})=>{
  const title='A long board title for checking how the editor header fits at narrow viewport widths';
  const board={version:1,title,nodes:[{id:'a',type:'screen',position:{x:100,y:100},data:{title:'Screen A',image:'assets/a.png'}}],edges:[]};
  await page.goto('./');
  await page.getByLabel('Импорт архива',{exact:true}).setInputFiles({name:'heading.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({
    'board.json':strToU8(JSON.stringify(board)),
    'assets/a.png':await fs.readFile('tests/fixtures/Вход.png'),
  }))});
  await expect(page.getByTestId('screen-node')).toHaveCount(1);
  const zoom=page.getByRole('button',{name:'Увеличить масштаб',exact:true});
  for(let i=0;i<24;i++)await zoom.click();
  await expect(page.locator('.zoom-controls>span')).toHaveText('400%');
  const header=page.getByRole('banner');
  const heading=header.getByRole('heading',{level:1,name:title,exact:true});
  const canvas=page.getByRole('main');
  for(const width of [1440,1024,390]){
    await page.setViewportSize({width,height:900});
    await expect(heading).toBeVisible();
    await expect(canvas.getByRole('heading',{name:title,exact:true})).toHaveCount(0);
    const [titleBox,canvasBox]=await Promise.all([heading.boundingBox(),canvas.boundingBox()]);
    expect(titleBox!.y+titleBox!.height).toBeLessThanOrEqual(canvasBox!.y);
    expect(titleBox!.x+titleBox!.width).toBeLessThanOrEqual(width);
    for(const name of ['Импорт ZIP','Экспорт архива']){
      await expect(header.getByRole('button',{name,exact:true})).toBeInViewport();
    }
  }
});

test('UI-07 screen cards keep their sidebar numbers in focus and after board edits',async({page})=>{
  const screen=(id:string,x:number)=>({id,type:'screen',position:{x,y:100},data:{title:`Screen ${id}`,image:'assets/a.png'}});
  const board={version:1,title:'Screen numbering',nodes:[
    screen('A',100),
    {id:'note',type:'note',position:{x:100,y:650},data:{title:'Note',text:'Between screens in the board file'}},
    screen('B',450),screen('C',800),
  ],edges:[]};
  await page.goto('./');
  await page.getByLabel('Импорт архива',{exact:true}).setInputFiles({name:'numbering.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({
    'board.json':strToU8(JSON.stringify(board)),
    'assets/a.png':await fs.readFile('tests/fixtures/Вход.png'),
  }))});
  await expect(page.getByTestId('screen-node')).toHaveCount(3);
  const row=(name:string)=>page.locator('.screen-list').getByRole('button',{name,exact:true});
  const card=(id:string)=>page.getByTestId('screen-node').filter({has:page.getByRole('img',{name:`Screen ${id}`,exact:true})});
  const number=(id:string)=>card(id).getByTestId('screen-number');
  await expect(number('A')).toHaveText('01');
  await expect(number('B')).toHaveText('02');
  await expect(number('C')).toHaveText('03');
  await expect(page.getByTestId('note-node').getByTestId('screen-number')).toHaveCount(0);
  await row('03 Screen C').click();
  const focus=page.getByRole('button',{name:'Режим фокуса',exact:true});
  await focus.click();
  await page.getByRole('switch',{name:'Только выделенные экраны',exact:true}).click();
  await expect(page.locator('.screen-list button')).toHaveCount(1);
  await expect(row('03 Screen C')).toBeVisible();
  await expect(number('C')).toHaveText('03');
  await focus.click();
  await row('01 Screen A').click();
  await card('A').getByRole('button',{name:'Удалить экран',exact:true}).click();
  await expect(number('C')).toHaveText('02');
  await expect(row('02 Screen C')).toBeVisible();
  await expect(page.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible();
  await page.reload();
  await expect(number('C')).toHaveText('02');
  await expect(card('C').getByRole('textbox',{name:'Название экрана'})).toHaveValue('Screen C');
});

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
