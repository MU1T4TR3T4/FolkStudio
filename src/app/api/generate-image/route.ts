import { NextResponse } from "next/server";
import Replicate from "replicate";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        console.log("[generate-image] Request received");

        // Verificar se o token está configurado
        if (!process.env.REPLICATE_API_TOKEN) {
            console.error("[generate-image] REPLICATE_API_TOKEN not configured");
            return NextResponse.json(
                {
                    status: "error",
                    message: "API token não configurado",
                    details: "REPLICATE_API_TOKEN missing"
                },
                { status: 500 }
            );
        }

        const replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN,
        });

        const body = await req.json();
        console.log("[generate-image] Request body:", JSON.stringify(body));

        const { image, model, color } = body;

        if (!image || !model || !color) {
            console.error("[generate-image] Missing required fields:", { image: !!image, model: !!model, color: !!color });
            return NextResponse.json(
                {
                    status: "error",
                    message: "Campos obrigatórios ausentes (imagem, modelo ou cor).",
                    details: { image: !!image, model: !!model, color: !!color }
                },
                { status: 400 }
            );
        }

        const modelText = model === "short" ? "short sleeve" : "long sleeve";

        const prompt = `Ultra realistic studio photo of a ${modelText} unisex t-shirt, ${color}, made of premium cotton, shown front view, with the uploaded design printed on the chest area. Soft professional studio lighting, natural fabric folds, accurate shadows. The print must appear perfectly integrated with the shirt texture, no glow, no distortions, no stretching. Background: clean neutral studio backdrop with soft gradient, no props, no mannequins, no people. Show only the t-shirt with realistic texture and colors.`;

        console.log("[generate-image] Calling Replicate with prompt:", prompt.substring(0, 100) + "...");

        // Usando black-forest-labs/flux-schnell
        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: prompt,
                    aspect_ratio: "1:1",
                    output_format: "jpg",
                    output_quality: 80,
                }
            }
        );

        console.log("[generate-image] Replicate response:", JSON.stringify(output));

        let imageUrl = "";
        if (Array.isArray(output)) {
            imageUrl = output[0];
        } else {
            imageUrl = String(output);
        }

        console.log("[generate-image] Generated image URL:", imageUrl);

        return NextResponse.json({
            status: "success",
            message: "Imagem gerada com sucesso.",
            result: { url: imageUrl }
        });

    } catch (err: any) {
        console.error("[generate-image] Error:", err);
        console.error("[generate-image] Error message:", err.message);
        console.error("[generate-image] Error stack:", err.stack);

        return NextResponse.json(
            {
                status: "error",
                message: "Falha ao processar a imagem com IA.",
                details: err.message || "Unknown error"
            },
            { status: 500 }
        );
    }
}
