import { copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const portalHtml = path.join(dist, 'portal.html');

await stat(portalHtml);
await copyFile(portalHtml, path.join(dist, 'index.html'));
