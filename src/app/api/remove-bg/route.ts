import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        console.log("[remove-bg] Request received");

        if (!process.env.REMOVEBG_API_KEY) {
            return NextResponse.json(
                { status: "error", message: "REMOVEBG_API_KEY não configurado" },
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

        console.log("[remove-bg] Removing background with Remove.bg...");

        // Convert base64 to buffer
        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Create FormData
        const formData = new FormData();
        formData.append('image_file', new Blob([imageBuffer]), 'image.png');
        formData.append('size', 'auto');

        // Call Remove.bg API
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': process.env.REMOVEBG_API_KEY,
            },
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[remove-bg] Remove.bg API error:", response.status, errorText);
            throw new Error(`Remove.bg API error: ${response.status} - ${errorText}`);
        }

        console.log("[remove-bg] Background removed, converting to base64...");

        // Convert response to base64
        const arrayBuffer = await response.arrayBuffer();
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
