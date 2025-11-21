import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const { pathname } = request.nextUrl;

    // Rotas públicas que não devem ser protegidas
    const publicRoutes = ['/login', '/register', '/api/auth/login', '/api/auth/register'];

    // Se for rota pública
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        // Se já estiver logado e tentar acessar login/register, redireciona para dashboard
        if (token && verifyToken(token) && (pathname === '/login' || pathname === '/register')) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // Se for rota protegida (/dashboard)
    if (pathname.startsWith('/dashboard')) {
        if (!token || !verifyToken(token)) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/register'],
};
