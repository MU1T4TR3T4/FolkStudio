import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        // TODO: Pegar userId real da sessão
        const userId = "demo-user";

        const messages = await prisma.message.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({
            status: "success",
            messages,
        });
    } catch (error: any) {
        console.error("[chat/list] Error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "Erro ao listar mensagens" },
            { status: 500 }
        );
    }
}
