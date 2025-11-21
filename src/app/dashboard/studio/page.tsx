"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Wand2, ShoppingCart, Loader2, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditableImage, { DesignProps } from "@/components/editor/EditableImage";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";

type TShirtModel = "short" | "long";
type TShirtColor = "white" | "black" | "blue";

const MOCKUPS = {
    short: {
        white: "/mockups/camiseta-manga-curta-branca.png",
        black: "/mockups/camiseta-manga-curta-preta.png",
        blue: "/mockups/camiseta-manga-curta-azul.png",
    },
    long: {
        white: "/mockups/camiseta-manga-longa-branca.png",
        black: "/mockups/camiseta-manga-longa-preta.png",
        blue: "/mockups/camiseta-manga-longa-azul.png",
    },
};

export default function EditorPage() {
    const [image, setImage] = useState<string | null>(null);
    const [model, setModel] = useState<TShirtModel>("short");
    const [color, setColor] = useState<TShirtColor>("white");
    const [design, setDesign] = useState<DesignProps>({
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        rotation: 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [iaPreviewUrl, setIaPreviewUrl] = useState<string | null>(null);
    const [isGeneratingIA, setIsGeneratingIA] = useState(false);

    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Reset design position when image changes
    useEffect(() => {
        if (image) {
            setDesign({
                x: 100,
                y: 100,
                width: 200,
                height: 200,
                rotation: 0,
            });
        }
    }, [image]);

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

    const generateCanvasImage = async (): Promise<string | null> => {
        if (!canvasRef.current || !image) return null;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        const mockupSrc = MOCKUPS[model][color];

        // Carregar imagens
        const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });

        try {
            const [mockupImg, designImg] = await Promise.all([
                loadImage(mockupSrc),
                loadImage(image)
            ]);

            // Configurar canvas com tamanho do mockup
            canvas.width = mockupImg.width;
            canvas.height = mockupImg.height;

            // 1. Desenhar Mockup
            ctx.drawImage(mockupImg, 0, 0);

            // 2. Calcular proporção entre a tela de edição e o tamanho real da imagem do mockup
            // Simplificação: Vamos assumir um container base de referência de 400px de largura (tamanho visual aproximado)
            const visualScale = canvas.width / 400;

            // Salvar estado do contexto
            ctx.save();

            // Configurar transformação para a estampa
            const centerX = (design.x + design.width / 2) * visualScale;
            const centerY = (design.y + design.height / 2) * visualScale;

            ctx.translate(centerX, centerY);
            ctx.rotate((design.rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);

            // Configurar blend mode para realismo
            ctx.globalCompositeOperation = "multiply";

            // Desenhar estampa
            ctx.drawImage(
                designImg,
                design.x * visualScale,
                design.y * visualScale,
                design.width * visualScale,
                design.height * visualScale
            );

            // Restaurar contexto
            ctx.restore();

            return canvas.toDataURL("image/png");

        } catch (error) {
            console.error("Erro ao gerar canvas:", error);
            toast.error("Erro ao gerar imagem final.");
            return null;
        }
    };

    const handleDownload = async () => {
        if (!image) {
            toast.error("Adicione uma estampa primeiro.");
            return;
        }

        const dataUrl = await generateCanvasImage();
        if (dataUrl) {
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `camiseta-${model}-${color}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Download iniciado!");
        }
    };

    const handleSaveOrder = async () => {
        if (!image) {
            toast.error("Adicione uma estampa primeiro.");
            return;
        }

        setIsSaving(true);
        try {
            const finalImageUrl = iaPreviewUrl || await generateCanvasImage();

            if (!finalImageUrl) {
                throw new Error("Falha ao gerar imagem");
            }

            // Converter design original para base64 para salvar também
            const response = await fetch(image);
            const blob = await response.blob();
            const reader = new FileReader();
            const originalDesignBase64 = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            const res = await fetch("/api/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    previewUrl: finalImageUrl, // Usa a imagem da IA se existir, senão usa o Canvas
                    designUrl: originalDesignBase64,
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
            console.error(error);
            toast.error("Erro ao salvar pedido.");
        } finally {
            setIsSaving(false);
        }
    };

    async function handleGenerateIAMockup() {
        if (!image) {
            toast.error("Por favor, faça upload de uma estampa primeiro.");
            return;
        }

        setIsGeneratingIA(true);
        setIaPreviewUrl(null);

        try {
            // Converter imagem para Base64
            const response = await fetch(image);
            const blob = await response.blob();
            const reader = new FileReader();
            const base64Image = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });

            const res = await fetch("/api/generate-mockup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    logoBase64: base64Image,
                    modelo: model,
                    cor: color,
                }),
            });

            const data = await res.json();

            if (data.status === "success" && data.resultUrl) {
                setIaPreviewUrl(data.resultUrl);
                toast.success("Mockup realista gerado com sucesso!");
            } else {
                throw new Error(data.message || "Erro ao gerar mockup.");
            }
        } catch (error: any) {
            console.error("Erro IA:", error);
            toast.error("Falha na geração com IA: " + error.message);
        } finally {
            setIsGeneratingIA(false);
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

            {/* Canvas invisível para geração de imagem */}
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Estúdio de Criação</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                {/* Coluna Esquerda: Área de Edição */}
                <div className="lg:col-span-2 bg-gray-100 rounded-xl border border-gray-200 shadow-sm p-8 flex items-center justify-center relative overflow-hidden select-none">

                    {/* Container Visual da Camiseta - Tamanho fixo para referência de coordenadas */}
                    <div className="relative w-[400px] h-[500px] bg-white shadow-lg rounded-lg overflow-hidden">
                        {/* Mockup de Fundo */}
                        <img
                            src={MOCKUPS[model][color]}
                            alt="Mockup Camiseta"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                        />

                        {/* Área de Edição (Overlay) */}
                        <div className="absolute inset-0 z-20 overflow-hidden">
                            {image && (
                                <EditableImage
                                    src={image}
                                    design={design}
                                    onUpdate={setDesign}
                                    onDelete={removeImage}
                                />
                            )}
                        </div>

                        {!image && (
                            <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                                <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-gray-200 text-sm text-gray-500">
                                    Arraste sua arte aqui ou faça upload
                                </div>
                            </div>
                        )}
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

                    {/* Prévia Gerada por IA */}
                    {iaPreviewUrl && (
                        <div className="mt-4 border rounded-xl p-4 bg-purple-50 animate-in fade-in slide-in-from-bottom-4 duration-500 border-purple-100">
                            <h3 className="text-sm font-semibold mb-3 text-purple-900 flex items-center gap-2">
                                <Wand2 className="h-4 w-4 text-purple-600" />
                                Mockup Realista (IA)
                            </h3>
                            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-purple-200 bg-white">
                                <img
                                    src={iaPreviewUrl}
                                    alt="Mockup IA"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="flex gap-2 mt-3">
                                <Button
                                    onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = iaPreviewUrl;
                                        link.download = `mockup-ia-${model}-${color}.png`;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-100"
                                >
                                    <Download className="h-3 w-3 mr-2" />
                                    Baixar
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1"></div>

                    {/* Ações Finais */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                        <Button
                            onClick={handleGenerateIAMockup}
                            disabled={isGeneratingIA || !image}
                            className="w-full h-12 text-base flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md transition-all hover:scale-[1.02] rounded-xl"
                        >
                            {isGeneratingIA ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Criando Mágica...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="h-5 w-5" />
                                    Gerar Mockup Realista (IA)
                                </>
                            )}
                        </Button>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleDownload}
                                disabled={!image}
                                variant="outline"
                                className="w-full h-11 flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl"
                            >
                                <Download className="h-4 w-4" />
                                Baixar Imagem (PNG)
                            </Button>

                            <Button
                                onClick={handleSaveOrder}
                                disabled={isSaving || !image}
                                className="w-full h-11 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-xl"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Salvar no Dashboard
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
