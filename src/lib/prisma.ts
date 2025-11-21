import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    // Durante o build, retorna um mock para evitar erros de conexão
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return {} as PrismaClient;
    }
    return new PrismaClient();
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
