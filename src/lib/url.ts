/**
 * Pure URL helpers shared by the browser bundle and the Node build scripts.
 *
 * Kept free of `import.meta.env` and `process` so the same code can run in
 * Vite, Vitest, and `tsx` without a DOM or a bundler.
 */

/** Strip query/hash noise and force the trailing slash Cloudflare Pages serves. */
export function normalizePath(pathname: string): string {
  const clean = (pathname || '/').split('?')[0].split('#')[0];
  if (!clean || clean === '/') return '/';
  return clean.endsWith('/') ? clean : `${clean}/`;
}

/** Join a site origin with a route, producing the URL that returns HTTP 200. */
export function withSiteUrl(siteUrl: string, pathname = '/'): string {
  const origin = siteUrl.replace(/\/+$/, '');
  return `${origin}${normalizePath(pathname)}`;
}
