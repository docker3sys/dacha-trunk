import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'android/app/src/main/assets/game');
const exists = async (path) => { try { await stat(path); return true; } catch { return false; } };
if (!await exists(join(root, 'dist/index.html'))) throw new Error('No built web game found. Run npm run build before syncing Android.');
await mkdir(output, { recursive: true });
// This exact generated asset directory is the only directory cleared by this script.
for (const name of await readdir(output)) await rm(join(output, name), { recursive: true, force: true });
await cp(join(root, 'dist'), output, { recursive: true });
console.log(`Android web assets synced from dist to ${output}`);
