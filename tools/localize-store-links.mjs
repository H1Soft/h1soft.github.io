// Run after static page generation. --check audits without writing.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { localizeStoreUrl } from '../js/store-links.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');
const ignored = new Set(['.git', '_source', 'node_modules', 'metrics']);
const report = { pagesScanned: 0, storeLinks: 0, pagesChanged: [], languages: new Set(), appleFallbacks: [] };

async function visit(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { await visit(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = await fs.readFile(file, 'utf8');
    const lang = html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1];
    if (!lang) continue;
    report.pagesScanned++;
    const result = html.replace(/(<a\b[^>]*\bhref=)(["'])(https:\/\/(?:apps\.apple\.com|itunes\.apple\.com|play\.google\.com)\/[^"']*)\2/gi, (_, prefix, quote, href) => {
      const decoded = href.replaceAll('&amp;', '&');
      const localized = localizeStoreUrl(decoded, lang);
      report.storeLinks++;
      report.languages.add(lang);
      if (lang === 'fa' && new URL(decoded).hostname.endsWith('apple.com')) {
        report.appleFallbacks.push(path.relative(root, file));
      }
      // Retain the existing serialization when the URL is already correct.
      return prefix + quote + (decoded === localized ? href : localized.replaceAll('&', '&amp;')) + quote;
    });
    if (result !== html) {
      report.pagesChanged.push(path.relative(root, file));
      if (!check) await fs.writeFile(file, result);
    }
  }
}
await visit(root);
console.log(JSON.stringify({ ...report, languages: [...report.languages].sort() }, null, 2));
if (check && report.pagesChanged.length) process.exitCode = 1;
