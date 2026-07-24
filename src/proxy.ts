import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "myfinances_session";
const privatePaths = [
  "/inicio",
  "/transacciones",
  "/tours",
  "/proyectos",
  "/cuentas",
  "/presupuestos",
  "/metas",
  "/deudas",
  "/calendario",
  "/reportes",
  "/configuracion",
];
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(AUTH_COOKIE);
  const pathname = request.nextUrl.pathname;

  if (!hasSession && privatePaths.some((path) => pathname.startsWith(path))) {
    const url = new URL("/iniciar-sesion", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/inicio/:path*",
    "/transacciones/:path*",
    "/tours/:path*",
    "/proyectos/:path*",
    "/cuentas/:path*",
    "/presupuestos/:path*",
    "/metas/:path*",
    "/deudas/:path*",
    "/calendario/:path*",
    "/reportes/:path*",
    "/configuracion/:path*",
  ],
};
