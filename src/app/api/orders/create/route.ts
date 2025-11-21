import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // Modo demonstração: usa userId fixo
        const userId = "demo-user";

        const body = await req.json();
        const { previewUrl, designUrl, model, color } = body;

        if (!previewUrl || !designUrl || !model || !color) {
            return NextResponse.json(
                { status: "error", message: "Dados incompletos" },
                { status: 400 }
            );
        }

        const order = await prisma.order.create({
            data: {
                userId,
                previewUrl,
                designUrl,
                model,
                color,
            },
        });

        return NextResponse.json({
            status: "success",
            orderId: order.id,
        });
    } catch (error) {
        console.error("Create Order Error:", error);
        return NextResponse.json(
            { status: "error", message: "Erro ao criar pedido" },
            { status: 500 }
        );
    }
}
