// Package canonical project and installed production dependency notices.
import {readFile,writeFile,readdir,stat,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';

const destination=resolve(process.argv[2]??'dist');
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
const blocks=[await readFile('THIRD_PARTY_NOTICES.md','utf8')];
for(const [folder,entry]of Object.entries(lock.packages)){
  if(!folder||entry.dev)continue;
  const pkg=JSON.parse(await readFile(join(folder,'package.json'),'utf8'));
  const names=(await readdir(folder)).filter(name=>/^(licen[cs]e|copying|notice)(\.|$)/i.test(name)).sort();
  const files=[];
  for(const name of names)if((await stat(join(folder,name))).isFile())files.push(name);
  if(!files.length)throw new Error('Missing dependency license: '+pkg.name);
  blocks.push(`\n===== ${pkg.name}@${pkg.version} (${pkg.license??'see license text'}) =====\n`);
  for(const name of files)blocks.push(name+'\n'+await readFile(join(folder,name),'utf8'));
}
await Promise.all([
  copyFile('LICENSE',join(destination,'LICENSE.txt')),
  copyFile('NOTICE',join(destination,'NOTICE.txt')),
  writeFile(join(destination,'THIRD_PARTY_NOTICES.txt'),blocks.join('\n')),
]);
console.log('Packaged project license and production dependency notices.');
