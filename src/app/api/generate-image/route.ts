import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { image, model, color } = body;

        if (!image || !model || !color) {
            return NextResponse.json(
                {
                    status: "error",
                    message: "Campos obrigatórios ausentes (imagem, modelo ou cor).",
                    result: null
                },
                { status: 400 }
            );
        }

        const modelText = model === "short" ? "short sleeve" : "long sleeve";

        const prompt = `Ultra realistic studio photo of a ${modelText} unisex t-shirt, ${color}, made of premium cotton, shown front view, with the uploaded design printed on the chest area. Soft professional studio lighting, natural fabric folds, accurate shadows. The print must appear perfectly integrated with the shirt texture, no glow, no distortions, no stretching. Background: clean neutral studio backdrop with soft gradient, no props, no mannequins, no people. Show only the t-shirt with realistic texture and colors.`;

        // Usando black-forest-labs/flux-schnell
        const output = await replicate.run(
            "black-forest-labs/flux-schnell",
            {
                input: {
                    prompt: prompt,
                    aspect_ratio: "1:1",
                    output_format: "jpg",
                    output_quality: 80,
                    // Tenta passar a imagem como referência se o modelo suportar no futuro ou para logging
                    // image: image 
                }
            }
        );

        let imageUrl = "";
        if (Array.isArray(output)) {
            imageUrl = output[0];
        } else {
            imageUrl = String(output);
        }

        return NextResponse.json({
            status: "success",
            message: "Imagem gerada com sucesso.",
            result: { url: imageUrl }
        });

    } catch (err) {
        console.error("Replicate Error:", err);
        return NextResponse.json(
            {
                status: "error",
                message: "Falha ao processar a imagem com IA.",
                result: null
            },
            { status: 500 }
        );
    }
}
