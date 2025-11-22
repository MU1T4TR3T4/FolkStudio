import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        // TODO: Pegar userId real da sessão
        const userId = "demo-user";

        const stamps = await prisma.stamp.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            status: "success",
            stamps,
        });
    } catch (error: any) {
        console.error("[stamps/list] Error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "Erro ao listar estampas" },
            { status: 500 }
        );
    }
}
