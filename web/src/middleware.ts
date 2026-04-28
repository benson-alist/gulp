import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware: coarse authentication gate for protected routes.
 *
 * Because the auth JWT lives in an HttpOnly cookie set by the FastAPI
 * service, middleware can only check for its *presence* — signature
 * verification stays on the API. Matching is host-scoped by cookie name
 * (`gulp_auth`), which means the API and the web must share a hostname
 * (`localhost` in dev; a common parent domain in prod). Ports don't
 * matter for cookie scoping.
 *
 * When the cookie is missing, we redirect to `/login?next=<original>` so
 * users return to where they were trying to go. The API still enforces
 * auth on every request, so this is a UX nicety, not a security layer.
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

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (!requiresAuth(pathname)) return NextResponse.next();

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
