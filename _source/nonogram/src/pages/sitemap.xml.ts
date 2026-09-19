import { origin, page } from '../data/site';
export function GET() {
  const entries = (['en', 'ko'] as const).flatMap((lang) =>
    ['', 'privacy', 'terms', 'support'].map(
      (slug) =>
        `<url><loc>${origin + page(lang, slug)}</loc><xhtml:link rel="alternate" hreflang="en" href="${origin + page('en', slug)}"/><xhtml:link rel="alternate" hreflang="ko" href="${origin + page('ko', slug)}"/><xhtml:link rel="alternate" hreflang="x-default" href="${origin + page('en', slug)}"/></url>`,
    ),
  );
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${entries.join('')}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
