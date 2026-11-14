import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';

for(const direction of ['RIGHT','DOWN']) test(`MASK-15 ${direction} keeps ordinary annotation notes near their source without changing links`,async({page})=>{
  const ids=['a','b','c','d','e','f'];
  const mask=(noteIds:string[])=>[{id:'mask',x:.1,y:.1,width:.2,height:.2,comments:[],noteIds}];
  const board={version:1,title:'Annotation placement',nodes:[
    ...ids.map(id=>({id,type:'screen',data:{title:id.toUpperCase(),image:'assets/a.png',imageSize:{width:180,height:300},
      regions:id==='c'?mask(['n-one','n-shared']):id==='f'?mask(['n-shared']):[]}})),
    ...['n-one','n-shared','docked','legend'].map(id=>({id,type:'note',data:{title:id,text:id==='n-one'?'First note':id==='n-shared'?'Shared note':id}})),
  ],edges:[...ids.slice(1).map((id,i)=>({id:ids[i]+id,source:ids[i],target:id,label:'Continue '+id})),{id:'af',source:'a',target:'f',label:'Jump'},{id:'cf',source:'c',target:'f',label:'Alternative'},{id:'ac',source:'a',target:'c',label:'Direct'}],
    layout:{nodes:Object.fromEntries([...ids,'n-one','n-shared','docked','legend'].map((id,i)=>[id,{x:i*500,y:100}])),docks:{docked:{screenId:'c',side:'bottom'}}}};
  await page.goto('/');
  await page.getByLabel('Импорт архива').setInputFiles({name:'annotations.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({
    'board.json':strToU8(JSON.stringify(board)),'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png'),
  }))});
  await expect(page.getByTestId('screen-node')).toHaveCount(6);
  await page.getByLabel('Направление компоновки').selectOption(direction);
  await page.getByRole('checkbox',{name:'Автоматическая компоновка'}).click();
  await page.getByRole('button',{name:'Включить автокомпоновку',exact:true}).click();
  await expect(page.locator('.react-flow__edge-path[data-routed="true"]')).toHaveCount(board.edges.length);
  await expect(page.getByText('Расчёт компоновки…',{exact:true})).toHaveCount(0);
  const boxes=()=>page.locator('.react-flow__node').evaluateAll(elements=>Object.fromEntries(elements.map(el=>{
    const m=new DOMMatrix(getComputedStyle(el).transform),node=el as HTMLElement;
    return [el.getAttribute('data-id'),{x:m.m41,y:m.m42,width:node.offsetWidth,height:node.offsetHeight}];
  })));
  const distance=(a:any,b:any)=>Math.hypot(Math.max(0,a.x-b.x-b.width,b.x-a.x-a.width),Math.max(0,a.y-b.y-b.height,b.y-a.y-a.height));
  const near=async(source:string,note:string)=>{const b=await boxes();return distance(b[source],b[note]);};
  await expect.poll(()=>near('c','n-one')).toBeLessThan(100);
  await expect.poll(()=>near('n-one','n-shared')).toBeLessThan(100);
  const normal=await boxes();
  for(const id of ['n-one','n-shared']) for(const [other,b] of Object.entries(normal)){
    if(other===id)continue;
    expect(distance(normal[id],b),id+' must not overlap '+other).toBeGreaterThan(0);
  }
  const exported=async()=>{
    const download=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт архива'}).click();
    const raw=JSON.parse(strFromU8(unzipSync(fs.readFileSync((await(await download).path())!))['board.json']));
    for(const p of Object.values(raw.layout.nodes) as {x:number;y:number}[]){p.x=Math.round(p.x*1000)/1000;p.y=Math.round(p.y*1000)/1000;}
    return raw;
  };
  const before=await exported();
  expect(before.edges).toEqual(board.edges);
  expect(before.layout.docks).toEqual(board.layout.docks);
  const start=before.layout.edges.cd.points[0],c=normal.c;
  if(direction==='RIGHT')expect(Math.abs(start.x-c.x-c.width)).toBeLessThan(1);
  else {
    // DOCK-08: the exposed bottom note face, excluding the group's transparent border.
    const bottom=await page.locator('[data-testid="screen-node"][data-board-node-id="c"]').evaluate(el=>{
      const group=el.getBoundingClientRect(),note=el.querySelector('.docked-bottom .note-card:last-child')!.getBoundingClientRect();
      return (note.bottom-group.top)/(group.width/(el as HTMLElement).offsetWidth);
    });
    expect(Math.abs(start.y-c.y-bottom)).toBeLessThan(1);
  }
  await page.locator('.screen-list').getByRole('button',{name:'03 C',exact:true}).click();
  await page.getByRole('switch',{name:'Режим фокуса'}).click();
  await expect.poll(()=>page.getByTestId('screen-node').evaluateAll(elements=>elements.map(el=>el.getAttribute('data-board-node-id')).sort())).toEqual(['a','b','c','d','f']);
  await expect.poll(()=>page.locator('.react-flow__edge').evaluateAll(elements=>elements.map(el=>el.getAttribute('data-id')).sort())).toEqual(['ac','bc','cd','cf']);
  await expect.poll(()=>near('c','n-one')).toBeLessThan(100);
  expect((await exported()).layout).toEqual(before.layout);
  await page.getByRole('switch',{name:'Режим фокуса'}).click();
  // An existing note gains a new, lower-ID primary source. No new note/edge is created.
  await page.locator('.screen-list').getByRole('button',{name:'02 B',exact:true}).click();
  await page.waitForTimeout(300);
  const b=page.locator('[data-testid="screen-node"][data-board-node-id="b"]');
  await b.getByRole('button',{name:'Кисть выделения',exact:true}).click();
  const image=await b.getByTestId('annotation-image').boundingBox();
  await page.mouse.move(image!.x+image!.width*.3,image!.y+image!.height*.4);await page.mouse.down();
  await page.mouse.move(image!.x+image!.width*.6,image!.y+image!.height*.6,{steps:5});await page.mouse.up();
  await page.keyboard.press('Enter');
  await page.getByLabel('Заметка для области').selectOption({label:'First note'});
  await page.getByRole('button',{name:'Связать с заметкой',exact:true}).click();
  await expect.poll(()=>near('b','n-one')).toBeLessThan(100);
  const after=await exported();
  expect(after.edges).toEqual(board.edges);
  expect(after.nodes).toHaveLength(board.nodes.length);
  expect(after.nodes.find((n:any)=>n.id==='b').data.regions[0].noteIds).toEqual(['n-one']);
  expect(after.nodes.find((n:any)=>n.id==='c').data.regions[0].noteIds).toEqual(['n-one','n-shared']);
  expect(after.nodes.find((n:any)=>n.id==='f').data.regions[0].noteIds).toEqual(['n-shared']);
});
