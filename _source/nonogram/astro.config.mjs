import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://h1soft.github.io',
  base: '/nonogram',
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'always' },
  vite: { build: { assetsInlineLimit: 0 } },
});
