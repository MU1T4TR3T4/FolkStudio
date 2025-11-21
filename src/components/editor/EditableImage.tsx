"use client";

import React from "react";
import { Rnd } from "react-rnd";
import Image from "next/image";

export interface DesignProps {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

interface EditableImageProps {
    src: string;
    design: DesignProps;
    onUpdate: (newDesign: DesignProps) => void;
    onDelete: () => void;
}

export default function EditableImage({ src, design, onUpdate, onDelete }: EditableImageProps) {

    const handleRotate = (angle: number) => {
        onUpdate({ ...design, rotation: design.rotation + angle });
    };

    return (
        <Rnd
            size={{ width: design.width, height: design.height }}
            position={{ x: design.x, y: design.y }}
            onDragStop={(e, d) => {
                onUpdate({ ...design, x: d.x, y: d.y });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
                onUpdate({
                    ...design,
                    width: parseInt(ref.style.width),
                    height: parseInt(ref.style.height),
                    ...position,
                });
            }}
            bounds="parent"
            lockAspectRatio={true}
            className="z-20"
        >
            <div className="relative w-full h-full group border border-transparent hover:border-blue-400 transition-colors">

                {/* Wrapper interno para rotação */}
                <div
                    className="w-full h-full"
                    style={{
                        transform: `rotate(${design.rotation}deg)`,
                        transformOrigin: "center center",
                    }}
                >
                    <Image
                        src={src}
                        alt="Estampa"
                        fill
                        className="object-contain pointer-events-none"
                        style={{ mixBlendMode: 'multiply' }} // Efeito de estampa realista
                    />
                </div>

                {/* Botões de Rotação (visíveis no hover) */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-md rounded p-1 z-30">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRotate(-15);
                        }}
                        className="text-gray-700 hover:text-blue-600 px-2 py-1 text-xs font-bold"
                        title="Girar esquerda"
                    >
                        ↺
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRotate(15);
                        }}
                        className="text-gray-700 hover:text-blue-600 px-2 py-1 text-xs font-bold"
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
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-30"
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
