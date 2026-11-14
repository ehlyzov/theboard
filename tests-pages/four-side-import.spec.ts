import {test,expect,type Page} from '@playwright/test';
import fs from 'node:fs';
import {zipSync,strToU8,unzipSync,strFromU8} from 'fflate';
async function fixture(page:Page){
 const board={version:1,title:'Vertical connections',nodes:['a','b'].map((id,i)=>({id,type:'screen',position:{x:100,y:100+i*440},data:{title:id,image:'assets/a.png'}})),edges:[]};
 await page.goto('./');const before=page.url();await page.getByLabel('Импорт архива',{exact:true}).setInputFiles({name:'vertical.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'board.json':strToU8(JSON.stringify(board)),'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png')}))});
 await page.waitForURL(u=>u.href!==before);await expect(page.getByTestId('screen-node')).toHaveCount(2);await page.getByRole('button',{name:'Показать всю доску',exact:true}).click();
 let last='';await expect.poll(async()=>{const now=JSON.stringify(await page.getByTestId('screen-node').first().boundingBox());const stable=now===last;last=now;return stable;}).toBe(true);
}
test('SIDE-02/03 click, keyboard and endpoint archive persistence',async({page})=>{
 await fixture(page);await page.locator('[data-board-node-id="a"]').getByRole('button',{name:'Соединить снизу',exact:true}).press('Enter');await page.locator('[data-board-node-id="b"]').getByRole('button',{name:'Соединить сверху',exact:true}).click();
 await expect(page.locator('.react-flow__edge-path')).toHaveCount(1);await page.reload();await expect(page.locator('.react-flow__edge-path')).toHaveCount(1);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт архива',exact:true}).click();const file=await download;const bytes=fs.readFileSync((await file.path())!);const doc=JSON.parse(strFromU8(unzipSync(bytes)['board.json']));expect(doc.edges[0]).toMatchObject({source:'a',target:'b',sourceHandle:'bottom',targetHandle:'top'});
 const before=page.url();await page.getByLabel('Импорт архива',{exact:true}).setInputFiles({name:'roundtrip.zip',mimeType:'application/zip',buffer:bytes});await page.waitForURL(u=>u.href!==before);await expect(page.locator('.react-flow__edge-path')).toHaveCount(1);
});
