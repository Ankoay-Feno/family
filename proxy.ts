import { NextResponse, type NextRequest } from "next/server";

// Garde OPTIMISTE : simple présence du cookie de session, sans accès à la
// base (le proxy tourne aussi sur les préchargements). La vérification
// réelle de la session reste dans les pages et les server actions.
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has("better-auth.session_token");
  const { pathname } = request.nextUrl;

  // Seul le renvoi optimiste vers /login est sûr : la présence du cookie ne
  // prouve pas que la session est valide (elle peut avoir expiré ou disparu de
  // la base). Renvoyer /login → / sur ce seul indice crée une boucle quand le
  // cookie est périmé, car la page « / » revalide et repart vers /login. Le cas
  // « déjà connecté qui visite /login » est traité côté page (session réelle).
  if (!hasSessionCookie && pathname === "/")
    return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login"],
};
