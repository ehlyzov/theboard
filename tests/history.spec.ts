import { test, expect } from "@playwright/test";
import { zipSync, strToU8, unzipSync, strFromU8 } from "fflate";
import fs from "node:fs";
test('ARCH-05 replacement clears old region Undo even when screen IDs are reused',async({page})=>{
 const screen={id:'s',type:'screen',position:{x:70,y:100},data:{title:'Screen',image:'assets/a.png',regions:[{id:'old-mask',x:0,y:0,width:1,height:1,comments:[],noteIds:[],strokes:[{radius:.1,points:[{x:.2,y:.2}]}]}]}};
 const pack=(node:unknown)=>({name:'board.zip',mimeType:'application/zip',buffer:Buffer.from(zipSync({'board.json':strToU8(JSON.stringify({version:1,title:'Board',nodes:[node],edges:[]})),'assets/a.png':fs.readFileSync('tests/fixtures/Вход.png')}))});
 await page.goto('/');await page.getByLabel('Импорт архива').setInputFiles(pack(screen));
 await page.getByRole('button',{name:'Область 1',exact:true}).press('Enter');
 await page.getByRole('button',{name:'Удалить выбранную область'}).click();
 await expect(page.getByRole('button',{name:'Отменить удаление области'})).toBeVisible();
 await page.getByLabel('Заменить текущую доску из архива').setInputFiles(pack({...screen,data:{...screen.data,regions:[]}}));
 await expect(page.getByRole('button',{name:'Отменить удаление области'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Область 1',exact:true})).toHaveCount(0);
});
test("MASK-10 stale note deletion followed by mask Undo keeps portable references valid", async ({
  page,
}) => {
  const board = {
    version: 1,
    title: "History",
    nodes: [
      {
        id: "s",
        type: "screen",
        position: { x: 70, y: 100 },
        data: {
          title: "Screen",
          image: "assets/a.png",
          regions: [
            {
              id: "r",
              x: 0,
              y: 0,
              width: 1,
              height: 1,
              comments: [],
              noteIds: ["n"],
              strokes: [
                {
                  radius: 0.1,
                  points: [
                    { x: 0.2, y: 0.2 },
                    { x: 0.7, y: 0.6 },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: "n",
        type: "note",
        position: { x: 500, y: 100 },
        data: { title: "Note", text: "Keep history" },
      },
    ],
    edges: [],
  };
  await page.goto("/");
  await page
    .getByLabel("Импорт архива")
    .setInputFiles({
      name: "history.zip",
      mimeType: "application/zip",
      buffer: Buffer.from(
        zipSync({
          "board.json": strToU8(JSON.stringify(board)),
          "assets/a.png": fs.readFileSync("tests/fixtures/Вход.png"),
        }),
      ),
    });
  await page
    .getByRole("button", { name: "Область 1", exact: true })
    .press("Enter");
  await page.getByRole("button", { name: "Удалить выбранную область" }).click();
  await page.getByRole("button", { name: "Удалить заметку" }).click();
  await page.getByRole("button", { name: "Отменить удаление области" }).click();
  const promise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Экспорт архива" }).click();
  const archive = await (await promise).path();
  const data = JSON.parse(
    strFromU8(unzipSync(fs.readFileSync(archive!))["board.json"]),
  );
  expect(data.nodes[0].data.regions[0].noteIds).toEqual([]);
  await page.getByLabel("Импорт архива").setInputFiles(archive!);
  await expect(page.getByTestId("screen-node")).toHaveCount(1);
});
