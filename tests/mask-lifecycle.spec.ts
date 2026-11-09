import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
const region=(id:string,noteIds:string[])=>({id,x:.1,y:.1,width:.3,height:.3,comments:[],noteIds});
const fixture=()=>({version:1,title:'Note-owned masks',nodes:[
  {id:'s',type:'screen',position:{x:70,y:100},data:{title:'Source',image:'assets/a.png',regions:[region('single',['n1']),region('shared',['n1','n2'])]}},
  {id:'s2',type:'screen',position:{x:1100,y:100},data:{title:'Second',image:'assets/a.png',regions:[region('other',['n1'])]}},
  ...['n1','n2','n3'].map((id,i)=>({id,type:'note',position:{x:550,y:100+i*230},data:{title:id,text:'Note '+id,color:'mint',status:id==='n2'?'done':'open'}})),
],edges:[]});
const pack=(board:any)=>({name:'masks.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'board.json':strToU8(JSON.stringify(board)),'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png')}))});
async function exported(page:any){const p=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт архива'}).click();return JSON.parse(strFromU8(unzipSync(fs.readFileSync((await(await p).path())!))['board.json']));}
for(const method of ['trash','keyboard'])test(`MASK-16/17 ${method} removes only orphan masks and keeps surviving completed notes`,async({page})=>{
 await page.goto('/');await page.getByLabel('Импорт архива').setInputFiles(pack(fixture()));
 const source=page.locator('[data-testid="screen-node"][data-board-node-id="s"]');
 await source.getByRole('button',{name:'Область 1',exact:true}).press('Enter');
 await expect(page.getByRole('button',{name:'Удалить выбранную область'})).toHaveCount(0);
 const remove=async(id:string)=>{const note=page.locator(`[data-testid="note-node"][data-board-node-id="${id}"]`);if(method==='trash')await note.getByRole('button',{name:'Удалить заметку'}).click();else{await note.locator('.node-grip').click();await page.keyboard.press('Delete');}};
 await remove('n1');
 await expect(source.getByRole('button',{name:'Область 1',exact:true})).toHaveCount(1);
 let data=await exported(page);
 expect(data.nodes.find((n:any)=>n.id==='s').data.regions).toEqual([region('shared',['n2'])]);
 expect(data.nodes.find((n:any)=>n.id==='s2').data.regions).toEqual([]);
 expect(data.nodes.find((n:any)=>n.id==='n2').data).toMatchObject({text:'Note n2',color:'mint',status:'done'});
 await remove('n2');
 await expect(source.getByRole('button',{name:/Область/})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Добавить связь с заметкой'})).toHaveCount(0);
 data=await exported(page);
 expect(data.nodes.filter((n:any)=>n.type==='screen').every((n:any)=>!n.data.regions.length)).toBe(true);
 expect(data.nodes.filter((n:any)=>n.type==='note').map((n:any)=>n.id)).toEqual(['n3']);
 const roundtrip=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт архива'}).click();
 const previousUrl=page.url();
 await page.getByLabel('Импорт архива').setInputFiles((await(await roundtrip).path())!);
 await page.waitForURL(url=>url.href!==previousUrl,{waitUntil:'load'});
 await expect(page.getByTestId('screen-node')).toHaveCount(2);
 await expect(page.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible();await page.reload();
 expect((await exported(page)).nodes.filter((n:any)=>n.type==='screen').every((n:any)=>!n.data.regions.length)).toBe(true);
});
test('MASK-18 empty imports are cleaned after legacy comments become notes; bad references still reject',async({page})=>{
 const board:any=fixture();board.nodes[0].data.regions=[region('orphan',[]),{...region('legacy',[]),comments:[{id:'comment',text:'Preserve history',status:'done',createdAt:'2026-11-09T10:00:00.000Z',resolvedAt:'2026-11-09T11:00:00.000Z'}]}];
 await page.goto('/');await page.getByLabel('Импорт архива').setInputFiles(pack(board));
 await expect(page.getByTestId('note-node')).toHaveCount(4);
 const result=await exported(page),source=result.nodes.find((n:any)=>n.id==='s');
 expect(source.data.regions).toHaveLength(1);expect(source.data.regions[0].id).toBe('legacy');
 const note=result.nodes.find((n:any)=>n.id===source.data.regions[0].noteIds[0]);
 expect(note.data).toMatchObject({text:'Preserve history',status:'done',createdAt:'2026-11-09T10:00:00.000Z',resolvedAt:'2026-11-09T11:00:00.000Z'});
 const url=page.url();board.nodes[0].data.regions=[region('bad',['missing'])];
 await page.getByLabel('Импорт архива').setInputFiles(pack(board));await expect(page.getByRole('alert')).toBeVisible();expect(page.url()).toBe(url);
 expect((await exported(page)).nodes).toEqual(result.nodes);
});
test('MASK-16 stale note choice cannot commit a draft after the note is deleted',async({page})=>{
 const board:any=fixture();board.nodes[0].data.regions=[];board.nodes[1].data.regions=[];
 await page.goto('/');await page.getByLabel('Импорт архива').setInputFiles(pack(board));
 const source=page.locator('[data-testid="screen-node"][data-board-node-id="s"]');
 await source.getByRole('button',{name:'Кисть выделения'}).click();const b=await source.getByTestId('annotation-image').boundingBox();
 await page.mouse.move(b!.x+b!.width*.2,b!.y+b!.height*.2);await page.mouse.down();await page.mouse.move(b!.x+b!.width*.5,b!.y+b!.height*.5);await page.mouse.up();await page.keyboard.press('Enter');
 await page.getByLabel('Заметка для области').selectOption('n1');
 await page.locator('[data-testid="note-node"][data-board-node-id="n1"]').getByRole('button',{name:'Удалить заметку'}).click();
 await expect(page.getByRole('button',{name:'Связать с заметкой',exact:true})).toBeDisabled();
 expect((await exported(page)).nodes.find((n:any)=>n.id==='s').data.regions).toEqual([]);
 await page.getByRole('button',{name:'Отменить выбор заметки'}).click();await expect(page.getByTestId('pending-region-preview')).toHaveCount(0);
});
test('MASK-18 local legacy boards clean empty/stale masks and retain migrated history',async({page})=>{
 const board:any=fixture();board.nodes[0].data.regions=[region('empty',[]),region('stale',['missing']),region('valid',['n2','missing']),{...region('legacy',[]),comments:[{id:'old',text:'Local history',status:'done',createdAt:'2026-11-09T10:00:00.000Z'}]}];
 for(const n of board.nodes.filter((n:any)=>n.type==='screen'))n.data.image='data:image/png;base64,'+fs.readFileSync('tests/fixtures/Вход.png').toString('base64');
 await page.goto('/');await expect(page.getByRole('status').filter({hasText:'Сохранено'})).toBeVisible();
 await page.evaluate(async board=>{await new Promise<void>((resolve,reject)=>{const request=indexedDB.open('theboard',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('boards','readwrite');tx.objectStore('boards').put(board,'local-mask-legacy');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};request.onerror=()=>reject(request.error);});},board);
 await page.goto('/?board=local-mask-legacy');await expect(page.getByTestId('note-node')).toHaveCount(4);
 const data=await exported(page),source=data.nodes.find((n:any)=>n.id==='s');
 expect(source.data.regions.map((r:any)=>r.id)).toEqual(['valid','legacy']);
 expect(source.data.regions[0].noteIds).toEqual(['n2']);
 expect(data.nodes.find((n:any)=>n.id===source.data.regions[1].noteIds[0]).data).toMatchObject({text:'Local history',status:'done',createdAt:'2026-11-09T10:00:00.000Z'});
});
test('MASK-16 composing an extra linked note after another owner is deleted never resurrects its ID',async({page})=>{
 await page.goto('/');await page.getByLabel('Импорт архива').setInputFiles(pack(fixture()));
 const source=page.locator('[data-testid="screen-node"][data-board-node-id="s"]');
 await source.getByRole('button',{name:'Область 2',exact:true}).press('Enter');
 await page.getByRole('button',{name:'Добавить связь с заметкой'}).click();
 await page.getByLabel('Текст новой заметки').fill('New surviving association');
 await page.locator('[data-testid="note-node"][data-board-node-id="n1"]').getByRole('button',{name:'Удалить заметку'}).click();
 await page.getByRole('button',{name:'Создать и связать',exact:true}).click();
 await page.getByRole('button',{name:'Экспорт архива'}).click();
 await expect(page.getByRole('alert')).toHaveCount(0);
 const data=await exported(page),mask=data.nodes.find((n:any)=>n.id==='s').data.regions[0];
 expect(mask.id).toBe('shared');expect(mask.noteIds).toHaveLength(2);expect(mask.noteIds).toContain('n2');expect(mask.noteIds).not.toContain('n1');
 expect(data.nodes.find((n:any)=>n.id===mask.noteIds.find((id:string)=>id!=='n2')).data.text).toBe('New surviving association');
});
