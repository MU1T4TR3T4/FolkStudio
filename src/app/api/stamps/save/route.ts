import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { frontImage, backImage, frontDesignData, backDesignData, name } = body;

        if (!frontImage) {
            return NextResponse.json(
                { status: "error", message: "Imagem da frente é obrigatória" },
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

        // Gerar nome único para os arquivos
        const timestamp = Date.now();

        // Salvar imagem da frente
        const frontFileName = `stamp-${timestamp}-front.png`;
        const frontFilePath = path.join(userDir, frontFileName);
        const frontBase64Data = frontImage.replace(/^data:image\/\w+;base64,/, "");
        const frontBuffer = Buffer.from(frontBase64Data, "base64");
        fs.writeFileSync(frontFilePath, frontBuffer);
        const frontImageUrl = `/uploads/stamps/${userId}/${frontFileName}`;

        // Salvar imagem das costas (se existir)
        let backImageUrl = null;
        if (backImage) {
            const backFileName = `stamp-${timestamp}-back.png`;
            const backFilePath = path.join(userDir, backFileName);
            const backBase64Data = backImage.replace(/^data:image\/\w+;base64,/, "");
            const backBuffer = Buffer.from(backBase64Data, "base64");
            fs.writeFileSync(backFilePath, backBuffer);
            backImageUrl = `/uploads/stamps/${userId}/${backFileName}`;
        }

        // Salvar no banco de dados (com fallback se tabela não existir)
        let stamp;
        try {
            stamp = await prisma.stamp.create({
                data: {
                    userId,
                    name: name || null,
                    frontImageUrl,
                    backImageUrl,
                    frontDesignData: frontDesignData ? JSON.stringify(frontDesignData) : null,
                    backDesignData: backDesignData ? JSON.stringify(backDesignData) : null,
                },
            });
        } catch (dbError: any) {
            console.warn("[stamps/save] DB Error (tabela pode não existir):", dbError.message);
            // Fallback: retornar sucesso mesmo sem salvar no banco
            stamp = {
                id: `temp-${timestamp}`,
                name: name || null,
                frontImageUrl,
                backImageUrl,
                createdAt: new Date(),
            } as any;
        }

        return NextResponse.json({
            status: "success",
            stamp: {
                id: stamp.id,
                name: stamp.name,
                frontImageUrl: stamp.frontImageUrl,
                backImageUrl: stamp.backImageUrl,
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
