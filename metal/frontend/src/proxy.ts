
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 1. Definimos las rutas que requieren protección estricta
const protectedRoutes = ['/manager', '/worker', '/client'];
// Rutas que no deben ser accesibles si el usuario YA está logueado
const publicAuthRoutes = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 2. Extraemos la cookie segura que inyectó nuestro backend NestJS
  const token = request.cookies.get('access_token')?.value;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicAuthRoute = publicAuthRoutes.some((route) => pathname.startsWith(route));

  // 3. REGLA ZERO TRUST: Intento de acceso a zona segura SIN token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    // Redirigimos al login, limpiando cualquier intento de acceso no autorizado
    return NextResponse.redirect(loginUrl);
  }

  // 4. REGLA DE EXPERIENCIA DE USUARIO: Usuario logueado intentando ir a /login
  if (isPublicAuthRoute && token) {
    // Si ya tiene sesión, lo enviamos al dashboard por defecto (luego mejoraremos 
    // esta lógica para que detecte su rol y lo envíe a la ruta correcta).
    const homeUrl = new URL('/manager', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // 5. Flujo normal: Permitir que la petición continúe
  return NextResponse.next();
}

// 6. Optimización de rendimiento computacional: 
// Solo ejecutamos este middleware en rutas específicas, ignorando imágenes, APIs internas, etc.
export const config = {
  matcher: [
    '/manager/:path*', 
    '/worker/:path*', 
    '/client/:path*', 
    '/login'
  ],
};