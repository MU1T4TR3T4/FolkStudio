"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import MockupModal from "@/components/MockupModal";

// Product types configuration
const productTypes = [
    {
        id: "camiseta",
        name: "Camiseta",
        preview: "/mockups 2/cards/card camisetas.png",
        folder: "camisetas",
        previewPosition: "left" // Show only front view
    },
    {
        id: "polo",
        name: "Polo",
        preview: "/mockups 2/cards/card polo.png",
        folder: "polo",
        previewPosition: "left"
    },
    {
        id: "manga-longa",
        name: "Camisa Manga Longa",
        preview: "/mockups 2/cards/card camisa manga longa.png",
        folder: "camisa manga longa",
        previewPosition: "left"
    },
    {
        id: "regata",
        name: "Regata Cavada",
        preview: "/mockups 2/cards/card regata cavada.png",
        folder: "regata cavada",
        previewPosition: "left"
    },
    {
        id: "cropped",
        name: "Cropped",
        preview: "/mockups 2/cards/card cropped.png",
        folder: "cropped",
        previewPosition: "left"
    },
    {
        id: "bermuda",
        name: "Bermuda Sarja",
        preview: "/mockups 2/cards/card bermuda sarja.png",
        folder: "bermuda sarja",
        previewPosition: "center" // Bermuda doesn't have front/back
    },
];

// Mockup colors available for each product type
const mockupsByType: Record<string, string[]> = {
    camiseta: [
        "Amarelo Canário", "Amarelo Ouro", "Azul Bebê", "Azul Jade", "Azul Marinho", "Azul Royal",
        "Bordô", "Branca", "Camuflada", "Cinza Chumbo", "Cinza Mescla", "Cinza Médio",
        "Goiaba", "Laranja", "Lilás", "Marrom", "Off White", "Preta", "Preto Mescla",
        "Rosa Bebê", "Rosa Pink", "Roxo", "Verde Bandeira", "Verde Fluor", "Verde Folha",
        "Verde Musgo", "Vermelha",
    ],
    polo: [
        "Amarelo Canário", "Amarelo Ouro", "Azul Bebê", "Azul Jade", "Azul Marinho", "Azul Royal",
        "Bordô", "Branca", "Cinza Chumbo", "Cinza Mescla", "Cinza Médio", "Laranja", "Lilás",
        "Marrom", "Preta", "Preto Mescla", "Rosa Bebê", "Rosa Pink", "Roxo", "Verde Bandeira",
        "Verde Fluor", "Verde Folha", "Verde Musgo", "Vermelha",
    ],
    "manga-longa": [
        "Amarelo Canário", "Amarelo Ouro", "Azul Bebê", "Azul Bic", "Azul Jade", "Azul Marinho",
        "Bordô", "Branca", "Camuflada", "Cinza Chumbo", "Cinza Mescla", "Cinza Médio",
        "Laranja", "Lilás", "Marrom", "Off White", "Preta", "Preto Mescla", "Rosa Bebê",
        "Rosa Pink", "Roxo", "Verde Bandeira", "Verde Fluor", "Verde Folha", "Verde Musgo",
        "Vermelha",
    ],
    regata: ["Vermelha"],
    cropped: ["Vermelha"],
    bermuda: ["Bermuda Sarja Mockup Origem"],
};

interface MockupSelectorProps {
    basePath: string; // e.g., "/dashboard/studio" or "/workspace/studio"
}

export default function MockupSelector({ basePath }: MockupSelectorProps) {
    const [selectedType, setSelectedType] = useState("camiseta");
    const [selectedMockup, setSelectedMockup] = useState<{
        id: string;
        name: string;
        image: string;
    } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Get mockups based on selected type
    const getMockups = () => {
        const colors = mockupsByType[selectedType] || [];
        const folder = productTypes.find(t => t.id === selectedType)?.folder || "";

        return colors.map((color) => ({
            id: color,
            name: color,
            image: `/mockups 2/${folder}/${color}.png`,
        }));
    };

    const mockups = getMockups();

    const handleMockupClick = (mockup: { id: string; name: string; image: string }) => {
        setSelectedMockup(mockup);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedMockup(null), 200); // Clear after animation
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Selecionar Produto</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Escolha o tipo de produto e a cor para criar um pedido personalizado.
                    </p>
                </div>
            </div>

            {/* Product Type Selection Cards */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Produto</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {productTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={`group relative overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all hover:shadow-md ${selectedType === type.id
                                ? "border-[#7D4CDB] ring-2 ring-[#7D4CDB] ring-opacity-50"
                                : "border-gray-200 hover:border-[#7D4CDB]"
                                }`}
                        >
                            <div className="aspect-square w-full overflow-hidden bg-gray-50 relative">
                                <Image
                                    src={type.preview}
                                    alt={type.name}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    style={{
                                        objectPosition: type.previewPosition === "left" ? "25% center" : "center"
                                    }}
                                    priority={true}
                                />
                                {selectedType === type.id && (
                                    <div className="absolute inset-0 bg-[#7D4CDB]/10" />
                                )}
                            </div>
                            <div className="p-3">
                                <h3 className={`text-sm font-semibold text-center transition-colors ${selectedType === type.id ? "text-[#7D4CDB]" : "text-gray-900 group-hover:text-[#7D4CDB]"
                                    }`}>
                                    {type.name}
                                </h3>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Mockup Display */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Cores Disponíveis - {productTypes.find(t => t.id === selectedType)?.name}
                </h2>

                {mockups.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {mockups.map((mockup) => (
                            <div
                                key={mockup.id}
                                onClick={() => handleMockupClick(mockup)}
                                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-[#7D4CDB] cursor-pointer"
                            >
                                <div className="aspect-video w-full overflow-hidden bg-gray-50 relative">
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10" />
                                    <Image
                                        src={mockup.image}
                                        alt={mockup.name}
                                        fill
                                        sizes="(max-width: 640px) 100vw, 50vw"
                                        className="object-contain transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                        quality={85}
                                    />
                                </div>
                                <div className="p-3">
                                    <h3 className="text-sm font-medium text-gray-900 group-hover:text-[#7D4CDB] transition-colors text-center">
                                        {mockup.name}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm">
                            Mockups para {productTypes.find(t => t.id === selectedType)?.name} ainda não estão disponíveis.
                        </p>
                        <p className="text-gray-400 text-xs mt-2">
                            Em breve adicionaremos mais opções de produtos.
                        </p>
                    </div>
                )}
            </div>

            {/* Mockup Detail Modal */}
            <MockupModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                mockup={selectedMockup}
                productType={productTypes.find(t => t.id === selectedType)?.name || ""}
                basePath={basePath}
            />
        </div>
    );
}
