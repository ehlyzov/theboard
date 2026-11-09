import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';

async function populatedBoard(page:Page,zoom:number,automatic=false){
 const nodes=[{id:'source',type:'screen',position:{x:8000,y:6000},data:{title:'Source',image:'assets/a.png'}},
  ...Array.from({length:60},(_,i)=>({id:`old-${i}`,type:'note',position:{x:i*300,y:3000},data:{title:'Existing',text:`Existing ${i}`}}))];
 await page.goto('/');const before=page.url();
 await page.getByLabel('Импорт архива').setInputFiles({name:'populated.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({
  'board.json':strToU8(JSON.stringify({version:1,title:'New notes',nodes,edges:[],layout:{automatic,direction:'DOWN'}})),
  'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png'),
 }))});
 await page.waitForURL(url=>url.href!==before,{waitUntil:'load'});
 await expect(page.getByTestId('note-node')).toHaveCount(60);
 await page.evaluate(({zoom})=>{
  const id=new URLSearchParams(location.search).get('board')!;
  localStorage.setItem('theboard:workspace:'+id,JSON.stringify({x:-4500,y:-3200,zoom,focusEnabled:false,currentScreenId:'source'}));
 },{zoom});
 await page.reload();await expect(page.getByTestId('note-node')).toHaveCount(60);
 return nodes;
}

async function exportNodes(page:Page){
 await expect(page.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт архива'}).click();
 const archive=JSON.parse(strFromU8(unzipSync(fs.readFileSync((await(await download).path())!))['board.json']));
 return archive.nodes.map((n:{id:string})=>({...n,position:archive.layout.nodes[n.id]}));
}

for(const zoom of [.15,4])test(`NOTE-04 new notes are visible and ready for typing on a populated panned board at zoom ${zoom}`,async({page})=>{
 const original=await populatedBoard(page,zoom);
 for(let i=0;i<2;i++){
  await page.getByRole('button',{name:'Добавить заметку',exact:true}).click();
  const note=page.getByTestId('note-node').last();
  await expect(page.getByTestId('note-node')).toHaveCount(61+i);
  await expect(note).toHaveClass(/is-selected/);
  await expect(note.getByRole('textbox')).toBeFocused();
  await expect.poll(()=>note.evaluate(el=>{
   const r=el.getBoundingClientRect(),c=document.querySelector('.canvas')!.getBoundingClientRect();
   return r.left>=c.left && r.right<=c.right && r.top>=c.top+100 && r.bottom<=c.bottom-20;
  })).toBe(true);
  await page.keyboard.type('Visible note '+i);
  await expect(note.getByRole('textbox')).toHaveValue('Visible note '+i);
 }
 const saved=await exportNodes(page);
 for(const old of original){const actual=saved.find((n:{id:string})=>n.id===old.id);expect(actual.position).toEqual(old.position);if('text' in old.data)expect(actual.data.text).toEqual(old.data.text);}
 await page.reload();await expect(page.getByTestId('note-node')).toHaveCount(62);
 await expect(page.getByTestId('note-node').last().getByRole('textbox')).toHaveValue('Visible note 1');
});

test('NOTE-04 creating a note exits focus and reveals it after automatic placement',async({page})=>{
 await populatedBoard(page,.47,true);
 await page.locator('.screen-list').getByRole('button',{name:'01 Source',exact:true}).click();
 await page.getByRole('switch',{name:'Режим фокуса'}).click();
 await expect(page.getByRole('switch',{name:'Режим фокуса'})).toBeChecked();
 await expect(page.getByTestId('note-node')).toHaveCount(0);
 await page.getByRole('button',{name:'Добавить заметку',exact:true}).click();
 await expect(page.getByRole('switch',{name:'Режим фокуса'})).not.toBeChecked();
 await expect(page.getByTestId('note-node')).toHaveCount(61);
 const note=page.getByTestId('note-node').last();
 await expect(note).toHaveClass(/is-selected/);await expect(note.getByRole('textbox')).toBeFocused();
 await expect(page.getByText('Расчёт компоновки…',{exact:true})).toHaveCount(0);
 await expect.poll(()=>note.evaluate(el=>{
  const r=el.getBoundingClientRect(),c=document.querySelector('.canvas')!.getBoundingClientRect();
  return r.left>=c.left && r.right<=c.right && r.top>=c.top+100 && r.bottom<=c.bottom-20;
 })).toBe(true);
 await page.keyboard.type('Automatic visible note');
 await expect(note.getByRole('textbox')).toHaveValue('Automatic visible note');
 await expect(page.getByRole('checkbox',{name:'Автоматическая компоновка'})).toBeChecked();
});
