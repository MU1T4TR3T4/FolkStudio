import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Aumentar limite de tamanho do body para aceitar imagens Base64
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { imageBase64, color, material, sizes, totalQty, observations } = body;

        if (!imageBase64 || !color || !material || !sizes || !totalQty) {
            return NextResponse.json(
                { status: "error", message: "Dados incompletos" },
                { status: 400 }
            );
        }

        // TODO: Pegar userId real da sessão
        const userId = "demo-user";

        // Na Vercel, não podemos salvar arquivos no sistema de arquivos (fs).
        // Vamos salvar a imagem Base64 diretamente no banco de dados por enquanto.
        // Nota: Em produção real com muitos dados, o ideal seria usar S3/Blob Storage.

        const order = await prisma.order.create({
            data: {
                userId,
                imageUrl: imageBase64, // Salvando Base64 direto
                color,
                material,
                sizes: JSON.stringify(sizes),
                totalQty,
                observations: observations || null,
                status: "Pendente",
            },
        });

        return NextResponse.json({
            status: "success",
            order: {
                id: order.id,
                imageUrl: order.imageUrl,
                color: order.color,
                material: order.material,
                sizes: JSON.parse(order.sizes),
                totalQty: order.totalQty,
                status: order.status,
                createdAt: order.createdAt,
            },
        });
    } catch (error: any) {
        console.error("[orders/save] Error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "Erro ao salvar pedido" },
            { status: 500 }
        );
    }
}
