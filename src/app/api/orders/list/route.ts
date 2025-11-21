import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Modo demonstração: usa userId fixo
        const userId = "demo-user";

        const orders = await prisma.order.findMany({
            where: { userId },
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
