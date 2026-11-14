import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {zipSync,strToU8} from 'fflate';

async function fixture(page:Page,side:string){
 const nodes=['s','a','b','c'].map((id,i)=>({id,type:'screen',position:{x:i*600,y:i*90},data:{title:id,image:'assets/a.png'}}));
 const board={version:1,title:'Active faces',nodes:[...nodes,{id:'note',type:'note',position:{x:900,y:800},data:{title:'Docked',text:'Preserve this note'}}],
  edges:['a','b','c'].flatMap(id=>[{id:'out-'+id,source:'s',target:id,label:'Outgoing '+id},{id:'in-'+id,source:id,target:'s',label:'Incoming '+id}]),
  layout:{docks:{note:{screenId:'s',side}}}};
 await page.goto('/');const before=page.url();await page.getByLabel('Импорт архива').setInputFiles({name:'faces.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'board.json':strToU8(JSON.stringify(board)),'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png')}))});
 await page.waitForURL(url=>url.href!==before,{waitUntil:'load'});await expect(page.getByTestId('screen-node')).toHaveCount(4);
}

for(const side of ['left','right','top','bottom'])for(const direction of ['RIGHT','DOWN'])test(`DOCK-08/09 ${side} dock exposes only its outward face (${direction})`,async({page})=>{
 await fixture(page,side);
 const source=page.locator('[data-testid="screen-node"][data-board-node-id="s"]');
 // Manual handles use the core row, even when top/bottom notes shift it.
 await expect.poll(()=>source.evaluate(el=>{
  const core=el.querySelector('.screen-core')!.getBoundingClientRect();
  const vertical=[...el.querySelectorAll('.screen-vertical-handles .react-flow__handle')].every(handle=>{
   const side=handle.classList.contains('react-flow__handle-top')?'top':'bottom';
   const slot=el.querySelector('.docked-'+side),face=(side==='top'?slot?.firstElementChild:slot?.lastElementChild)??el.querySelector('.screen-core')!;
   const box=face.getBoundingClientRect(),r=handle.getBoundingClientRect();
   return Math.abs(r.x+r.width/2-(core.x+core.width/2))<2&&Math.abs(r.y+r.height/2-(side==='top'?box.top:box.bottom))<2;
  });
  return vertical && [...el.querySelectorAll('.screen-flow-handles .react-flow__handle')].every(handle=>{
   const r=handle.getBoundingClientRect();return Math.abs(r.y+r.height/2-(core.y+core.height/2))<2;
  });
 })).toBe(true);
 await page.getByLabel('Направление компоновки').selectOption(direction);
 await page.getByRole('checkbox',{name:'Автоматическая компоновка'}).click();await page.getByRole('button',{name:'Включить автокомпоновку',exact:true}).click();
 await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(6);
 const check=async()=>{
  await expect.poll(()=>source.evaluate((el,{side,direction})=>{
   const core=el.querySelector('.screen-core')!.getBoundingClientRect(),note=el.querySelector('[data-testid="note-node"]')!.getBoundingClientRect();
   return ['a','b','c'].flatMap(id=>[true,false].map(out=>{
    const p=document.querySelector(`.react-flow__edge[data-id="${out?'out':'in'}-${id}"] .react-flow__edge-path`) as SVGPathElement|null;
    if(!p)return false;
    const len=p.getTotalLength(),matrix=p.getScreenCTM()!,end=p.getPointAtLength(out?0:len).matrixTransform(matrix);
    const near=p.getPointAtLength(out?Math.min(4,len):Math.max(0,len-4)).matrixTransform(matrix);
    const face=direction==='DOWN'?(out?'bottom':'top'):(out?'right':'left');
    const box=side===face?note:core,vertical=direction==='DOWN';
    const coordinate=face==='bottom'?box.bottom:face==='top'?box.top:face==='right'?box.right:box.left;
    return vertical
     ? Math.abs(end.y-coordinate)<2 && end.x>=box.left-1 && end.x<=box.right+1 && Math.abs(near.x-end.x)<2
     : Math.abs(end.x-coordinate)<2 && end.y>=box.top-1 && end.y<=box.bottom+1 && Math.abs(near.y-end.y)<2;
   })).every(Boolean);
  },{side,direction})).toBe(true);
 };
 await check();
 await page.locator('.screen-list').getByRole('button',{name:'01 s',exact:true}).click();await page.getByRole('switch',{name:'Режим фокуса'}).click();
 // Focus shows both directions; verify all six source/target face endpoints.
 await expect(page.locator('.react-flow__edge-path')).toHaveCount(6);
 await check();
 await expect.poll(()=>source.evaluate((el,{side,direction})=>{
  const face=direction==='DOWN'?'bottom':'right';const box=el.querySelector(side===face?'[data-testid="note-node"]':'.screen-core')!.getBoundingClientRect();
  return [...document.querySelectorAll<SVGPathElement>('.react-flow__edge[data-id^="out-"] .react-flow__edge-path')].every(p=>{
   const q=p.getPointAtLength(0).matrixTransform(p.getScreenCTM()!);
   return direction==='DOWN'?Math.abs(q.y-box.bottom)<2&&q.x>=box.left-1&&q.x<=box.right+1:Math.abs(q.x-box.right)<2&&q.y>=box.top-1&&q.y<=box.bottom+1;
  });
 },{side,direction})).toBe(true);
 await expect(source.getByRole('textbox',{name:'Текст заметки'})).toHaveValue('Preserve this note');
});
