import { NextResponse, type NextRequest } from 'next/server';

// Old-domain 301: keep Stripe webhook traffic excluded so events keep landing.
const OLD_HOSTS = ['glitterhits.online', 'www.glitterhits.online'];

export function middleware(request: NextRequest) {
  const host = (request.headers.get('host') || '').toLowerCase();
  if (!OLD_HOSTS.includes(host)) {
    return NextResponse.next();
  }
  const url = new URL(request.url);
  const target = new URL(
    `https://traffic.glitteruniverse.quest${url.pathname}${url.search}`
  );
  const res = NextResponse.redirect(target, 308);
  res.headers.set('x-gh-legacy-redirect', '1');
  return res;
}

export const config = {
  matcher: [
    // Skip the Stripe webhook route so legacy events are still delivered.
    '/((?!api/webhooks/stripe).*)',
  ],
};
