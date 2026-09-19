import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.argv[2]) throw new Error('Pass the H1Soft hosting repository directory.');
const repo = path.resolve(process.argv[2]);
await fs.access(path.join(repo, '.git'));
await fs.access(path.join(repo, 'index.html'));
await fs.access(path.join(source, 'dist', 'index.html'));
const target = path.join(repo, 'nonogram');
await fs.mkdir(target, { recursive: true });
await fs.cp(path.join(source, 'dist'), target, { recursive: true, force: true });
await fs.writeFile(path.join(repo, '.nojekyll'), '');
console.log(
  `Exported the generated Nonogram website to ${target}. Review and commit the hosting repository diff.`,
);
