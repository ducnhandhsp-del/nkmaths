import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'docs', 'gas', 'LOP_TOAN_NK_GAS_2026_2027_FULL.gs');
const outDir = path.join(root, 'apps-script');
const outPath = path.join(outDir, 'Code.gs');

const requiredEntryPoints = ['function doGet', 'function doPost', 'function getData'];

const source = await readFile(sourcePath, 'utf8');
if (!source.trim()) {
  throw new Error(`GAS source is empty: ${sourcePath}`);
}

for (const marker of requiredEntryPoints) {
  if (!source.includes(marker)) {
    throw new Error(`GAS source is missing required entry point marker: ${marker}`);
  }
}

const header = [
  '// Generated from docs/gas/LOP_TOAN_NK_GAS_2026_2027_FULL.gs.',
  '// Do not edit this generated bundle directly until apps-script/ is promoted to the source of truth.',
  '',
].join('\n');

await mkdir(outDir, { recursive: true });
await writeFile(outPath, header + source.replace(/^\uFEFF/, ''), 'utf8');

console.log(`Prepared Apps Script bundle: ${path.relative(root, outPath)}`);
