import { NextResponse } from "next/server";
import Replicate from "replicate";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        console.log("[generate-mockup] Request received");

        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json(
                { status: "error", message: "REPLICATE_API_TOKEN não configurado" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json(
                { status: "error", message: "Prompt é obrigatório" },
                { status: 400 }
            );
        }

        console.log(`[generate-mockup] User prompt: "${prompt}"`);

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        // Prompt otimizado para gerar design isolado
        const designPrompt = `${prompt}, isolated design element, centered composition, white background, no text, sticker style, high quality, detailed, 8k`;
        const negativePrompt = "blurry, low quality, distorted, deformed, background elements, text, watermark, multiple objects, cluttered";

        console.log(`[generate-mockup] Design prompt: "${designPrompt}"`);

        // Passo 1: Gerar design com SDXL
        const designOutput = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: designPrompt,
                    negative_prompt: negativePrompt,
                    width: 1024,
                    height: 1024,
                    num_inference_steps: 30,
                    guidance_scale: 7.5,
                    scheduler: "K_EULER"
                }
            } as any
        );

        let designUrl = "";
        if (Array.isArray(designOutput)) {
            designUrl = designOutput[0];
        } else {
            designUrl = String(designOutput);
        }

        console.log("[generate-mockup] Design generated, removing background...");

        // Passo 2: Remover fundo com rembg
        const transparentOutput = await replicate.run(
            "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            {
                input: {
                    image: designUrl
                }
            } as any
        );

        let transparentUrl = "";
        if (Array.isArray(transparentOutput)) {
            transparentUrl = transparentOutput[0];
        } else {
            transparentUrl = String(transparentOutput);
        }

        console.log("[generate-mockup] Background removed, downloading...");

        // Passo 3: Baixar e converter para Base64
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

        console.log("[generate-mockup] ✅ Design with transparent background ready");

        // Retornar design como "logo gerada" para ser posicionada
        return NextResponse.json({
            status: "success",
            generatedLogo: base64Image,
            mode: "design"
        });

    } catch (error: any) {
        console.error("[generate-mockup] ❌ Error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
