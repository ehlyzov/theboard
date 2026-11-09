import {test,expect} from '@playwright/test';
import fs from 'node:fs';
import {unzipSync,strFromU8} from 'fflate';

const sides={left:'слева',right:'справа',top:'сверху',bottom:'снизу'};
async function exported(page:any){
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'Экспорт архива'}).click();
  return JSON.parse(strFromU8(unzipSync(fs.readFileSync((await(await download).path())!))['board.json']));
}
async function setup(page:any){
  await page.goto('/?board=magnet-test');
  await page.getByLabel('Загрузить скриншоты').setInputFiles('tests/fixtures/Вход.png');
  await page.getByRole('button',{name:'Добавить заметку',exact:true}).click();
  await page.getByLabel('Текст заметки',{exact:true}).fill('Magnetic note');
}
for(const [side,label] of Object.entries(sides))test(`DOCK-02 drag magnet to ${side} preserves canonical positions`,async({page})=>{
  await setup(page);
  const before=await exported(page);
  const magnet=page.getByRole('button',{name:'Приклеить заметку',exact:true});
  const m=await magnet.boundingBox();
  await page.mouse.move(m!.x+m!.width/2,m!.y+m!.height/2);
  await page.mouse.down();
  const target=page.getByRole('button',{name:`Приклеить ${label} к экрану Вход`,exact:true});
  await expect(target).toBeVisible();
  const t=await target.boundingBox();
  await page.mouse.move(t!.x+t!.width/2,t!.y+t!.height/2,{steps:12});
  await expect(target).toHaveClass(/is-active/);
  await page.mouse.up();
  await expect(page.getByTestId('note-node')).toHaveClass(/is-docked/);
  await expect(page.locator('[data-dock-side]')).toHaveCount(0);
  const after=await exported(page),note=after.nodes.find((n:any)=>n.type==='note');
  expect(after.layout.docks[note.id]).toEqual({screenId:before.nodes.find((n:any)=>n.type==='screen').id,side});
  expect(after.nodes.map((n:any)=>[n.id,n.position])).toEqual(before.nodes.map((n:any)=>[n.id,n.position]));
  expect(after.edges).toEqual(before.edges);
});
test('DOCK-03 keyboard/click targets, Escape, invalid drop and detach preserve data',async({page})=>{
  await setup(page);
  const before=await exported(page);
  const magnet=page.getByRole('button',{name:'Приклеить заметку',exact:true});
  await magnet.click();
  await expect(magnet).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('[data-dock-side]')).toHaveCount(4);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-dock-side]')).toHaveCount(0);
  const m=await magnet.boundingBox();
  await page.mouse.move(m!.x+m!.width/2,m!.y+m!.height/2);
  await page.mouse.down();await page.mouse.move(1000,750,{steps:8});await page.mouse.up();
  await expect(page.locator('[data-dock-side]')).toHaveCount(0);
  const cancelled=await exported(page);
  expect(cancelled.nodes).toEqual(before.nodes);
  expect(cancelled.layout.docks).toEqual(before.layout.docks);
  await magnet.press('Enter');
  await page.getByRole('button',{name:'Приклеить сверху к экрану Вход',exact:true}).press('Enter');
  await expect(page.getByTestId('note-node')).toHaveClass(/is-docked/);
  await page.getByRole('button',{name:'Размагнитить заметку',exact:true}).click();
  await expect(page.getByTestId('note-node')).not.toHaveClass(/is-docked/);
  await expect(page.getByLabel('Текст заметки',{exact:true})).toHaveValue('Magnetic note');
  await magnet.click();
  await page.getByRole('button',{name:'Приклеить снизу к экрану Вход',exact:true}).click();
  await expect(page.getByTestId('note-node')).toHaveClass(/is-docked/);
});
