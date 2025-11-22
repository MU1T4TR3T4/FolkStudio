import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        // TODO: Pegar userId real da sessão
        const userId = "demo-user";

        const orders = await prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        // Parse sizes JSON
        const ordersWithParsedSizes = orders.map((order: any) => ({
            ...order,
            sizes: JSON.parse(order.sizes),
        }));

        return NextResponse.json({
            status: "success",
            orders: ordersWithParsedSizes,
        });
    } catch (error: any) {
        console.error("[orders/list] Error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "Erro ao listar pedidos" },
            { status: 500 }
        );
    }
}
