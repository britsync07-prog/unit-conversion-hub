import fs from 'fs';
import path from 'path';
import { categories } from '../src/data/categories.js';
import { conversionPairs } from '../src/data/conversions.js';
import { withSiteUrl } from '../src/lib/url.js';

/**
 * Canonical origin for this build. Set `SITE_URL` in CI to deploy to a custom
 * domain; otherwise use the live Cloudflare Pages URL.
 */
const SITE_URL = (process.env.SITE_URL || 'https://unitconversionhub.pages.dev').replace(/\/+$/, '');

interface RouteEntry {
  url: string;
  priority: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

function generateSitemap() {
  const staticRoutes: RouteEntry[] = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/popular', priority: '0.8', changefreq: 'weekly' },
    { url: '/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/contact', priority: '0.5', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/cookie-policy', priority: '0.3', changefreq: 'yearly' },
  ];

  const categoryRoutes: RouteEntry[] = categories.map((c) => ({
    url: `/${c.slug}`,
    priority: '0.9',
    changefreq: 'weekly',
  }));

  const pairRoutes: RouteEntry[] = conversionPairs.map((p) => ({
    url: `/convert/${p.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const allRoutes = [...staticRoutes, ...categoryRoutes, ...pairRoutes];
  const currentDate = new Date().toISOString().split('T')[0];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
  .map(
    (r) => `  <url>
    <loc>${withSiteUrl(SITE_URL, r.url)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  const distDir = path.resolve(process.cwd(), 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const sitemapPath = path.join(distDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
  console.log(`[SEO] Successfully generated sitemap.xml with ${allRoutes.length} URLs at ${sitemapPath}`);

  const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

  const robotsPath = path.join(distDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');
  console.log(`[SEO] Successfully updated robots.txt at ${robotsPath}`);
}

generateSitemap();
