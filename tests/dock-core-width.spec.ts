import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {zipSync,strToU8} from 'fflate';
for(const image of ['Вход','landscape'])test(`DOCK-06 ${image} top/bottom notes exclude side notes in manual, automatic and focus geometry`,async({page})=>{
 const sides=['left','right','top','bottom'];
 const board={version:1,title:'Core width',nodes:[{id:'s',type:'screen',position:{x:70,y:100},data:{title:'Source',image:'assets/a.png'}},...sides.map((side,i)=>({id:side,type:'note',position:{x:600,y:i*200},data:{title:side,text:'A note with enough text to wrap across the screen core. '.repeat(3),color:'mint'}}))],edges:[],layout:{docks:Object.fromEntries(sides.map(side=>[side,{screenId:'s',side}]))}};
 await page.goto('/');await page.getByLabel('Импорт архива').setInputFiles({name:'core.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'board.json':strToU8(JSON.stringify(board)),'assets/a.png':fs.readFileSync(`tests/fixtures/${image}.png`)}))});
 const source=page.getByTestId('screen-node');await expect(source).toHaveCount(1);
 const check=async()=>{
  // Read all bounds in one frame: focus fit animates the viewport transform.
  await expect.poll(()=>source.evaluate(el=>{
   const core=el.querySelector('.screen-core')!.getBoundingClientRect();
   return ['top','bottom','left','right'].every(side=>{
    const note=el.querySelector(`[data-testid="note-node"][data-board-node-id="${side}"]`)!.getBoundingClientRect();
    return side==='top'||side==='bottom'
      ? Math.abs(note.width-core.width)<2 && Math.abs(note.x-core.x)<2
      : Math.abs(note.height-core.height)<2;
   });
  })).toBe(true);
  await expect(page.getByTestId('note-node')).toHaveCount(4);
 };
 await check();
 await page.getByRole('checkbox',{name:'Автоматическая компоновка'}).click();await page.getByRole('button',{name:'Включить автокомпоновку',exact:true}).click();
 await expect(page.getByText('Расчёт компоновки…',{exact:true})).toHaveCount(0);await check();
 await page.locator('.screen-list').getByRole('button',{name:'01 Source',exact:true}).click();await page.getByRole('switch',{name:'Режим фокуса'}).click();await check();
});
