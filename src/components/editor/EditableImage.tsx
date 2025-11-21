"use client";

import React, { useState } from "react";
import { Rnd } from "react-rnd";
import Image from "next/image";

interface EditableImageProps {
    src: string;
    onDelete: () => void;
}

export default function EditableImage({ src, onDelete }: EditableImageProps) {
    const [rotation, setRotation] = useState(0);

    return (
        <Rnd
            default={{
                x: 50,
                y: 50,
                width: 200,
                height: 200,
            }}
            bounds="parent"
            lockAspectRatio={true}
        >
            <div className="relative w-full h-full group border border-transparent hover:border-blue-400 transition-colors">

                {/* Wrapper interno para rotação */}
                <div
                    className="w-full h-full"
                    style={{
                        transform: `rotate(${rotation}deg)`,
                        transformOrigin: "center center",
                    }}
                >
                    <Image
                        src={src}
                        alt="Estampa"
                        fill
                        className="object-contain pointer-events-none"
                    />
                </div>

                {/* Botões de Rotação (visíveis no hover) */}
                <div className="absolute -top-6 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setRotation(r => r - 15);
                        }}
                        className="bg-white text-gray-700 border border-gray-200 rounded px-1.5 py-0.5 text-xs hover:bg-gray-50 shadow-sm"
                        title="Girar esquerda"
                    >
                        ↺
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setRotation(r => r + 15);
                        }}
                        className="bg-white text-gray-700 border border-gray-200 rounded px-1.5 py-0.5 text-xs hover:bg-gray-50 shadow-sm"
                        title="Girar direita"
                    >
                        ↻
                    </button>
                </div>

                {/* Botão de Remover */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Remover"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                    </svg>
                </button>
            </div>
        </Rnd>
    );
}
