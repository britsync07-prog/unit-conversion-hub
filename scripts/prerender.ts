import fs from 'fs';
import path from 'path';
import { categories } from '../src/data/categories.js';
import { conversionPairs } from '../src/data/conversions.js';
import { units } from '../src/data/units.js';
import { convert, formatValue, getUnitById } from '../src/lib/conversion-engine.js';
import { withSiteUrl } from '../src/lib/url.js';

/**
 * Canonical origin for this build. Set `SITE_URL` in CI to deploy to a custom
 * domain; otherwise use the live Cloudflare Pages URL. Never hardcode a domain
 * we do not control.
 */
const SITE_URL = (process.env.SITE_URL || 'https://unitconversionhub.pages.dev').replace(/\/+$/, '');
const FALLBACK_ORIGIN = 'https://unitconversionhub.pages.dev';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

interface RouteMeta {
  route: string;
  title: string;
  description: string;
  h1: string;
  breadcrumbs: { name: string; url: string }[];
  faqs?: { question: string; answer: string }[];
  bodyHtml?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildRouteMetadata(): RouteMeta[] {
  const routes: RouteMeta[] = [];

  // Home Page
  routes.push({
    route: '/',
    title: 'UnitConversionHub – Fast & Precise Free Online Unit Converter',
    description: 'Instant free unit conversion for length, weight, temperature, volume, area, speed, time, energy, pressure, and digital storage.',
    h1: 'UnitConversionHub – Fast & Precise Free Unit Converter',
    breadcrumbs: [{ name: 'Home', url: '/' }],
  });

  // Category Pages
  for (const cat of categories) {
    const catUnits = units.filter((u) => u.categoryId === cat.id);
    const catPairs = conversionPairs.filter((p) => p.categoryId === cat.id);

    const unitsListHtml = catUnits
      .map((u) => `<li><strong>${u.name} (${u.symbol})</strong> — ${u.system ? u.system.toUpperCase() : 'Standard'} unit</li>`)
      .join('');

    const pairLinksHtml = catPairs
      .slice(0, 10)
      .map((p) => {
        const f = getUnitById(p.fromId);
        const t = getUnitById(p.toId);
        return f && t ? `<li><a href="/convert/${p.slug}/" style="color: #2563eb; font-weight: 600;">${f.name} to ${t.name} (${f.symbol} to ${t.symbol})</a></li>` : '';
      })
      .join('');

    const bodyHtml = `
      <div style="max-width: 1000px; margin: 0 auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
        <h1 style="font-size: 2.25rem; font-weight: 800; margin-bottom: 10px;">${cat.name} Converter</h1>
        <p style="color: #4b5563; margin-bottom: 24px;">${cat.description}</p>
        <h2 style="font-size: 1.25rem; font-weight: 700; margin-top: 24px;">Popular ${cat.name} Conversions</h2>
        <ul style="margin-top: 10px; margin-bottom: 30px; line-height: 1.8;">${pairLinksHtml}</ul>
        <h2 style="font-size: 1.25rem; font-weight: 700;">Supported ${cat.name} Measurement Units</h2>
        <ul style="margin-top: 10px; line-height: 1.8;">${unitsListHtml}</ul>
      </div>
    `;

    routes.push({
      route: `/${cat.slug}`,
      title: `${cat.name} Converter — Fast & Free Calculator | UnitConversionHub`,
      description: `Convert between all standard ${cat.name.toLowerCase()} units. Instant, free, and accurate conversion calculator with NIST SI reference standards.`,
      h1: `${cat.name} Converter`,
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: `${cat.name} Converter`, url: `/${cat.slug}` },
      ],
      bodyHtml,
    });
  }

  // Conversion Pair Pages
  for (const pair of conversionPairs) {
    const from = getUnitById(pair.fromId);
    const to = getUnitById(pair.toId);
    const cat = categories.find((c) => c.id === pair.categoryId);

    if (from && to && cat) {
      const factor = convert(1, from.id, to.id);
      const factorFormatted = formatValue(factor, 'auto');

      const faqs = [
        {
          question: `How many ${to.plural.toLowerCase()} are in 1 ${from.name.toLowerCase()}?`,
          answer: `There are exactly ${factorFormatted} ${to.plural.toLowerCase()} in 1 ${from.name.toLowerCase()}.`,
        },
        {
          question: `How do I convert ${from.symbol} to ${to.symbol}?`,
          answer: `To convert ${from.plural.toLowerCase()} to ${to.plural.toLowerCase()}, multiply the value by ${factorFormatted}.`,
        },
        {
          question: `Is the ${from.symbol} to ${to.symbol} conversion formula standardized?`,
          answer: `Yes, this conversion strictly adheres to International System of Units (SI) and NIST standards.`,
        },
      ];

      const benchmarks = [1, 5, 10, 25, 50, 100];
      const tableRows = benchmarks
        .map((v) => {
          const res = convert(v, from.id, to.id);
          return `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${v} ${from.symbol}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formatValue(res, 'auto')} ${to.symbol}</td></tr>`;
        })
        .join('');

      const bodyHtml = `
        <div style="max-width: 1000px; margin: 0 auto; padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
          <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 10px;">${from.plural} to ${to.plural} Converter</h1>
          <p style="color: #4b5563; margin-bottom: 20px;">Convert ${from.plural.toLowerCase()} (${from.symbol}) to ${to.plural.toLowerCase()} (${to.symbol}) with live calculation, exact formula, and conversion table.</p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; border-radius: 12px; margin-bottom: 24px;">
            <strong style="color: #1d4ed8;">Quick Formula:</strong> 1 ${from.name} = <strong>${factorFormatted}</strong> ${to.plural.toLowerCase()}
          </div>
          <h2 style="font-size: 1.25rem; font-weight: 700; margin-top: 24px;">${from.name} to ${to.name} Conversion Table</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px;">
            <thead>
              <tr style="background: #f9fafb; text-align: left;">
                <th style="padding: 8px; border-bottom: 2px solid #ddd;">${from.name} (${from.symbol})</th>
                <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">${to.name} (${to.symbol})</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
          <h2 style="font-size: 1.25rem; font-weight: 700;">Frequently Asked Questions</h2>
          ${faqs.map(f => `<div style="margin-top: 12px;"><h3 style="font-size: 1rem; font-weight: 600;">${f.question}</h3><p style="color: #4b5563; margin-top: 4px;">${f.answer}</p></div>`).join('')}
        </div>
      `;

      routes.push({
        route: `/convert/${pair.slug}`,
        title: `${from.plural} to ${to.plural} Converter (${from.symbol} to ${to.symbol}) — Free Calculator`,
        description: `Convert ${from.plural.toLowerCase()} to ${to.plural.toLowerCase()} instantly. Free ${from.symbol} to ${to.symbol} calculator with conversion formula and comparison table.`,
        h1: `${from.plural} to ${to.plural} Converter`,
        breadcrumbs: [
          { name: 'Home', url: '/' },
          { name: `${cat.name} Converter`, url: `/${cat.slug}` },
          { name: `${from.name} to ${to.name}`, url: `/convert/${pair.slug}` },
        ],
        faqs,
        bodyHtml,
      });
    }
  }

  return routes;
}

function prerender() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const templatePath = path.join(distDir, 'index.html');

  if (!fs.existsSync(templatePath)) {
    console.error('[SEO PRERENDER ERROR] dist/index.html not found. Run vite build first.');
    process.exit(1);
  }

  let templateHtml = fs.readFileSync(templatePath, 'utf-8');
  const routes = buildRouteMetadata();

  console.log(`[SEO PRERENDER] Starting pre-rendering for ${routes.length} routes...`);

  // Strip fallback social tags from the template, then inject per-route tags.
  templateHtml = templateHtml
    .replace(/<link rel="canonical"[^>]*>/g, '')
    .replace(/<meta name="description"[^>]*>/g, '')
    .replace(/<meta property="og:(title|description|type|url|image|site_name)"[^>]*>/g, '')
    .replace(/<meta name="twitter:(card|title|description|image)"[^>]*>/g, '')
    .replace(new RegExp(FALLBACK_ORIGIN, 'g'), SITE_URL);

  let generatedCount = 0;

  for (const item of routes) {
    const canonicalUrl = withSiteUrl(SITE_URL, item.route);

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: item.breadcrumbs.map((b, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: b.name,
        item: b.url.startsWith('http') ? b.url : withSiteUrl(SITE_URL, b.url),
      })),
    };

    let faqSchemaStr = '';
    if (item.faqs && item.faqs.length > 0) {
      const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: item.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      };
      faqSchemaStr = `<script type="application/ld+json" id="seo-schema-faq">${JSON.stringify(faqSchema)}</script>`;
    }

    const title = escapeHtml(item.title);
    const description = escapeHtml(item.description);

    const headTags = `
      <title>${title}</title>
      <meta name="description" content="${description}" />
      <link rel="canonical" href="${canonicalUrl}" />
      <meta property="og:site_name" content="UnitConversionHub" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:url" content="${canonicalUrl}" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="${OG_IMAGE}" />
      <meta property="og:image:alt" content="UnitConversionHub — free, precise online unit converter" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${title}" />
      <meta name="twitter:description" content="${description}" />
      <meta name="twitter:image" content="${OG_IMAGE}" />
      <script type="application/ld+json" id="seo-schema-breadcrumbs">${JSON.stringify(breadcrumbSchema)}</script>
      ${faqSchemaStr}
    `;

    let pageHtml = templateHtml.replace(/<title>[\s\S]*?<\/title>/, () => headTags);

    if (item.bodyHtml) {
      pageHtml = pageHtml.replace('<div id="root"></div>', () => `<div id="root">${item.bodyHtml}</div>`);
    }

    let targetFile: string;
    if (item.route === '/') {
      targetFile = path.join(distDir, 'index.html');
    } else {
      const routeDir = path.join(distDir, item.route.replace(/^\/+/, ''));
      if (!fs.existsSync(routeDir)) {
        fs.mkdirSync(routeDir, { recursive: true });
      }
      targetFile = path.join(routeDir, 'index.html');
    }

    fs.writeFileSync(targetFile, pageHtml, 'utf-8');
    generatedCount++;
  }

  // Fallback for static hosts that look for a 404 document.
  const notFoundHtml = templateHtml
    .replace(
      /<title>[\s\S]*?<\/title>/,
      () =>
        `<title>404 — Page Not Found | UnitConversionHub</title>
      <meta name="description" content="The requested conversion page could not be found. Browse the UnitConversionHub directory or return home." />
      <meta name="robots" content="noindex" />`
    );
  fs.writeFileSync(path.join(distDir, '404.html'), notFoundHtml, 'utf-8');

  console.log(`[SEO PRERENDER SUCCESS] Pre-rendered ${generatedCount} static HTML pages in dist/!`);
}

prerender();
