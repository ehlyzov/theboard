import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';

test('VIEW-04 normal navigation preserves explicitly chosen400 percent',async({page})=>{
  await page.goto('./');
  await page.getByLabel('Загрузить скриншоты').setInputFiles(['Вход','Главная'].map(name=>'tests/fixtures/'+name+'.png'));
  await expect(page.getByTestId('screen-node')).toHaveCount(2);
  for(let i=0;i<24;i++)await page.getByRole('button',{name:'Увеличить масштаб',exact:true}).click();
  await expect(page.locator('.zoom-controls>span')).toHaveText('400%');
  await page.locator('.screen-list').getByRole('button',{name:'02 Главная',exact:true}).click();
  await page.waitForTimeout(300);
  await expect(page.locator('.zoom-controls>span')).toHaveText('400%');
});

for(const automatic of [false,true])test(`FOCUS-08/VIEW-04 independent list filter and retained user zoom (${automatic})`,async({page})=>{
  const board={version:1,title:'Focus navigation',nodes:['a','b','c','d','other'].map((id,i)=>({id,type:'screen',position:{x:i*2000,y:i*1500},data:{title:id.toUpperCase(),image:'assets/a.png'}})),edges:[{id:'ab',source:'a',target:'b',label:'Enter'},{id:'bc',source:'b',target:'c',label:'Continue'},{id:'cd',source:'c',target:'d',label:'Next'}]};
  await page.goto('./');
  const old=page.url();
  await page.getByLabel('Импорт архива',{exact:true}).setInputFiles({name:'navigation.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'board.json':strToU8(JSON.stringify(board)),'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png')}))});
  await page.waitForURL(url=>url.href!==old);
  await expect(page.getByTestId('screen-node')).toHaveCount(5);
  if(automatic){
    await page.getByRole('checkbox',{name:'Автоматическая компоновка'}).click();
    await page.getByRole('button',{name:'Включить автокомпоновку',exact:true}).click();
    await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(3);
  }
  await page.getByLabel('Направление компоновки').selectOption('DOWN');
  await expect(page.getByText('Расчёт компоновки…',{exact:true})).toHaveCount(0);
  const exported=async()=>{
    await expect(page.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible();
    const waiting=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт архива',exact:true}).click();
    const b=JSON.parse(strFromU8(unzipSync(fs.readFileSync((await(await waiting).path())!))['board.json']));
    for(const p of Object.values(b.layout.nodes) as any[]){p.x=Math.round(p.x*1000)/1000;p.y=Math.round(p.y*1000)/1000;}
    return b;
  };
  const before=await exported();
  const item=(name:string)=>page.locator('.screen-list').getByRole('button',{name,exact:true});
  const focus=page.getByRole('button',{name:'Режим фокуса',exact:true});
  const filter=page.getByRole('switch',{name:'Только выделенные экраны',exact:true});
  const zoom=()=>page.locator('.react-flow__viewport').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
  const rowNames=()=>page.locator('.screen-list button').allTextContents();
  const ids=()=>page.getByTestId('screen-node').evaluateAll(els=>els.map(el=>el.getAttribute('data-board-node-id')).sort());
  await item('02 B').click();await focus.click();
  await expect.poll(ids).toEqual(['a','b','c']);
  await expect(filter).not.toBeChecked();
  await expect(page.locator('.screen-list button')).toHaveCount(5);
  await expect(item('05 OTHER')).toHaveClass(/out-of-focus/);
  await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(2);
  await page.waitForTimeout(300); // Allow the established automatic focus framing to finish.
  const viewBeforeFilter=await page.locator('.react-flow__viewport').getAttribute('style');
  await filter.click();
  await expect.poll(rowNames).toEqual(['01A','02B','03C']);
  await expect(focus).toHaveAttribute('aria-pressed','true');
  expect(await page.locator('.react-flow__viewport').getAttribute('style')).toBe(viewBeforeFilter);
  await item('03 C').click();
  await expect.poll(rowNames).toEqual(['02B','03C','04D']);
  await expect.poll(ids).toEqual(['b','c','d']);
  for(let i=0;i<24;i++)await page.getByRole('button',{name:'Увеличить масштаб',exact:true}).click();
  await expect.poll(zoom).toBe(4);
  await item('02 B').click();
  await expect.poll(ids).toEqual(['a','b','c']);
  await page.waitForTimeout(400);expect(await zoom()).toBe(4);
  await item('02 B').click();await page.waitForTimeout(300);expect(await zoom()).toBe(4);
  await filter.click();await expect(page.locator('.screen-list button')).toHaveCount(5);
  await item('05 OTHER').click();await expect.poll(ids).toEqual(['other']);
  await page.waitForTimeout(400);expect(await zoom()).toBe(4);
  await filter.click();await expect.poll(rowNames).toEqual(['05OTHER']);
  await page.reload();await expect.poll(ids).toEqual(['other']);
  await expect(filter).toBeChecked();await expect.poll(rowNames).toEqual(['05OTHER']);
  await expect.poll(zoom).toBe(4);
  await focus.click();await expect(page.getByTestId('screen-node')).toHaveCount(5);
  await expect(page.locator('.screen-list button')).toHaveCount(5);
  await page.waitForTimeout(300);expect(await zoom()).toBe(4);
  await item('01 A').click();await page.waitForTimeout(300);expect(await zoom()).toBe(4);
  // Native wheel zoom also establishes a navigation scale.
  const canvas=await page.locator('.react-flow').boundingBox();
  await page.mouse.move(canvas!.x+canvas!.width*.6,canvas!.y+canvas!.height*.6);
  await page.mouse.wheel(0,700);await expect.poll(zoom).toBeLessThan(4);
  await page.waitForTimeout(300);const wheelZoom=await zoom();
  await item('02 B').click();await page.waitForTimeout(300);expect(await zoom()).toBeCloseTo(wheelZoom,5);
  await focus.click();await expect.poll(ids).toEqual(['a','b','c']);
  await expect.poll(rowNames).toEqual(['01A','02B','03C']);
  await page.waitForTimeout(300);expect(await zoom()).toBeCloseTo(wheelZoom,5);
  expect(await exported()).toEqual(before);
});
