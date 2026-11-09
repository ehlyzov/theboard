import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {unzipSync,strFromU8,zipSync,strToU8} from 'fflate';
test('AUTO-01 hidden docked-note coordinates follow their composite when direction changes in focus',async({page})=>{
 const ids=['a','b','c'];const board={version:1,title:'Dock geometry',nodes:ids.flatMap((id,i)=>[
  {id,type:'screen',position:{x:i*500,y:100},data:{title:id.toUpperCase(),image:'assets/a.png'}},
  {id:'n-'+id,type:'note',position:{x:i*500,y:600},data:{title:'Note '+id,text:'Attached '+id}}
 ]),edges:[{id:'ab',source:'a',target:'b',label:'Go B'},{id:'bc',source:'b',target:'c',label:'Go C'}],layout:{docks:Object.fromEntries(ids.map(id=>['n-'+id,{screenId:id,side:'bottom'}]))}};
 await page.goto('/');await page.getByLabel('Импорт архива').setInputFiles({name:'dock.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'board.json':strToU8(JSON.stringify(board)),'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png')}))});
 await page.getByRole('checkbox',{name:'Автоматическая компоновка'}).click();await page.getByRole('button',{name:'Включить автокомпоновку'}).click();
 await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(2);
 const exported=async()=>{await expect(page.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт архива'}).click();return JSON.parse(strFromU8(unzipSync(fs.readFileSync((await(await download).path())!))['board.json']));};
 const before=await exported();
 const relative=await page.locator('[data-testid="screen-node"][data-board-node-id="c"]').evaluate(el=>{
   const p=el.getBoundingClientRect(),n=el.querySelector('[data-testid="note-node"]')!.getBoundingClientRect(),scale=p.width/(el as HTMLElement).offsetWidth;
   return {x:(n.x-p.x)/scale,y:(n.y-p.y)/scale};
 });
 await page.locator('.screen-list').getByRole('button',{name:/01 A/}).click();await page.getByRole('switch',{name:'Режим фокуса'}).click();
 const path=await page.locator('.react-flow__edge-path').first().getAttribute('d');await page.getByLabel('Направление компоновки').selectOption('DOWN');
 await expect(page.locator('.react-flow__edge-path').first()).not.toHaveAttribute('d',path!);
 // Focus now has its own temporary routes; their change does not signal that
 // the explicitly requested global DOWN computation has finished.
 await expect(page.getByText('Расчёт компоновки…',{exact:true})).toHaveCount(0);
 const after=await exported();expect(after.layout.engine.options['elk.direction']).toBe('DOWN');
 const a=before.layout.nodes.c,b=after.layout.nodes.c,m=after.layout.nodes['n-c'];
 expect(Math.hypot(b.x-a.x,b.y-a.y)).toBeGreaterThan(100);
 expect(Math.abs(m.x-b.x-relative.x),JSON.stringify({a,b,m,relative})).toBeLessThan(1);
 expect(Math.abs(m.y-b.y-relative.y),JSON.stringify({a,b,m,relative})).toBeLessThan(1);
});
test('AUTO-01..02 full editor layout is optional, confirmed, portable and keeps editing',async({page})=>{
 await page.goto('/?board=auto-layout-test');
 await page.getByLabel('Загрузить скриншоты').setInputFiles(['tests/fixtures/Вход.png','tests/fixtures/Главная.png']);
 const screens=page.getByTestId('screen-node');
 await screens.nth(0).getByRole('button',{name:'Начать стрелку'}).click();
 await screens.nth(1).getByRole('button',{name:'Завершить стрелку'}).click();
 await page.getByLabel('Подпись перехода').fill('Continue safely');
 const first=page.locator('.react-flow__node').first(), before=await first.getAttribute('style');
 await page.getByRole('checkbox',{name:'Автоматическая компоновка'}).click();
 await expect(page.getByRole('dialog')).toContainText('Ручная компоновка будет сброшена');
 await page.getByRole('button',{name:'Отмена',exact:true}).click();
 await expect(first).toHaveAttribute('style',before!);
 await expect(page.getByRole('checkbox',{name:'Автоматическая компоновка'})).not.toBeChecked();
 await page.getByRole('checkbox',{name:'Автоматическая компоновка'}).click();
 await page.getByRole('button',{name:'Включить автокомпоновку',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'Автоматическая компоновка'})).toBeChecked();
 await expect(page.locator('.react-flow__edge-path')).toHaveAttribute('data-routed','true');
 await screens.nth(0).getByLabel('Название экрана').fill('Edited after layout');
 await expect(screens.nth(0).getByLabel('Название экрана')).toHaveValue('Edited after layout');
 await expect(page.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible();
 await page.reload();
 await expect(page.getByRole('checkbox',{name:'Автоматическая компоновка'})).toBeChecked();
 await expect(page.locator('.react-flow__edge-path')).toHaveAttribute('data-routed','true');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт архива'}).click();
 const file=await(await download).path();const raw=JSON.parse(strFromU8(unzipSync(fs.readFileSync(file!))['board.json']));
 expect(raw.layout.automatic).toBe(true);expect(raw.layout.edges[raw.edges[0].id].points.length).toBeGreaterThan(1);
 expect(raw.nodes[0].data.title).toBe('Edited after layout');
 await page.getByRole('checkbox',{name:'Автоматическая компоновка'}).uncheck();
 const pos=await first.boundingBox();await first.locator('.node-grip').hover();
 await page.mouse.move(pos!.x+70,pos!.y+15);await page.mouse.down();await page.mouse.move(pos!.x+130,pos!.y+80,{steps:8});await page.mouse.up();
 await expect(first).not.toHaveAttribute('style',before!);
 await expect(page.getByRole('checkbox',{name:'Автоматическая компоновка'})).not.toBeChecked();
});
