import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/session-cookie";

// Controllo di sola presenza del cookie (runtime edge, non valida la firma
// del token): un filtro veloce per evitare di caricare pagine protette
// senza alcuna sessione. La validità reale del token resta verificata dal
// backend ad ogni chiamata API (vedi lib/api.ts), che è l'unica fonte
// autorevole — un cookie presente ma scaduto/non valido viene comunque
// intercettato lì (redirect a /login nei layout, vedi app/(app)/layout.tsx,
// app/consulente/layout.tsx e app/superadmin/layout.tsx).
const PREFISSI_PROTETTI = ["/anagrafica", "/consulente", "/superadmin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const haSessione = request.cookies.has(SESSION_COOKIE_NAME);

  const protetta = PREFISSI_PROTETTI.some((prefisso) => pathname.startsWith(prefisso));
  if (protetta && !haSessione) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && haSessione) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/anagrafica/:path*", "/consulente/:path*", "/superadmin/:path*", "/login"],
};
