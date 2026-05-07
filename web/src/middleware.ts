import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware: coarse authentication gate for protected routes.
 *
 * Because the auth JWT lives in an HttpOnly cookie set by the FastAPI
 * service, middleware can only check for its *presence* — signature
 * verification stays on the API. Cookies are scoped to the host that
 * issued them, so this gate only works when the API and web are
 * reachable on the same hostname (`localhost` in dev) or share a parent
 * domain via `Set-Cookie; Domain=.example.com` (custom-domain prod).
 *
 * On Railway/Cloud Run defaults (`*-api.up.railway.app` +
 * `*-web.up.railway.app`), the API and web are on different hostnames
 * under a public-suffix parent — cookies *cannot* be shared, so the
 * cookie set on the API host is never visible to this middleware. In
 * that topology we skip the check entirely and rely on the client-side
 * redirect in `useAuth`/the protected page itself; the API still
 * enforces auth on every request, so this is a UX nicety, not a
 * security layer.
 *
 * When the cookie is missing on a same-host deploy, we redirect to
 * `/login?next=<original>` so users return to where they were trying
 * to go.
 */

const COOKIE_NAME = "gulp_auth";

const PROTECTED_PREFIXES = ["/sell", "/dashboard"];
const PROTECTED_SUFFIXES = ["/edit"];

function requiresAuth(pathname: string): boolean {
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return PROTECTED_SUFFIXES.some((s) => pathname.endsWith(s));
}

/**
 * True iff the auth cookie set by the API can plausibly be visible to
 * the web's hostname. We treat the cookie as shareable when the API and
 * web are on the *same* hostname (e.g. both `localhost` in dev). Any
 * cross-hostname split — Railway's `*-api` / `*-web` subdomains, GCP
 * Cloud Run's `*.run.app`, or sibling subdomains without a configured
 * shared `Domain=` — is treated as non-shared and skipped here.
 *
 * `NEXT_PUBLIC_API_BASE_URL` is a build-time public env var, so it's
 * inlined into the edge bundle and available at request time.
 */
function authCookieMayBeOnThisHost(req: NextRequest): boolean {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) return true; // unknown wiring — fall back to enforcing
  try {
    const apiHost = new URL(apiBase).hostname;
    return apiHost === req.nextUrl.hostname;
  } catch {
    return true;
  }
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!requiresAuth(pathname)) return NextResponse.next();
  if (!authCookieMayBeOnThisHost(req)) return NextResponse.next();

  const hasCookie = req.cookies.has(COOKIE_NAME);
  if (hasCookie) return NextResponse.next();

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/sell",
    "/sell/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/listing/:id/edit",
  ],
};
