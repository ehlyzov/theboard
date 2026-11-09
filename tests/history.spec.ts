import {test,expect} from '@playwright/test';
import {zipSync,strToU8,unzipSync,strFromU8} from 'fflate';
import fs from 'node:fs';

test('ARCH-05/MASK-17 replacement clears old mask selection/composition when screen IDs are reused',async({page})=>{
 const screen={id:'s',type:'screen',position:{x:70,y:100},data:{title:'Screen',image:'assets/a.png',regions:[{id:'old-mask',x:0,y:0,width:1,height:1,comments:[],noteIds:['n']}]}};
 const note={id:'n',type:'note',position:{x:550,y:100},data:{title:'Note',text:'Old note'}};
 const pack=(node:unknown,text:string)=>({name:'board.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'board.json':strToU8(JSON.stringify({version:1,title:'Board',nodes:[node,{...note,data:{...note.data,text}}],edges:[]})),'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png')}))});
 await page.goto('/');await page.getByLabel('Импорт архива').setInputFiles(pack(screen,'Old note'));
 await page.getByRole('button',{name:'Область 1',exact:true}).press('Enter');
 await page.getByRole('button',{name:'Добавить связь с заметкой'}).click();await page.getByLabel('Текст новой заметки').fill('Uncommitted old note');
 await page.getByLabel('Заменить текущую доску из архива').setInputFiles(pack({...screen,data:{...screen.data,regions:[]}},'Replacement note'));
 await expect(page.getByLabel('Текст новой заметки')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Область 1',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Отменить удаление области'})).toHaveCount(0);
 await expect(page.getByLabel('Текст заметки',{exact:true})).toHaveValue('Replacement note');
 await expect(page.getByRole('link',{name:'Резервная копия доски'})).toBeVisible();
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Экспорт архива'}).click();
 const data=JSON.parse(strFromU8(unzipSync(fs.readFileSync((await(await pending).path())!))['board.json']));
 expect(data.nodes.find((n:any)=>n.id==='s').data.regions).toEqual([]);expect(data.nodes).toHaveLength(2);
});
