import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
import Replicate from "replicate";
import path from "path";
import fs from "fs";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Aumentar timeout para 60s

// Mapeamento de arquivos de mockup
const MOCKUP_FILES: Record<string, Record<string, string>> = {
    short: {
        white: "camiseta-manga-curta-branca.png",
        black: "camiseta-manga-curta-preta.png",
        blue: "camiseta-manga-curta-azul.png",
    },
    long: {
        white: "camiseta-manga-longa-branca.png",
        black: "camiseta-manga-longa-preta.png",
        blue: "camiseta-manga-longa-azul.png",
    },
};

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
        const { logoBase64, modelo, cor } = body;

        if (!logoBase64 || !modelo || !cor) {
            return NextResponse.json(
                { status: "error", message: "Dados incompletos (logo, modelo ou cor)" },
                { status: 400 }
            );
        }

        // 1. Identificar arquivo de mockup
        const mockupFileName = MOCKUP_FILES[modelo]?.[cor];
        if (!mockupFileName) {
            return NextResponse.json(
                { status: "error", message: "Combinação de modelo/cor inválida" },
                { status: 400 }
            );
        }

        const mockupPath = path.join(process.cwd(), "public", "mockups", mockupFileName);

        if (!fs.existsSync(mockupPath)) {
            console.error(`Mockup file not found: ${mockupPath}`);
            return NextResponse.json(
                { status: "error", message: "Arquivo de mockup não encontrado no servidor" },
                { status: 500 }
            );
        }

        console.log(`[generate-mockup] Using mockup: ${mockupFileName}`);

        // 2. Compor imagem com node-canvas
        const mockupImage = await loadImage(mockupPath);
        const logoImage = await loadImage(logoBase64);

        const canvas = createCanvas(mockupImage.width, mockupImage.height);
        const ctx = canvas.getContext("2d");

        // Desenhar mockup
        ctx.drawImage(mockupImage, 0, 0);

        // Calcular posição e tamanho da logo (Centralizado no peito)
        const logoWidth = mockupImage.width * 0.35;
        const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

        const logoX = (mockupImage.width - logoWidth) / 2;
        const logoY = mockupImage.height * 0.25;

        // Desenhar logo
        ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);

        // Converter para Base64
        const compositeBase64 = canvas.toDataURL("image/png");

        console.log("[generate-mockup] Composition created. Sending to Replicate...");

        // 3. Enviar para Replicate
        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: "t-shirt realistic mockup, studio lighting, high detail, crisp textile textures, photorealistic, 8k",
                    image: compositeBase64,
                    strength: 0.75,
                    refine: "expert_ensemble_refiner",
                    scheduler: "K_EULER",
                    lora_scale: 0.6,
                    num_inference_steps: 25,
                    guidance_scale: 7.5
                }
            } as any
        );

        console.log("[generate-mockup] Replicate response:", output);

        let resultUrl = "";
        if (Array.isArray(output)) {
            resultUrl = output[0];
        } else {
            resultUrl = String(output);
        }

        console.log("[generate-mockup] Downloading image and converting to Base64...");

        // Baixar a imagem e converter para Base64 (solução definitiva)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000);

            const imageResponse = await fetch(resultUrl, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!imageResponse.ok) {
                throw new Error(`HTTP ${imageResponse.status}`);
            }

            const arrayBuffer = await imageResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

            console.log("[generate-mockup] ✅ Image converted to Base64 successfully");

            return NextResponse.json({
                status: "success",
                resultUrl: base64Image,
                previewBase64: compositeBase64
            });
        } catch (fetchError: any) {
            console.error("[generate-mockup] ⚠️ Failed to download image:", fetchError.message);

            // Fallback: retornar URL original
            return NextResponse.json({
                status: "success",
                resultUrl: resultUrl,
                previewBase64: compositeBase64,
                warning: "Using direct URL (download failed)"
            });
        }

    } catch (error: any) {
        console.error("[generate-mockup] ❌ Error:", error);
        return NextResponse.json(
            { status: "error", message: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
