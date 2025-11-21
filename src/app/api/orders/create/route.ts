import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
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
                userId: payload.userId,
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
