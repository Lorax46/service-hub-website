import { NextRequest, NextResponse } from 'next/server';

// Rotas públicas que não requerem autenticação
const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Verificar cookie de autenticação
  const authToken = request.cookies.get('session');

  if (!authToken && !pathname.startsWith('/api/public/')) {
    // Redirecionar para login se não autenticado
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Matcher de rotas que requerem autenticação
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
