import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
import Replicate from "replicate";
import path from "path";
import fs from "fs";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
        const { logoBase64, modelo, cor, design } = body;

        if (!logoBase64 || !modelo || !cor) {
            return NextResponse.json(
                { status: "error", message: "Dados incompletos (logo, modelo ou cor)" },
                { status: 400 }
            );
        }

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
        console.log(`[generate-mockup] Design params:`, design);

        // Compor imagem com node-canvas
        const mockupImage = await loadImage(mockupPath);
        const logoImage = await loadImage(logoBase64);

        const canvas = createCanvas(mockupImage.width, mockupImage.height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(mockupImage, 0, 0);

        // Escala do editor visual (400x500px) para o tamanho real do mockup
        const visualScale = mockupImage.width / 400;

        let logoX, logoY, logoWidth, logoHeight, rotation;

        if (design && design.x !== undefined) {
            // Usar valores customizados do editor
            logoX = design.x * visualScale;
            logoY = design.y * visualScale;
            logoWidth = design.width * visualScale;
            logoHeight = design.height * visualScale;
            rotation = design.rotation || 0;
            console.log(`[generate-mockup] Custom position: x=${logoX.toFixed(1)}, y=${logoY.toFixed(1)}, w=${logoWidth.toFixed(1)}, h=${logoHeight.toFixed(1)}, rot=${rotation}°`);
        } else {
            // Fallback: centralizado
            logoWidth = mockupImage.width * 0.35;
            logoHeight = (logoImage.height / logoImage.width) * logoWidth;
            logoX = (mockupImage.width - logoWidth) / 2;
            logoY = mockupImage.height * 0.25;
            rotation = 0;
            console.log(`[generate-mockup] Default centered position`);
        }

        ctx.save();

        if (rotation !== 0) {
            const centerX = logoX + logoWidth / 2;
            const centerY = logoY + logoHeight / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
        }

        ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
        ctx.restore();

        const compositeBase64 = canvas.toDataURL("image/png");

        console.log("[generate-mockup] Composition created. Sending to Replicate...");

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: "professional t-shirt product photography, studio lighting, realistic fabric texture, keep the original logo design exactly as is, photorealistic mockup, high quality, 8k",
                    negative_prompt: "distorted logo, changed design, different colors, blurry, low quality, deformed",
                    image: compositeBase64,
                    strength: 0.35,
                    refine: "expert_ensemble_refiner",
                    scheduler: "K_EULER",
                    lora_scale: 0.6,
                    num_inference_steps: 30,
                    guidance_scale: 8.5
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
