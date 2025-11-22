import { NextResponse } from "next/server";
import Replicate from "replicate";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        console.log("[remove-bg] Request received");

        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json(
                { status: "error", message: "REPLICATE_API_TOKEN não configurado" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { image } = body;

        if (!image) {
            return NextResponse.json(
                { status: "error", message: "Imagem é obrigatória" },
                { status: 400 }
            );
        }

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        console.log("[remove-bg] Removing background...");

        // Remover fundo com rembg
        const output = await replicate.run(
            "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            {
                input: {
                    image: image
                }
            } as any
        );

        let transparentUrl = "";
        if (Array.isArray(output)) {
            transparentUrl = output[0];
        } else {
            transparentUrl = String(output);
        }

        console.log("[remove-bg] Background removed, downloading result...");

        // Baixar e converter para Base64
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const imageResponse = await fetch(transparentUrl, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!imageResponse.ok) {
            throw new Error(`HTTP ${imageResponse.status}`);
        }

        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

        console.log("[remove-bg] ✅ Image processed successfully");

        return NextResponse.json({
            status: "success",
            image: base64Image
        });

    } catch (error: any) {
        console.error("[remove-bg] ❌ Error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
