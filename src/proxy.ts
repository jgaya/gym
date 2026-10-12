import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger todas las rutas que comienzan con /admin
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = await verifySessionToken(token);

    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Solo ADMIN o SUPERADMIN tienen autorización para ingresar a /admin
    if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
      // Si es un usuario común (USER), redirigir a su vista de miembro
      const memberUrl = new URL("/mi-rutina", request.url);
      memberUrl.searchParams.set("error", "acceso_denegado");
      return NextResponse.redirect(memberUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

