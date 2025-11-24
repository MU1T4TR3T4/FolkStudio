import { NextResponse } from "next/server";
import Replicate from "replicate";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
        // Usando Imagen 3 para gerar o design
        const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });

        // Construir prompt profissional baseado nas diretrizes de design
        const designPrompt = `T-shirt logo design: ${prompt}, vector style or vector-like appearance with clean defined lines, isolated design element, centered composition, white background, no text unless requested, high quality, detailed, suitable for printing, strong visual presence, modern and impactful, professional streetwear aesthetic, balanced composition, clear silhouettes, strong contrast, 8k`;

        console.log(`[generate-mockup] User input: "${prompt}"`);
        console.log(`[generate-mockup] Final prompt: "${designPrompt}"`);

        // Passo 1: Gerar design com Google Gen AI
        console.log("[generate-mockup] Calling Google Gen AI for design...");

        let designUrl = "";

        try {
            const result = await model.generateContent(designPrompt);
            const response = await result.response;

            const candidates = response.candidates;

            if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
                for (const part of candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        // Google retorna base64
                        designUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        break;
                    }
                }
            }

            if (!designUrl) {
                console.warn("[generate-mockup] No image data found in Google response");
                console.log("Full response:", JSON.stringify(response));
                throw new Error("Modelo Google não retornou dados de imagem válidos.");
            }

        } catch (genError: any) {
            console.error("[generate-mockup] Google Gen AI Error:", genError);
            throw genError;
        }

        console.log("[generate-mockup] Design generated, removing background...");
        console.log("[generate-mockup] Design URL length:", designUrl.length);

        // Passo 2: Remover fundo com rembg
        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        const transparentOutput = await replicate.run(
            "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
            {
                input: {
                    image: String(designUrl) // Garantir que é string
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
