import { NextResponse } from "next/server";
import { createCanvas, loadImage } from "canvas";
import Replicate from "replicate";
import path from "path";
import fs from "fs";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type TShirtModel = "short" | "long";
type TShirtColor = "white" | "black" | "blue";

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
        const { logoBase64, modelo, cor, design, prompt } = body;

        if (!modelo || !cor) {
            return NextResponse.json(
                { status: "error", message: "Modelo e cor são obrigatórios" },
                { status: 400 }
            );
        }

        // Validar: precisa de prompt OU logo
        if (!prompt && !logoBase64) {
            return NextResponse.json(
                { status: "error", message: "Forneça um prompt ou faça upload de uma logo" },
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
        console.log(`[generate-mockup] Mode: ${prompt ? 'PROMPT (text2img)' : 'LOGO (img2img)'}`);

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        let compositeBase64: string = "";
        let output: any;

        if (prompt) {
            // MODO 1: Geração com Prompt (text2img)
            console.log(`[generate-mockup] User prompt: "${prompt}"`);

            const colorNames: Record<TShirtColor, string> = {
                white: "branca",
                black: "preta",
                blue: "azul"
            };

            const modelNames: Record<TShirtModel, string> = {
                short: "manga curta",
                long: "manga longa"
            };

            const finalPrompt = `${prompt} on a ${colorNames[cor as TShirtColor]} ${modelNames[modelo as TShirtModel]} t-shirt, professional product photography, studio lighting, centered design, high quality, 8k, photorealistic`;
            const negativePrompt = "blurry, low quality, distorted, deformed, bad anatomy, watermark, text, logo in corner";

            console.log(`[generate-mockup] Final prompt: "${finalPrompt}"`);

            output = await replicate.run(
                "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                {
                    input: {
                        prompt: finalPrompt,
                        negative_prompt: negativePrompt,
                        width: 1024,
                        height: 1024,
                        num_inference_steps: 30,
                        guidance_scale: 7.5,
                        scheduler: "K_EULER"
                    }
                } as any
            );
        } else {
            // MODO 2: Upload de Logo (img2img)
            console.log(`[generate-mockup] Design params:`, design);

            const mockupImage = await loadImage(mockupPath);
            const logoImage = await loadImage(logoBase64!);

            const canvas = createCanvas(mockupImage.width, mockupImage.height);
            const ctx = canvas.getContext("2d");

            ctx.drawImage(mockupImage, 0, 0);

            const visualScale = mockupImage.width / 400;

            let logoX, logoY, logoWidth, logoHeight, rotation;

            if (design && design.x !== undefined) {
                logoX = design.x * visualScale;
                logoY = design.y * visualScale;
                logoWidth = design.width * visualScale;
                logoHeight = design.height * visualScale;
                rotation = design.rotation || 0;
                console.log(`[generate-mockup] Custom position: x=${logoX.toFixed(1)}, y=${logoY.toFixed(1)}, w=${logoWidth.toFixed(1)}, h=${logoHeight.toFixed(1)}, rot=${rotation}°`);
            } else {
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

            compositeBase64 = canvas.toDataURL("image/png");

            console.log("[generate-mockup] Composition created. Sending to Replicate...");

            output = await replicate.run(
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
        }

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
