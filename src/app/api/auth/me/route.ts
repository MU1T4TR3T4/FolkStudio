import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
        return NextResponse.json(
            { status: "error", message: "Não autenticado" },
            { status: 401 }
        );
    }

    const payload = verifyToken(token) as any;

    if (!payload || !payload.userId) {
        return NextResponse.json(
            { status: "error", message: "Token inválido" },
            { status: 401 }
        );
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, name: true, email: true },
        });

        if (!user) {
            return NextResponse.json(
                { status: "error", message: "Usuário não encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: "success",
            data: { user },
        });
    } catch (error) {
        return NextResponse.json(
            { status: "error", message: "Erro no servidor" },
            { status: 500 }
        );
    }
}
