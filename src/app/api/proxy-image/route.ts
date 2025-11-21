import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const blob = await response.blob();
        const headers = new Headers();
        headers.set("Content-Type", blob.type);
        headers.set("Cache-Control", "public, max-age=3600");

        return new NextResponse(blob, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
    }
}
