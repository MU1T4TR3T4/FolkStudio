import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Simular tempo de IA (1s)
        await new Promise(res => setTimeout(res, 1000));

        // MOCK – imagem estática de camiseta realista
        return NextResponse.json({
            success: true,
            previewUrl: "https://i.imgur.com/6Xz6QKZ.png",
            received: body, // Apenas para debug
        });
    } catch (err) {
        return NextResponse.json(
            { success: false, error: "Erro ao gerar prévia" },
            { status: 500 }
        );
    }
}
