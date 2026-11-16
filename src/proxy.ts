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

    // Solo ADMIN, SUPERADMIN o ENTRENADOR tienen autorización para ingresar a /admin
    if (
      session.role !== "ADMIN" &&
      session.role !== "SUPERADMIN" &&
      session.role !== "ENTRENADOR"
    ) {
      // Si es un usuario común (USER), redirigir a su vista de miembro
      const memberUrl = new URL("/mi-rutina", request.url);
      memberUrl.searchParams.set("error", "acceso_denegado");
      return NextResponse.redirect(memberUrl);
    }

    // El rol ENTRENADOR NO tiene acceso a la parte económica ni a planes comerciales / sucursales / kiosco
    if (
      session.role === "ENTRENADOR" &&
      (pathname.startsWith("/admin/economia") ||
        pathname.startsWith("/admin/plan") ||
        pathname.startsWith("/admin/sucursales") ||
        pathname.startsWith("/admin/kiosco"))
    ) {
      const trainerUrl = new URL("/admin/rutinas", request.url);
      trainerUrl.searchParams.set("error", "acceso_economia_denegado");
      return NextResponse.redirect(trainerUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

