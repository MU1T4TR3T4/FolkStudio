import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { status: "error", message: "ID do pedido não fornecido" },
                { status: 400 }
            );
        }

        // Modo demonstração: usa userId fixo
        const userId = "demo-user";

        const order = await prisma.order.findUnique({
            where: { id },
        });

        if (!order) {
            return NextResponse.json(
                { status: "error", message: "Pedido não encontrado" },
                { status: 404 }
            );
        }

        if (order.userId !== userId) {
            return NextResponse.json(
                { status: "error", message: "Acesso negado" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            status: "success",
            order,
        });
    } catch (error) {
        console.error("Get Order Error:", error);
        return NextResponse.json(
            { status: "error", message: "Erro ao buscar pedido" },
            { status: 500 }
        );
    }
}
