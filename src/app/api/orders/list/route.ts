import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
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

        const orders = await prisma.order.findMany({
            where: { userId: payload.userId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            status: "success",
            orders,
        });
    } catch (error) {
        console.error("List Orders Error:", error);
        return NextResponse.json(
            { status: "error", message: "Erro ao listar pedidos" },
            { status: 500 }
        );
    }
}
