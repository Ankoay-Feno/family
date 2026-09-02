import { NextResponse, type NextRequest } from "next/server";

// Garde OPTIMISTE : simple présence du cookie de session, sans accès à la
// base (le proxy tourne aussi sur les préchargements). La vérification
// réelle de la session reste dans les pages et les server actions.
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has("better-auth.session_token");
  const { pathname } = request.nextUrl;

  if (!hasSessionCookie && pathname === "/")
    return NextResponse.redirect(new URL("/login", request.url));
  if (hasSessionCookie && pathname === "/login")
    return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login"],
};
