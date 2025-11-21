import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, name, phone, address } = body;

        if (!orderId || !name || !phone || !address) {
            return NextResponse.json(
                { status: "error", message: "Dados incompletos" },
                { status: 400 }
            );
        }

        // Modo demonstração: usa userId fixo
        const userId = "demo-user";

        const order = await prisma.order.findUnique({
            where: { id: orderId },
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

        const webhookUrl = process.env.N8N_WEBHOOK_URL;

        if (!webhookUrl) {
            console.error("N8N_WEBHOOK_URL não configurada");
            return NextResponse.json(
                { status: "error", message: "Erro de configuração do servidor" },
                { status: 500 }
            );
        }

        const webhookPayload = {
            orderId: order.id,
            previewUrl: order.previewUrl,
            designUrl: order.designUrl,
            model: order.model,
            color: order.color,
            createdAt: order.createdAt,
            customer: {
                name,
                phone,
                address
            }
        };

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(webhookPayload),
        });

        if (!response.ok) {
            throw new Error(`Webhook error: ${response.statusText}`);
        }

        return NextResponse.json({
            status: "success",
            message: "Pedido enviado com sucesso"
        });

    } catch (error) {
        console.error("Submit Order Error:", error);
        return NextResponse.json(
            { status: "error", message: "Erro ao processar pedido" },
            { status: 500 }
        );
    }
}
