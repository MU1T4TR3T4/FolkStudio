import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware desativado para demonstração
// Permite acesso a todas as rotas sem autenticação

export function middleware(request: NextRequest) {
    // Não faz nenhuma verificação, permite tudo passar
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
