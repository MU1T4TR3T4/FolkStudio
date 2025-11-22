import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const stampId = searchParams.get("id");

        if (!stampId) {
            return NextResponse.json(
                { status: "error", message: "ID da estampa é obrigatório" },
                { status: 400 }
            );
        }

        // Buscar estampa
        const stamp = await prisma.stamp.findUnique({
            where: { id: stampId },
        });

        if (!stamp) {
            return NextResponse.json(
                { status: "error", message: "Estampa não encontrada" },
                { status: 404 }
            );
        }

        // Deletar arquivos (frente e costas)
        const frontFilePath = path.join(process.cwd(), "public", stamp.frontImageUrl);
        if (fs.existsSync(frontFilePath)) {
            fs.unlinkSync(frontFilePath);
        }

        if (stamp.backImageUrl) {
            const backFilePath = path.join(process.cwd(), "public", stamp.backImageUrl);
            if (fs.existsSync(backFilePath)) {
                fs.unlinkSync(backFilePath);
            }
        }

        // Deletar do banco
        await prisma.stamp.delete({
            where: { id: stampId },
        });

        return NextResponse.json({
            status: "success",
            message: "Estampa deletada com sucesso",
        });
    } catch (error: any) {
        console.error("[stamps/delete] Error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "Erro ao deletar estampa" },
            { status: 500 }
        );
    }
}
