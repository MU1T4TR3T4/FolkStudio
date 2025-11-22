import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { content } = body;

        if (!content || !content.trim()) {
            return NextResponse.json(
                { status: "error", message: "Mensagem vazia" },
                { status: 400 }
            );
        }

        // TODO: Pegar userId real da sessão
        const userId = "demo-user";

        const message = await prisma.message.create({
            data: {
                userId,
                content: content.trim(),
                isAdmin: false,
            },
        });

        return NextResponse.json({
            status: "success",
            message,
        });
    } catch (error: any) {
        console.error("[chat/send] Error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "Erro ao enviar mensagem" },
            { status: 500 }
        );
    }
}
