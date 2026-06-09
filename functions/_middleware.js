// Cloudflare Pages Functions middleware.
//
// The Pages project serves several hostnames (the apex fixdns.net plus the
// www variant and the brokedns.com alias). Without this, every alias returns
// 200 with identical content and a canonical tag pointing at the apex, which
// Google reports as "Alternate page with proper canonical tag" in Search
// Console. Issuing a 301 to the canonical apex collapses those duplicates into
// real redirects so only https://fixdns.net/ is ever served.

const CANONICAL_HOST = 'fixdns.net';

export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);
  const host = url.hostname;

  // Serve the canonical apex, *.pages.dev preview builds, and local dev as-is.
  if (host === CANONICAL_HOST || host.endsWith('.pages.dev') || host === 'localhost') {
    return next();
  }

  // 301 every other host (www.fixdns.net, brokedns.com, www.brokedns.com, …)
  // to the canonical apex, preserving the path and query string.
  url.hostname = CANONICAL_HOST;
  url.protocol = 'https:';
  url.port = '';

  return new Response(null, {
    status: 301,
    headers: {
      Location: url.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
