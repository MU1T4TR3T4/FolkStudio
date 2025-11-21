// Middleware desativado para demonstração
// Permite acesso a todas as rotas sem autenticação

export function middleware() {
    // Não faz nenhuma verificação, permite tudo passar
    return;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
