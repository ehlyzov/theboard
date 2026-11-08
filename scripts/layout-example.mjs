// Generate a local, read-only layout experiment. Never writes the source board.
// node scripts/layout-example.mjs INPUT_DIR NEW_OUTPUT_DIR ELK_BUNDLED_JS DOCKS_JSON
import { readFile, writeFile, mkdir, copyFile, realpath } from 'node:fs/promises';
import { resolve, dirname, relative, sep, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const [inputArg, outputArg, engineArg, docksArg] = process.argv.slice(2);
assert.ok(inputArg && outputArg && engineArg && docksArg,
  'Usage: node scripts/layout-example.mjs INPUT_DIR NEW_OUTPUT_DIR ELK_BUNDLED_JS DOCKS_JSON');
const input = await realpath(inputArg), output = resolve(outputArg);
const outputRelative = relative(input,output);
assert.ok(outputRelative && (outputRelative.startsWith('..'+sep) || isAbsolute(outputRelative)),
  'Output must be outside the source folder');
const board = JSON.parse(await readFile(resolve(input,'board.json'),'utf8'));
const docks = JSON.parse(await readFile(docksArg,'utf8'));
assert.ok(board.version===1 && Array.isArray(board.nodes) && Array.isArray(board.edges));
const ids = new Map(board.nodes.map(n => [n.id,n]));
assert.equal(ids.size,board.nodes.length,'Duplicate node IDs');
assert.equal(new Set(board.edges.map(e => e.id)).size,board.edges.length,'Duplicate edge IDs');
assert.ok(board.nodes.every(n => ['screen','note'].includes(n.type)), 'Unsupported node type');
for (const e of board.edges) assert.ok(ids.get(e.source)?.type==='screen' && ids.get(e.target)?.type==='screen');
for (const [id,d] of Object.entries(docks)) {
  assert.ok(ids.get(id)?.type==='note' && ids.get(d.screenId)?.type==='screen');
  assert.equal(d.side,'bottom','The example currently supports bottom docking only');
}
const assets = [];
for (const n of board.nodes.filter(n => n.type==='screen')) {
  const path = n.data.image;
  assert.ok(typeof path==='string' && /^assets\/.+\.(png|jpe?g|webp)$/i.test(path) &&
    !path.includes('\\') && !path.split('/').includes('..'), 'Unsafe image path');
  const source = await realpath(resolve(input,path));
  assert.ok(!relative(input,source).startsWith('..'+sep), 'Asset outside source folder');
  assets.push([source,path]);
}
const engine = resolve(engineArg);
const pkg = JSON.parse(await readFile(resolve(dirname(engine),'../package.json'),'utf8'));
assert.equal(pkg.name,'elkjs');
const template = fileURLToPath(new URL('./layout-example/',import.meta.url));
const html = (await readFile(resolve(template,'index.html'),'utf8'))
  .replace('<!--BOARD_DATA-->',JSON.stringify({board,docks,engineVersion:pkg.version}).replaceAll('<','\\u003c'));
await mkdir(output); // Refuse to overwrite an existing example.
for (const [source,path] of assets) {
  await mkdir(dirname(resolve(output,path)),{recursive:true});
  await copyFile(source,resolve(output,path));
}
await Promise.all([
  writeFile(resolve(output,'index.html'),html),
  writeFile(resolve(output,'source-board.json'),JSON.stringify(board,null,2)),
  copyFile(engine,resolve(output,'elk.bundled.js')),
  copyFile(resolve(dirname(engine),'../LICENSE.md'),resolve(output,'ELK-LICENSE.md')),
  ...['runtime.js','style.css'].map(name => copyFile(resolve(template,name),resolve(output,name))),
]);
console.log(JSON.stringify({output,nodes:board.nodes.length,edges:board.edges.length,
  docks:Object.keys(docks).length,engine:pkg.version}));
