import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { imageBase64, name, designData } = body;

        if (!imageBase64) {
            return NextResponse.json(
                { status: "error", message: "Imagem é obrigatória" },
                { status: 400 }
            );
        }

        // TODO: Pegar userId real da sessão
        const userId = "demo-user";

        // Criar diretório do usuário se não existir
        const userDir = path.join(process.cwd(), "public", "uploads", "stamps", userId);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }

        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const fileName = `stamp-${timestamp}.png`;
        const filePath = path.join(userDir, fileName);

        // Converter Base64 para arquivo
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        fs.writeFileSync(filePath, buffer);

        // URL pública da imagem
        const imageUrl = `/uploads/stamps/${userId}/${fileName}`;

        // Salvar no banco de dados
        const stamp = await prisma.stamp.create({
            data: {
                userId,
                name: name || null,
                imageUrl,
                designData: designData ? JSON.stringify(designData) : null,
            },
        });

        return NextResponse.json({
            status: "success",
            stamp: {
                id: stamp.id,
                name: stamp.name,
                imageUrl: stamp.imageUrl,
                createdAt: stamp.createdAt,
            },
        });
    } catch (error: any) {
        console.error("[stamps/save] Error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "Erro ao salvar estampa" },
            { status: 500 }
        );
    }
}
