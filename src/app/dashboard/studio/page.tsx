"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Wand2, ShoppingCart, Loader2, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditableImage, { DesignProps } from "@/components/editor/EditableImage";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";

type TShirtModel = "short" | "long";
type TShirtColor = "white" | "black" | "blue";
type TShirtSide = "front" | "back";

const MOCKUPS = {
    short: {
        white: {
            front: "/mockups/camiseta-manga-curta-branca-frente.png",
            back: "/mockups/camiseta-manga-curta-branca-costas.png"
        },
        black: {
            front: "/mockups/camiseta-manga-curta-preta-frente.png",
            back: "/mockups/camiseta-manga-curta-preta-costas.png"
        },
        blue: {
            front: "/mockups/camiseta-manga-curta-azul-frente.png",
            back: "/mockups/camiseta-manga-curta-azul-costas.png"
        },
    },
    long: {
        white: {
            front: "/mockups/camiseta-manga-longa-branca-frente.png",
            back: "/mockups/camiseta-manga-longa-branca-costas.png"
        },
        black: {
            front: "/mockups/camiseta-manga-longa-preta-frente.png",
            back: "/mockups/camiseta-manga-longa-preta-costas.png"
        },
        blue: {
            front: "/mockups/camiseta-manga-longa-azul-frente.png",
            back: "/mockups/camiseta-manga-longa-azul-costas.png"
        },
    },
};

export default function EditorPage() {
    // Imagens separadas para frente e costas
    const [imageFront, setImageFront] = useState<string | null>(null);
    const [imageBack, setImageBack] = useState<string | null>(null);
    const [model, setModel] = useState<TShirtModel>("short");
    const [color, setColor] = useState<TShirtColor>("white");
    const [side, setSide] = useState<TShirtSide>("front");
    const [designFront, setDesignFront] = useState<DesignProps>({
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        rotation: 0,
    });
    const [designBack, setDesignBack] = useState<DesignProps>({
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        rotation: 0,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingIA, setIsGeneratingIA] = useState(false);
    const [promptText, setPromptText] = useState<string>("");

    // Galerias de imagens
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

    // Computed properties baseados no lado atual
    const image = side === "front" ? imageFront : imageBack;
    const setImage = side === "front" ? setImageFront : setImageBack;
    const design = side === "front" ? designFront : designBack;
    const setDesign = side === "front" ? setDesignFront : setDesignBack;

    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Carregar históricos do LocalStorage ao iniciar
    useEffect(() => {
        const savedGenerated = localStorage.getItem("folk_studio_generated_designs");
        if (savedGenerated) setGeneratedImages(JSON.parse(savedGenerated));

        const savedUploads = localStorage.getItem("folk_studio_uploads");
        if (savedUploads) setUploadedImages(JSON.parse(savedUploads));
    }, []);

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

            const reader = new FileReader();
            reader.onloadend = () => {
                const imageUrl = reader.result as string;
                setImage(imageUrl);

                // Adicionar à galeria de uploads e salvar no LocalStorage
                const newUploads = [...uploadedImages, imageUrl];
                setUploadedImages(newUploads);
                localStorage.setItem("folk_studio_uploads", JSON.stringify(newUploads));

                toast.success("Imagem carregada com sucesso!");
            };
            reader.readAsDataURL(file);
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

        const mockupSrc = MOCKUPS[model][color][side];

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
            const finalImageUrl = await generateCanvasImage();

            if (!finalImageUrl) {
                throw new Error("Falha ao gerar imagem");
            }

            // Simular delay
            await new Promise(resolve => setTimeout(resolve, 500));

            const newOrder = {
                id: crypto.randomUUID(),
                imageUrl: finalImageUrl,
                color,
                material: "algodao", // Default
                sizes: { P: 0, M: 1, G: 0, GG: 0, XG: 0 }, // Default: 1 M
                totalQty: 1,
                observations: null,
                status: "Pendente",
                createdAt: new Date().toISOString(),
            };

            // Salvar no localStorage
            const savedOrders = localStorage.getItem("folk_studio_orders");
            const orders = savedOrders ? JSON.parse(savedOrders) : [];
            orders.unshift(newOrder);
            localStorage.setItem("folk_studio_orders", JSON.stringify(orders));

            toast.success("Pedido salvo com sucesso!");
            router.push("/dashboard/orders");

        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar pedido.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveStamp = async () => {
        if (!image) {
            toast.error("Adicione uma estampa primeiro.");
            return;
        }

        setIsSaving(true);
        try {
            // Gerar imagem da frente
            const currentSide = side;
            setSide("front");
            await new Promise(resolve => setTimeout(resolve, 100)); // Aguardar atualização do estado
            const frontImage = await generateCanvasImage();

            // Gerar imagem das costas
            setSide("back");
            await new Promise(resolve => setTimeout(resolve, 100));
            const backImage = await generateCanvasImage();

            // Restaurar lado original
            setSide(currentSide);

            if (!frontImage) {
                throw new Error("Falha ao gerar imagem da frente");
            }

            const newStamp = {
                id: crypto.randomUUID(),
                name: `Modelo ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
                frontImageUrl: frontImage,
                backImageUrl: backImage || null,
                createdAt: new Date().toISOString(),
            };

            // Salvar no localStorage
            const savedStamps = localStorage.getItem("folk_studio_stamps");
            const stamps = savedStamps ? JSON.parse(savedStamps) : [];
            stamps.unshift(newStamp);
            localStorage.setItem("folk_studio_stamps", JSON.stringify(stamps));

            toast.success("Modelo salvo com sucesso!");
            router.push("/dashboard/estampas");

        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar modelo.");
        } finally {
            setIsSaving(false);
        }
    };

    async function handleGenerateIAMockup() {
        if (!promptText.trim()) {
            toast.error("Por favor, descreva o design que você quer.");
            return;
        }

        setIsGeneratingIA(true);

        try {
            const res = await fetch("/api/generate-mockup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: promptText.trim()
                }),
            });

            const data = await res.json();

            if (data.status === "success" && data.generatedLogo) {
                // Adicionar à galeria de imagens geradas e salvar no LocalStorage
                const newGenerated = [...generatedImages, data.generatedLogo];
                setGeneratedImages(newGenerated);
                localStorage.setItem("folk_studio_generated_designs", JSON.stringify(newGenerated));

                // Carregar design gerado como imagem posicionável no lado atual
                setImage(data.generatedLogo);
                toast.success("Design gerado! Posicione no mockup.");
            } else {
                throw new Error(data.message || "Erro ao gerar design.");
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

                    {/* Toggle Frente/Costas */}
                    <div className="flex gap-2 mb-4 absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
                        <Button
                            onClick={() => setSide("front")}
                            variant={side === "front" ? "primary" : "outline"}
                            size="sm"
                        >
                            Frente
                        </Button>
                        <Button
                            onClick={() => setSide("back")}
                            variant={side === "back" ? "primary" : "outline"}
                            size="sm"
                        >
                            Costas
                        </Button>
                    </div>

                    {/* Container Visual da Camiseta - Tamanho fixo para referência de coordenadas */}
                    <div className="relative w-[400px] h-[500px] bg-white shadow-lg rounded-lg overflow-hidden">
                        {/* Mockup de Fundo */}
                        <img
                            src={MOCKUPS[model][color][side]}
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

                        {/* Galeria de Uploads */}
                        {uploadedImages.length > 0 && (
                            <div className="mt-3">
                                <h4 className="text-xs font-semibold text-gray-700 mb-2">Imagens Enviadas</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {uploadedImages.map((img, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setImage(img)}
                                            className={`aspect-square border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${image === img ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-400'
                                                }`}
                                        >
                                            <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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

                    {/* Geração com IA via Prompt */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900">Gerar Design com IA</h3>
                        <textarea
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            placeholder="Descreva o design que você quer na camiseta (ex: 'um dragão azul voando sobre montanhas', 'logo minimalista de café')"
                            className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500">
                            💡 A IA usará o modelo e cor selecionados acima
                        </p>

                        {/* Galeria de Imagens Geradas */}
                        {generatedImages.length > 0 && (
                            <div className="mt-3">
                                <h4 className="text-xs font-semibold text-gray-700 mb-2">Designs Gerados</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {generatedImages.map((img, index) => (
                                        <div
                                            key={index}
                                            onClick={() => setImage(img)}
                                            className={`aspect-square border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${image === img ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-400'
                                                }`}
                                        >
                                            <img src={img} alt={`Gerado ${index + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1"></div>

                    {/* Ações Finais */}
                    <div className="space-y-4 pt-6 border-t border-gray-100">
                        <Button
                            onClick={handleGenerateIAMockup}
                            disabled={isGeneratingIA || !promptText.trim()}
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
                                Baixar Modelo
                            </Button>

                            <Button
                                onClick={handleSaveStamp}
                                disabled={isSaving || !image}
                                className="w-full h-11 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-xl"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Salvar Modelo
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
