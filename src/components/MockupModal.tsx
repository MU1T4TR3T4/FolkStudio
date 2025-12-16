"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface MockupModalProps {
    isOpen: boolean;
    onClose: () => void;
    mockup: {
        id: string;
        name: string;
        image: string;
    } | null;
    productType: string;
}

export default function MockupModal({ isOpen, onClose, mockup, productType }: MockupModalProps) {
    // Close modal on ESC key press
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mockup) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all hover:scale-110"
                    aria-label="Fechar"
                >
                    <X className="h-5 w-5 text-gray-700" />
                </button>

                <div className="flex flex-col md:flex-row">
                    {/* Image Section */}
                    <div className="flex-1 bg-gray-50 p-8 flex items-center justify-center">
                        <div className="relative w-full max-w-md aspect-square">
                            <img
                                src={mockup.image}
                                alt={mockup.name}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="w-full md:w-80 p-8 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {mockup.name}
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                {productType}
                            </p>

                            <div className="space-y-4">
                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                                        Detalhes do Produto
                                    </h3>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Mockup de alta qualidade</li>
                                        <li>• Pronto para personalização</li>
                                        <li>• Visualização realista</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3 mt-6">
                            <Link
                                href={`/dashboard/studio?mockup=${encodeURIComponent(mockup.image)}&productType=${encodeURIComponent(productType)}&color=${encodeURIComponent(mockup.name)}`}
                                className="block"
                            >
                                <Button className="w-full bg-[#7D4CDB] hover:bg-[#6b3bb5] text-white shadow-sm">
                                    Iniciar Edição
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="w-full border-gray-300 hover:bg-gray-50"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
