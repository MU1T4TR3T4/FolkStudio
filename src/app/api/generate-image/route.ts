import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        console.log("[generate-image] Request received");

        // Verificar se a API Key do Google está configurada
        if (!process.env.GOOGLE_API_KEY) {
            console.error("[generate-image] GOOGLE_API_KEY not configured");
            return NextResponse.json(
                {
                    status: "error",
                    message: "API Key do Google não configurada",
                    details: "GOOGLE_API_KEY missing"
                },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        // Usando o modelo Imagen 3 (ou o mais recente disponível para geração de imagem)
        // Se 'imagen-3.0-generate-001' falhar, pode ser necessário ajustar para o modelo correto liberado na conta
        const model = genAI.getGenerativeModel({ model: "imagen-3.0-generate-001" });

        const body = await req.json();
        console.log("[generate-image] Request body:", JSON.stringify(body));

        const { image, model: modelType, color } = body;

        if (!image || !modelType || !color) {
            console.error("[generate-image] Missing required fields:", { image: !!image, model: !!modelType, color: !!color });
            return NextResponse.json(
                {
                    status: "error",
                    message: "Campos obrigatórios ausentes (imagem, modelo ou cor).",
                    details: { image: !!image, model: !!modelType, color: !!color }
                },
                { status: 400 }
            );
        }

        const modelText = modelType === "short" ? "short sleeve" : "long sleeve";

        const prompt = `Ultra realistic studio photo of a ${modelText} unisex t-shirt, ${color}, made of premium cotton, shown front view, with the uploaded design printed on the chest area. Soft professional studio lighting, natural fabric folds, accurate shadows. The print must appear perfectly integrated with the shirt texture, no glow, no distortions, no stretching. Background: clean neutral studio backdrop with soft gradient, no props, no mannequins, no people. Show only the t-shirt with realistic texture and colors.`;

        console.log("[generate-image] Calling Google Gen AI with prompt:", prompt.substring(0, 100) + "...");

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;

            // O SDK do Google pode retornar a imagem de diferentes formas dependendo da versão/modelo
            // Geralmente vem em 'candidates' com 'inlineData' ou similar para imagens
            // Se o modelo retornar texto (erro comum se usar modelo de texto), lançamos erro

            console.log("[generate-image] Google response received");

            // TODO: Verificar estrutura exata da resposta para imagem no SDK atual
            // Assumindo que o generateContent para Imagen retorna a imagem em base64 ou link
            // Se não, precisaremos ajustar. Por enquanto, logamos a resposta para debug se falhar.

            // Nota: Para Imagen no Vertex AI, a resposta é diferente. No AI Studio, ainda é experimental.
            // Se falhar, o catch pegará.

            // Simulação de sucesso se o modelo não retornar imagem diretamente mas sim texto (para não quebrar o fluxo enquanto ajustamos)
            // Mas o objetivo é gerar imagem.

            // Se o response tiver parts com inlineData:
            const candidates = response.candidates;
            let imageUrl = "";

            if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
                for (const part of candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        break;
                    }
                }
            }

            if (!imageUrl) {
                // Fallback: Se o modelo retornou texto ou falhou em gerar imagem
                console.warn("[generate-image] No image data found in response, checking for text fallback or error");
                console.log("Full response:", JSON.stringify(response));
                throw new Error("Modelo não retornou dados de imagem válidos.");
            }

            console.log("[generate-image] Generated image URL (base64 length):", imageUrl.length);

            return NextResponse.json({
                status: "success",
                message: "Imagem gerada com sucesso.",
                result: { url: imageUrl }
            });

        } catch (genError: any) {
            console.error("[generate-image] Google Gen AI Error:", genError);
            throw genError;
        }

    } catch (err: any) {
        console.error("[generate-image] Error:", err);
        console.error("[generate-image] Error message:", err.message);

        return NextResponse.json(
            {
                status: "error",
                message: "Falha ao processar a imagem com IA (Google).",
                details: err.message || "Unknown error"
            },
            { status: 500 }
        );
    }
}
