// src/utils/sitemapGenerator.ts
import type { Shop } from '../types';

/**
 * Generate XML sitemap for all farm stands
 */
export function generateSitemap(shops: Shop[]): string {
  const baseUrl = 'https://phind.us'; // Update with your actual domain
  const today = new Date().toISOString().split('T')[0];

  const urls = [
    // Homepage
    {
      loc: baseUrl,
      lastmod: today,
      changefreq: 'daily',
      priority: '1.0',
    },
    // Individual farm pages
    ...shops.map(shop => ({
      loc: `${baseUrl}/farm/${shop.slug || shop.GoogleProfileID}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: '0.8',
    })),
  ];

  const urlEntries = urls
    .map(
      url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Download sitemap as XML file
 */
export function downloadSitemap(shops: Shop[]): void {
  const sitemapXml = generateSitemap(shops);
  const blob = new Blob([sitemapXml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sitemap.xml';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
