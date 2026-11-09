import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
const sides=['left','right','top','bottom'];
test('MASK-19 selected mask shows every nearest-side connection above cards; NOTE-03 has no completion control',async({page})=>{
 const region={id:'r',x:.3,y:.25,width:.2,height:.2,comments:[],noteIds:[...sides,'free']};
 const board={version:1,title:'All mask links',nodes:[{id:'s',type:'screen',position:{x:70,y:100},data:{title:'Source',image:'assets/a.png',regions:[region]}},...sides.concat('free').map((id,i)=>({id,type:'note',position:{x:700,y:100+i*150},data:{title:id,text:'Linked '+id}}))],edges:[],layout:{docks:Object.fromEntries(sides.map(side=>[side,{screenId:'s',side}]))}};
 await page.goto('/');await page.getByLabel('Импорт архива').setInputFiles({name:'links.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'board.json':strToU8(JSON.stringify(board)),'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png')}))});
 await page.getByRole('button',{name:'Область 1',exact:true}).press('Enter');
 await expect(page.locator('.mask-note-connector[data-active="true"]')).toHaveCount(5);
 await expect(page.getByRole('checkbox',{name:/Выполнена/})).toHaveCount(0);
 await expect(page.getByText('Выполнена · остаётся на доске',{exact:true})).toHaveCount(0);
 // Compare actual rendered path endpoints with actual note rectangles in client pixels.
 const geometry=async()=>page.evaluate(()=>{
   const svg=document.querySelector('.mask-note-connectors') as SVGSVGElement;
   return [...svg.querySelectorAll<SVGPathElement>('.mask-note-connector')].map(path=>{
     const note=document.querySelector(`[data-testid="note-node"][data-board-node-id="${path.dataset.noteId}"]`)!.getBoundingClientRect();
     const matrix=path.getScreenCTM()!;const p=path.getPointAtLength(0).matrixTransform(matrix),q=path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
     const nearest={x:Math.max(note.left,Math.min(note.right,p.x)),y:Math.max(note.top,Math.min(note.bottom,p.y))};
     return {id:path.dataset.noteId,start:{x:p.x,y:p.y},end:{x:q.x,y:q.y},nearest,z:Number(getComputedStyle(svg).zIndex),length:path.getTotalLength(),scale:matrix.a};
   });
 });
 await expect.poll(async()=> (await geometry()).every(g=>Math.hypot(g.end.x-g.nearest.x,g.end.y-g.nearest.y)<2)).toBe(true);
 for(const g of await geometry()){
   expect(g.z).toBeGreaterThan(1000);
   const dx=Math.abs(g.end.x-g.start.x),dy=Math.abs(g.end.y-g.start.y);
   if(g.id==='free')expect(Math.abs(g.length*g.scale-Math.hypot(dx,dy))).toBeLessThan(2);
   else{expect(Math.abs(g.length*g.scale-(dx+dy))).toBeLessThan(2);expect(Math.min(dx,dy)).toBeLessThan(2);}
 }
 await page.getByRole('button',{name:'Закрыть связанные заметки'}).click();
 await expect(page.locator('.mask-note-connector[data-active="true"]')).toHaveCount(0);
});
for(const automatic of [false,true])test(`MASK-19 focus keeps a cross-parent docked annotation visible without changing its saved dock (${automatic})`,async({page})=>{
 const board={version:1,title:'Cross-parent focus',nodes:[
  {id:'s',type:'screen',position:{x:70,y:100},data:{title:'Source',image:'assets/a.png',regions:[{id:'r',x:.3,y:.25,width:.2,height:.2,comments:[],noteIds:['free','cross']}]}},
  {id:'other',type:'screen',position:{x:1000,y:600},data:{title:'Other',image:'assets/a.png'}},
  ...['free','cross'].map((id,i)=>({id,type:'note',position:{x:500,y:100+i*200},data:{title:id,text:'Linked '+id}})),
 ],edges:[],layout:{docks:{cross:{screenId:'other',side:'left'}}}};
 await page.goto('/');await page.getByLabel('Импорт архива').setInputFiles({name:'cross.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'board.json':strToU8(JSON.stringify(board)),'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png')}))});
 if(automatic){await page.getByRole('checkbox',{name:'Автоматическая компоновка'}).click();await page.getByRole('button',{name:'Включить автокомпоновку',exact:true}).click();await expect(page.getByText('Расчёт компоновки…',{exact:true})).toHaveCount(0);}
 await page.locator('.screen-list').getByRole('button',{name:'01 Source',exact:true}).click();
 const source=page.locator('[data-testid="screen-node"][data-board-node-id="s"]');await source.getByRole('button',{name:'Область 1',exact:true}).press('Enter');
 await expect(page.locator('.mask-note-connector[data-active="true"]')).toHaveCount(2);
 const exported=async()=>{await expect(page.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible();const d=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт архива'}).click();return JSON.parse(strFromU8(unzipSync(fs.readFileSync((await(await d).path())!))['board.json']));};
 const before=await exported();await page.getByRole('switch',{name:'Режим фокуса'}).click();
 await expect(page.getByTestId('screen-node')).toHaveCount(1);
 await expect(page.locator('[data-testid="note-node"][data-board-node-id="cross"]')).toBeVisible();
 await expect(page.locator('.mask-note-connector[data-active="true"]')).toHaveCount(2);
 expect(await exported()).toEqual(before);
 await page.getByRole('switch',{name:'Режим фокуса'}).click();
 await expect(page.locator('[data-testid="screen-node"][data-board-node-id="other"] [data-testid="note-node"][data-board-node-id="cross"]')).toBeVisible();
 expect(await exported()).toEqual(before);
});
