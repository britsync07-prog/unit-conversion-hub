import { normalizePath, withSiteUrl } from './url';

/**
 * Single source of truth for the public site URL.
 *
 * Set `VITE_SITE_URL` at build time (see `.env.example`) when deploying to a
 * custom domain. The fallback is the live Cloudflare Pages deployment, never a
 * third-party domain — canonical tags must point at a site we actually own.
 */
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL || 'https://unitconversionhub.pages.dev'
).replace(/\/+$/, '');

/** Absolute, trailing-slash-normalized URL for a route. */
export function absoluteUrl(pathname = '/'): string {
  return withSiteUrl(SITE_URL, pathname);
}

export { normalizePath };
