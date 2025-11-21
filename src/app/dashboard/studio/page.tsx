"use client";

import { useState, useRef } from "react";
import { Upload, Wand2, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditableImage from "@/components/editor/EditableImage";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";

type TShirtModel = "short" | "long";
type TShirtColor = "white" | "black" | "blue";

export default function EditorPage() {
    const [image, setImage] = useState<string | null>(null);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [model, setModel] = useState<TShirtModel>("short");
    const [color, setColor] = useState<TShirtColor>("white");
    const router = useRouter();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("A imagem deve ter no máximo 5MB.");
                return;
            }
            const imageUrl = URL.createObjectURL(file);
            setImage(imageUrl);
            toast.success("Imagem carregada com sucesso!");
        }
    };

    const triggerUpload = () => {
        fileInputRef.current?.click();
    };

    const removeImage = () => {
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    async function handleGeneratePreview() {
        if (!image) {
            toast.error("Por favor, faça upload de uma estampa primeiro.");
            return;
        }

        setIsGenerating(true);
        setGeneratedUrl(null);

        try {
            const response = await fetch(image);
            const blob = await response.blob();
            const reader = new FileReader();

            const base64Image = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            const res = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: base64Image,
                    model,
                    color,
                }),
            });

            const data = await res.json();

            if (data.status === "success" && data.result?.url) {
                setGeneratedUrl(data.result.url);
                toast.success("Prévia gerada com sucesso!");
            } else {
                throw new Error(data.message || "Erro desconhecido na API.");
            }
        } catch (error) {
            console.error("Erro ao gerar prévia:", error);
            toast.error("Falha ao gerar a prévia. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleSaveOrder() {
        if (!generatedUrl || !image) return;

        try {
            const response = await fetch(image);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64Image = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            const res = await fetch("/api/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    previewUrl: generatedUrl,
                    designUrl: base64Image,
                    model,
                    color
                }),
            });

            const data = await res.json();
            if (data.status === "success") {
                toast.success("Pedido salvo com sucesso!");
                router.push("/dashboard/pedidos");
            } else {
                toast.error("Erro ao salvar pedido: " + data.message);
            }
        } catch (error) {
            toast.error("Erro ao salvar pedido.");
        }
    }

    const colorMap: Record<TShirtColor, string> = {
        white: "#ffffff",
        black: "#000000",
        blue: "#2563eb",
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
            <Toaster position="top-right" richColors />

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Editor de Camisetas</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                {/* Coluna Esquerda: Área de Pré-visualização */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex items-center justify-center relative overflow-hidden select-none">
                    <div className="relative w-full max-w-md aspect-[4/5]">
                        <img
                            src="https://via.placeholder.com/400x450"
                            alt="Mockup Camiseta"
                            className="w-full h-full object-contain opacity-90 pointer-events-none"
                        />

                        <div className="absolute top-[20%] left-[25%] w-[50%] h-[50%] border-2 border-dashed border-blue-200 bg-transparent overflow-hidden">
                            {image ? (
                                <EditableImage src={image} onDelete={removeImage} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                    <span className="text-xs text-blue-400 font-medium bg-white/80 px-2 py-1 rounded">
                                        Área da Estampa
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna Direita: Ferramentas */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6 overflow-y-auto">

                    {/* Upload */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900">Sua Arte</h3>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <div
                            onClick={triggerUpload}
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer hover:border-blue-400"
                        >
                            <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                                <Upload className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="text-sm text-gray-600 font-medium">Clique para fazer upload</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG (max. 5MB)</p>
                        </div>
                    </div>

                    {/* Configurações da Camiseta */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900">Modelo e Cor</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setModel("short")}
                                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${model === "short" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                            >
                                Manga Curta
                            </button>
                            <button
                                onClick={() => setModel("long")}
                                className={`px-3 py-2 text-sm font-medium rounded-md border transition-colors ${model === "long" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
                            >
                                Manga Longa
                            </button>
                        </div>
                        <div className="flex gap-3 pt-2">
                            {(Object.keys(colorMap) as TShirtColor[]).map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-10 h-10 rounded-full border-2 transition-all ${color === c ? "border-blue-600 scale-110 ring-2 ring-blue-100" : "border-gray-200 hover:scale-105"}`}
                                    style={{ backgroundColor: colorMap[c] }}
                                    title={c === "white" ? "Branco" : c === "black" ? "Preto" : "Azul"}
                                    aria-label={`Selecionar cor ${c}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Posição */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900">Posição da Estampa</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button className="px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                Frente
                            </button>
                            <button className="px-3 py-2 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
                                Costas
                            </button>
                            <button className="px-3 py-2 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
                                Manga Esq.
                            </button>
                            <button className="px-3 py-2 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
                                Manga Dir.
                            </button>
                        </div>
                    </div>

                    {/* Prévia Gerada */}
                    {generatedUrl && (
                        <div className="mt-4 border rounded-xl p-4 bg-gray-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-sm font-semibold mb-3 text-gray-900 flex items-center gap-2">
                                <Wand2 className="h-4 w-4 text-purple-600" />
                                Prévia Realista
                            </h3>
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
                                <img
                                    src={generatedUrl}
                                    alt="Prévia IA"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                Gerado por IA. Pode conter imperfeições.
                            </p>
                            <Button
                                onClick={handleSaveOrder}
                                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                            >
                                Salvar Pedido
                            </Button>
                        </div>
                    )}

                    <div className="flex-1"></div>

                    {/* Ações Finais */}
                    <div className="space-y-3 pt-6 border-t border-gray-100">
                        <Button
                            onClick={handleGeneratePreview}
                            disabled={isGenerating || !image}
                            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed h-11"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Gerando Prévia...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="h-4 w-4" />
                                    Gerar Prévia com IA
                                </>
                            )}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
