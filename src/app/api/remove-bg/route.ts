import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json(
                { status: 'error', message: 'Image is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.REMOVE_BG_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { status: 'error', message: 'Remove.bg API key not configured' },
                { status: 500 }
            );
        }

        // Convert base64 to blob if needed
        let imageData: string | Blob = image;

        if (image.startsWith('data:')) {
            // Extract base64 data
            const base64Data = image.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            imageData = new Blob([buffer]);
        }

        // Create form data for Remove.bg API
        const formData = new FormData();

        if (typeof imageData === 'string') {
            // If it's a URL
            formData.append('image_url', imageData);
        } else {
            // If it's a blob/file
            formData.append('image_file', imageData);
        }

        formData.append('size', 'auto');

        // Call Remove.bg API
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': apiKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.errors?.[0]?.title || 'Failed to remove background');
        }

        // Get the result as a blob
        const resultBlob = await response.blob();

        // Convert blob to base64
        const arrayBuffer = await resultBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

        return NextResponse.json({
            status: 'success',
            image: base64Image,
        });

    } catch (error: any) {
        console.error('Error removing background:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: error.message || 'Failed to remove background'
            },
            { status: 500 }
        );
    }
}
