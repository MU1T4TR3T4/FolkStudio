import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

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

        // Criar diretório do usuário se não existir
        const userDir = path.join(process.cwd(), "public", "uploads", "orders", userId);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        // Salvar imagem
        const timestamp = Date.now();
        const fileName = `order-${timestamp}.png`;
        const filePath = path.join(userDir, fileName);
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        fs.writeFileSync(filePath, buffer);
        const imageUrl = `/uploads/orders/${userId}/${fileName}`;

        // Salvar no banco
        const order = await prisma.order.create({
            data: {
                userId,
                imageUrl,
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
