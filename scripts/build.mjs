import { mkdir, cp, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const dest = resolve(root, 'dist');
await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
for (const name of ['index.html','src','public']) await cp(resolve(root,name), resolve(dest,name), {recursive:true});
await writeFile(resolve(dest,'.nojekyll'), '');
console.log('Built static game → dist');
