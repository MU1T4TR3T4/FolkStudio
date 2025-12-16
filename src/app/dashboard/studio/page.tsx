"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, Save, Download, Type, Image as ImageIcon, Trash2, Undo, Redo, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Rnd } from "react-rnd";
import { supabase } from "@/lib/supabase";

interface Element {
    id: string;
    type: "text" | "image";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    // Percentage-based positions (0-100) for fixed positioning
    xPercent?: number;
    yPercent?: number;
    widthPercent?: number;
    heightPercent?: number;
    // Text properties
    content?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    color?: string;
    textAlign?: string;
    // Image properties
    src?: string;
}

// Popular fonts
const FONTS = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Montserrat",
    "Poppins",
    "Playfair Display",
    "Merriweather",
    "Lora",
    "Bebas Neue",
    "Oswald",
    "Raleway",
    "Pacifico",
];

// Internal component that uses useSearchParams
function StudioContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Get mockup data from URL
    const mockupFromUrl = searchParams.get("mockup");
    const productTypeFromUrl = searchParams.get("productType");
    const colorFromUrl = searchParams.get("color");

    // State
    const [mockupImage, setMockupImage] = useState<string>(mockupFromUrl || "");
    const [productType, setProductType] = useState<string>(productTypeFromUrl || "");
    const [color, setColor] = useState<string>(colorFromUrl || "");
    const [elements, setElements] = useState<Element[]>([]);
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [history, setHistory] = useState<Element[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isEditingText, setIsEditingText] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(1000);
    const [canvasHeight, setCanvasHeight] = useState(500);
    const [isRemovingBg, setIsRemovingBg] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]); // Gallery of uploaded images

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get selected element
    const selectedElement = elements.find(el => el.id === selectedElementId);

    // Calculate responsive canvas dimensions
    useEffect(() => {
        const calculateCanvasSize = () => {
            const windowWidth = window.innerWidth;
            // Subtract left sidebar width (256px) - canvas always uses full available width
            const availableWidth = windowWidth - 256 - 64; // 64px for padding

            // Set max width to 1000px, min to 600px
            const newWidth = Math.min(Math.max(availableWidth, 600), 1000);
            // Maintain 2:1 aspect ratio
            const newHeight = newWidth / 2;

            setCanvasWidth(newWidth);
            setCanvasHeight(newHeight);
        };

        calculateCanvasSize();
        window.addEventListener('resize', calculateCanvasSize);

        return () => window.removeEventListener('resize', calculateCanvasSize);
    }, []); // Removed selectedElement dependency

    // Helper functions for percentage-based positioning
    const pixelsToPercent = (pixels: number, canvasSize: number) => {
        return (pixels / canvasSize) * 100;
    };

    const percentToPixels = (percent: number, canvasSize: number) => {
        return (percent / 100) * canvasSize;
    };

    // Recalculate element positions when canvas size changes
    useEffect(() => {
        if (elements.length > 0) {
            const updatedElements = elements.map(el => {
                // If element has percentage positions, recalculate pixel positions
                if (el.xPercent !== undefined && el.yPercent !== undefined &&
                    el.widthPercent !== undefined && el.heightPercent !== undefined) {
                    return {
                        ...el,
                        x: percentToPixels(el.xPercent, canvasWidth),
                        y: percentToPixels(el.yPercent, canvasHeight),
                        width: percentToPixels(el.widthPercent, canvasWidth),
                        height: percentToPixels(el.heightPercent, canvasHeight),
                    };
                }
                return el;
            });

            // Only update if positions actually changed
            const positionsChanged = updatedElements.some((el, index) =>
                el.x !== elements[index].x || el.y !== elements[index].y ||
                el.width !== elements[index].width || el.height !== elements[index].height
            );

            if (positionsChanged) {
                setElements(updatedElements);
            }
        }
    }, [canvasWidth, canvasHeight]);

    // Add text element
    const handleAddText = () => {
        const x = 150;
        const y = 150;
        const width = 200;
        const height = 50;

        const newElement: Element = {
            id: crypto.randomUUID(),
            type: "text",
            x,
            y,
            width,
            height,
            rotation: 0,
            // Store percentage-based positions
            xPercent: pixelsToPercent(x, canvasWidth),
            yPercent: pixelsToPercent(y, canvasHeight),
            widthPercent: pixelsToPercent(width, canvasWidth),
            heightPercent: pixelsToPercent(height, canvasHeight),
            content: "Adicionar Texto",
            fontFamily: "Inter",
            fontSize: 24,
            fontWeight: "normal",
            fontStyle: "normal",
            textDecoration: "none",
            color: "#000000",
            textAlign: "center",
        };

        const newElements = [...elements, newElement];
        setElements(newElements);
        setSelectedElementId(newElement.id);
        addToHistory(newElements);
        toast.success("Texto adicionado!");
    };

    // Handle image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("A imagem deve ter no máximo 5MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const imageUrl = reader.result as string;

                // Add to gallery if not already there
                if (!uploadedImages.includes(imageUrl)) {
                    setUploadedImages(prev => [...prev, imageUrl]);
                }

                const x = 100;
                const y = 100;
                const width = 200;
                const height = 200;

                const newElement: Element = {
                    id: crypto.randomUUID(),
                    type: "image",
                    x,
                    y,
                    width,
                    height,
                    rotation: 0,
                    // Store percentage-based positions
                    xPercent: pixelsToPercent(x, canvasWidth),
                    yPercent: pixelsToPercent(y, canvasHeight),
                    widthPercent: pixelsToPercent(width, canvasWidth),
                    heightPercent: pixelsToPercent(height, canvasHeight),
                    src: imageUrl,
                };

                const newElements = [...elements, newElement];
                setElements(newElements);
                setSelectedElementId(newElement.id);
                addToHistory(newElements);
                toast.success("Imagem adicionada!");
            };
            reader.readAsDataURL(file);
        }
    };

    // Add image from gallery
    const handleAddImageFromGallery = (imageUrl: string) => {
        const x = 150;
        const y = 150;
        const width = 200;
        const height = 200;

        const newElement: Element = {
            id: crypto.randomUUID(),
            type: "image",
            x,
            y,
            width,
            height,
            rotation: 0,
            // Store percentage-based positions
            xPercent: pixelsToPercent(x, canvasWidth),
            yPercent: pixelsToPercent(y, canvasHeight),
            widthPercent: pixelsToPercent(width, canvasWidth),
            heightPercent: pixelsToPercent(height, canvasHeight),
            src: imageUrl,
        };

        const newElements = [...elements, newElement];
        setElements(newElements);
        setSelectedElementId(newElement.id);
        addToHistory(newElements);
        toast.success("Imagem adicionada da galeria!");
    };

    // Update element
    const updateElement = (id: string, updates: Partial<Element>) => {
        const newElements = elements.map(el => {
            if (el.id === id) {
                const updatedEl = { ...el, ...updates };

                // Recalculate percentages if position or size changed
                if (updates.x !== undefined || updates.y !== undefined ||
                    updates.width !== undefined || updates.height !== undefined) {
                    updatedEl.xPercent = pixelsToPercent(updatedEl.x, canvasWidth);
                    updatedEl.yPercent = pixelsToPercent(updatedEl.y, canvasHeight);
                    updatedEl.widthPercent = pixelsToPercent(updatedEl.width, canvasWidth);
                    updatedEl.heightPercent = pixelsToPercent(updatedEl.height, canvasHeight);
                }

                return updatedEl;
            }
            return el;
        });
        setElements(newElements);
        addToHistory(newElements);
    };

    // Delete selected element
    const handleDeleteSelected = () => {
        if (selectedElementId) {
            const newElements = elements.filter(el => el.id !== selectedElementId);
            setElements(newElements);
            setSelectedElementId(null);
            addToHistory(newElements);
            toast.success("Elemento removido!");
        }
    };

    // Duplicate selected element
    const handleDuplicateElement = () => {
        if (selectedElementId) {
            const elementToDuplicate = elements.find(el => el.id === selectedElementId);
            if (elementToDuplicate) {
                const duplicatedElement: Element = {
                    ...elementToDuplicate,
                    id: crypto.randomUUID(),
                    x: elementToDuplicate.x + 20,
                    y: elementToDuplicate.y + 20,
                };
                const newElements = [...elements, duplicatedElement];
                setElements(newElements);
                setSelectedElementId(duplicatedElement.id);
                addToHistory(newElements);
                toast.success("Elemento duplicado!");
            }
        }
    };

    // Remove background from selected image
    const handleRemoveBackground = async () => {
        if (!selectedElementId) {
            toast.error("Selecione uma imagem primeiro");
            return;
        }

        const element = elements.find(el => el.id === selectedElementId);
        if (!element || element.type !== "image" || !element.src) {
            toast.error("Selecione uma imagem para remover o fundo");
            return;
        }

        setIsRemovingBg(true);
        toast.info("Removendo fundo da imagem...");

        try {
            const response = await fetch("/api/remove-bg", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    image: element.src,
                }),
            });

            const data = await response.json();

            if (data.status === "success" && data.image) {
                // Update element with background removed
                const newElements = elements.map(el =>
                    el.id === selectedElementId
                        ? { ...el, src: data.image }
                        : el
                );
                setElements(newElements);
                addToHistory(newElements);
                toast.success("Fundo removido com sucesso!");
            } else {
                throw new Error(data.message || "Erro ao remover fundo");
            }
        } catch (error: any) {
            console.error("Error removing background:", error);
            toast.error(error.message || "Erro ao remover fundo da imagem");
        } finally {
            setIsRemovingBg(false);
        }
    };


    // History management
    const addToHistory = (newElements: Element[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newElements);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setElements(history[historyIndex - 1]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setElements(history[historyIndex + 1]);
        }
    };

    // Generate final image
    const generateFinalImage = async (): Promise<string | null> => {
        if (!canvasRef.current || !mockupImage) return null;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });

        try {
            const mockupImg = await loadImage(mockupImage);

            const TARGET_WIDTH = 1200;
            const TARGET_HEIGHT = 1500;
            canvas.width = TARGET_WIDTH;
            canvas.height = TARGET_HEIGHT;

            // Draw mockup
            ctx.drawImage(mockupImg, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);

            const visualScale = canvas.width / canvasWidth; // Use current canvas width

            // Draw all elements
            for (const element of elements) {
                ctx.save();

                const centerX = (element.x + element.width / 2) * visualScale;
                const centerY = (element.y + element.height / 2) * visualScale;

                ctx.translate(centerX, centerY);
                ctx.rotate((element.rotation * Math.PI) / 180);
                ctx.translate(-centerX, -centerY);

                if (element.type === "image" && element.src) {
                    const img = await loadImage(element.src);
                    ctx.drawImage(
                        img,
                        element.x * visualScale,
                        element.y * visualScale,
                        element.width * visualScale,
                        element.height * visualScale
                    );
                } else if (element.type === "text" && element.content) {
                    ctx.font = `${element.fontStyle} ${element.fontWeight} ${element.fontSize! * visualScale}px ${element.fontFamily}`;
                    ctx.fillStyle = element.color!;
                    ctx.textAlign = element.textAlign as CanvasTextAlign;
                    ctx.textBaseline = "middle";

                    const textX = (element.x + element.width / 2) * visualScale;
                    const textY = (element.y + element.height / 2) * visualScale;

                    ctx.fillText(element.content, textX, textY);
                }

                ctx.restore();
            }

            return canvas.toDataURL("image/png");
        } catch (error) {
            console.error("Erro ao gerar imagem:", error);
            toast.error("Erro ao gerar imagem final.");
            return null;
        }
    };

    // Download
    const handleDownload = async () => {
        const dataUrl = await generateFinalImage();
        if (dataUrl) {
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `mockup-${productType}-${color}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Download iniciado!");
        }
    };

    // Save
    const handleSave = async () => {
        try {
            const finalImage = await generateFinalImage();
            if (!finalImage) {
                toast.error("Erro ao gerar imagem final");
                return;
            }

            toast.info("Salvando design...");

            // Convert base64 to blob
            const base64Response = await fetch(finalImage);
            const blob = await base64Response.blob();

            // Generate unique filename
            const fileName = `design-${Date.now()}-${crypto.randomUUID()}.png`;

            // Upload image to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('designs')
                .upload(fileName, blob, {
                    contentType: 'image/png',
                    cacheControl: '3600',
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                // Fallback to localStorage if upload fails
                const design = {
                    id: crypto.randomUUID(),
                    mockupImage,
                    productType,
                    color,
                    elements,
                    finalImage,
                    createdAt: new Date().toISOString(),
                };
                const saved = localStorage.getItem("folk_studio_designs");
                const designs = saved ? JSON.parse(saved) : [];
                designs.unshift(design);
                localStorage.setItem("folk_studio_designs", JSON.stringify(designs));
                toast.success("Design salvo localmente (offline)");
                return;
            }

            // Get public URL for the uploaded image
            const { data: { publicUrl } } = supabase.storage
                .from('designs')
                .getPublicUrl(fileName);

            // Save design metadata to database
            const { data: designData, error: dbError } = await supabase
                .from('designs')
                .insert({
                    mockup_image: mockupImage,
                    product_type: productType,
                    color: color,
                    elements: elements,
                    final_image_url: publicUrl,
                })
                .select()
                .single();

            if (dbError) {
                console.error('Database error:', dbError);
                // Fallback to localStorage
                const design = {
                    id: crypto.randomUUID(),
                    mockupImage,
                    productType,
                    color,
                    elements,
                    finalImage,
                    createdAt: new Date().toISOString(),
                };
                const saved = localStorage.getItem("folk_studio_designs");
                const designs = saved ? JSON.parse(saved) : [];
                designs.unshift(design);
                localStorage.setItem("folk_studio_designs", JSON.stringify(designs));
                toast.success("Design salvo localmente (offline)");
                return;
            }

            toast.success("Design salvo com sucesso no banco de dados!");
            console.log('Design saved:', designData);

        } catch (error) {
            console.error('Error saving design:', error);
            toast.error("Erro ao salvar design. Tente novamente.");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Hidden canvas for image generation */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />

            {/* Top Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">Estúdio de Criação</h1>
                    <div className="text-sm text-gray-500">
                        {productType} - {color}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={handleUndo}
                        disabled={historyIndex === 0}
                        variant="outline"
                        size="sm"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={handleRedo}
                        disabled={historyIndex === history.length - 1}
                        variant="outline"
                        size="sm"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                    >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Trocar Mockup
                    </Button>
                    <Button
                        onClick={handleSave}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                    </Button>
                    <Button
                        onClick={handleDownload}
                        size="sm"
                        className="bg-[#7D4CDB] hover:bg-[#6b3bb5]"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                </div>
            </div>

            {/* Horizontal Properties Bar - Only for text elements */}
            {selectedElement && selectedElement.type === "text" && (
                <div className="w-full bg-white border-b border-gray-200 px-6 py-3">
                    <div className="flex items-center gap-6 justify-center flex-wrap">
                        {/* Font Family */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Fonte:</label>
                            <select
                                value={selectedElement.fontFamily}
                                onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm min-w-[140px]"
                            >
                                {FONTS.map(font => (
                                    <option key={font} value={font} style={{ fontFamily: font }}>
                                        {font}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Font Size */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Tamanho:</label>
                            <input
                                type="range"
                                min="12"
                                max="72"
                                value={selectedElement.fontSize}
                                onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })}
                                className="w-32"
                            />
                            <span className="text-sm text-gray-600 w-10">{selectedElement.fontSize}px</span>
                        </div>

                        {/* Color */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Cor:</label>
                            <input
                                type="color"
                                value={selectedElement.color}
                                onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })}
                                className="w-12 h-8 rounded cursor-pointer border border-gray-300"
                            />
                        </div>

                        {/* Text Formatting */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Formatação:</label>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => updateElement(selectedElement.id, {
                                        fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold"
                                    })}
                                    className={`px-3 py-1.5 rounded border ${selectedElement.fontWeight === "bold"
                                        ? "bg-[#7D4CDB] text-white border-[#7D4CDB]"
                                        : "bg-white border-gray-300 hover:bg-gray-50"
                                        }`}
                                    title="Negrito"
                                >
                                    <Bold className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => updateElement(selectedElement.id, {
                                        fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic"
                                    })}
                                    className={`px-3 py-1.5 rounded border ${selectedElement.fontStyle === "italic"
                                        ? "bg-[#7D4CDB] text-white border-[#7D4CDB]"
                                        : "bg-white border-gray-300 hover:bg-gray-50"
                                        }`}
                                    title="Itálico"
                                >
                                    <Italic className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => updateElement(selectedElement.id, {
                                        textDecoration: selectedElement.textDecoration === "underline" ? "none" : "underline"
                                    })}
                                    className={`px-3 py-1.5 rounded border ${selectedElement.textDecoration === "underline"
                                        ? "bg-[#7D4CDB] text-white border-[#7D4CDB]"
                                        : "bg-white border-gray-300 hover:bg-gray-50"
                                        }`}
                                    title="Sublinhado"
                                >
                                    <Underline className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Text Alignment */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Alinhamento:</label>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => updateElement(selectedElement.id, { textAlign: "left" })}
                                    className={`px-3 py-1.5 rounded border ${selectedElement.textAlign === "left"
                                        ? "bg-[#7D4CDB] text-white border-[#7D4CDB]"
                                        : "bg-white border-gray-300 hover:bg-gray-50"
                                        }`}
                                    title="Alinhar à esquerda"
                                >
                                    <AlignLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => updateElement(selectedElement.id, { textAlign: "center" })}
                                    className={`px-3 py-1.5 rounded border ${selectedElement.textAlign === "center"
                                        ? "bg-[#7D4CDB] text-white border-[#7D4CDB]"
                                        : "bg-white border-gray-300 hover:bg-gray-50"
                                        }`}
                                    title="Centralizar"
                                >
                                    <AlignCenter className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => updateElement(selectedElement.id, { textAlign: "right" })}
                                    className={`px-3 py-1.5 rounded border ${selectedElement.textAlign === "right"
                                        ? "bg-[#7D4CDB] text-white border-[#7D4CDB]"
                                        : "bg-white border-gray-300 hover:bg-gray-50"
                                        }`}
                                    title="Alinhar à direita"
                                >
                                    <AlignRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Tools */}
                <div className="w-64 min-w-[200px] max-w-[280px] bg-white border-r border-gray-200 p-4 space-y-4 overflow-y-auto flex-shrink-0">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Ferramentas</h3>
                        <div className="space-y-2">
                            <button
                                onClick={handleAddText}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Type className="h-5 w-5 text-gray-700" />
                                <span className="text-sm font-medium text-gray-900">Adicionar Texto</span>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ImageIcon className="h-5 w-5 text-gray-700" />
                                <span className="text-sm font-medium text-gray-900">Adicionar Imagem</span>
                            </button>

                            {selectedElementId && (
                                <>
                                    <button
                                        onClick={handleDuplicateElement}
                                        className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        <Copy className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-900">Duplicar</span>
                                    </button>

                                    {selectedElement?.type === "image" && (
                                        <button
                                            onClick={handleRemoveBackground}
                                            disabled={isRemovingBg}
                                            className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Eraser className="h-5 w-5 text-purple-600" />
                                            <span className="text-sm font-medium text-purple-900">
                                                {isRemovingBg ? "Removendo..." : "Remover Fundo"}
                                            </span>
                                        </button>
                                    )}

                                    <button
                                        onClick={handleDeleteSelected}
                                        className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5 text-red-600" />
                                        <span className="text-sm font-medium text-red-900">Remover Selecionado</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Elementos ({elements.length})</h3>
                        <div className="space-y-1">
                            {elements.map((el) => (
                                <div
                                    key={el.id}
                                    onClick={() => setSelectedElementId(el.id)}
                                    className={`px-3 py-2 rounded cursor-pointer text-sm ${selectedElementId === el.id
                                        ? "bg-[#7D4CDB] text-white"
                                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    {el.type === "text" ? `📝 ${el.content?.substring(0, 20)}` : "🖼️ Imagem"}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Image Gallery */}
                    {uploadedImages.length > 0 && (
                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Galeria de Imagens ({uploadedImages.length})</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.map((img, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleAddImageFromGallery(img)}
                                        className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#7D4CDB] transition-all bg-white"
                                        title="Clique para adicionar ao canvas"
                                    >
                                        <img
                                            src={img}
                                            alt={`Imagem ${index + 1}`}
                                            className="w-full h-20 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                            <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Center - Canvas */}
                <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                    <div className="relative shadow-2xl" style={{ width: canvasWidth, height: canvasHeight, maxWidth: '100%' }}>
                        {mockupImage && (
                            <img
                                src={mockupImage}
                                alt="Mockup"
                                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            />
                        )}

                        {/* Render elements with react-rnd */}
                        <div className="absolute inset-0">
                            {elements.map((el) => (
                                <Rnd
                                    key={el.id}
                                    size={{ width: el.width, height: el.height }}
                                    position={{ x: el.x, y: el.y }}
                                    onDragStop={(e, d) => {
                                        updateElement(el.id, { x: d.x, y: d.y });
                                    }}
                                    onResizeStop={(e, direction, ref, delta, position) => {
                                        updateElement(el.id, {
                                            width: parseInt(ref.style.width),
                                            height: parseInt(ref.style.height),
                                            ...position,
                                        });
                                    }}
                                    onClick={() => setSelectedElementId(el.id)}
                                    bounds="parent"
                                    className={`${selectedElementId === el.id ? "ring-2 ring-[#7D4CDB]" : ""
                                        }`}
                                >
                                    {el.type === "text" && (
                                        <div
                                            onDoubleClick={() => setIsEditingText(true)}
                                            style={{
                                                fontFamily: el.fontFamily,
                                                fontSize: el.fontSize,
                                                fontWeight: el.fontWeight,
                                                fontStyle: el.fontStyle,
                                                textDecoration: el.textDecoration,
                                                color: el.color,
                                                textAlign: el.textAlign as any,
                                                width: "100%",
                                                height: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "move",
                                                userSelect: "none",
                                            }}
                                        >
                                            {isEditingText && selectedElementId === el.id ? (
                                                <input
                                                    type="text"
                                                    value={el.content}
                                                    onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                                    onBlur={() => setIsEditingText(false)}
                                                    autoFocus
                                                    className="w-full h-full text-center bg-transparent border-none outline-none"
                                                    style={{
                                                        fontFamily: el.fontFamily,
                                                        fontSize: el.fontSize,
                                                        fontWeight: el.fontWeight,
                                                        fontStyle: el.fontStyle,
                                                        textDecoration: el.textDecoration,
                                                        color: el.color,
                                                    }}
                                                />
                                            ) : (
                                                el.content
                                            )}
                                        </div>
                                    )}
                                    {el.type === "image" && el.src && (
                                        <img
                                            src={el.src}
                                            alt="Element"
                                            className="w-full h-full object-contain pointer-events-none"
                                        />
                                    )}
                                </Rnd>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main exported component with Suspense boundary
export default function CanvaEditorPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D4CDB] mb-4"></div>
                    <p className="text-lg text-gray-600">Carregando estúdio...</p>
                </div>
            </div>
        }>
            <StudioContent />
        </Suspense>
    );
}
