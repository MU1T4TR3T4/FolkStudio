"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, Save, Download, Type, Image as ImageIcon, Trash2, Undo, Redo, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Rnd } from "react-rnd";
import html2canvas from "html2canvas";
import { supabase } from "@/lib/supabase";
import "@/app/fonts.css";
import CropModal from "@/components/CropModal";

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
    originalSrc?: string; // Original image source for cropping reset
    cropData?: any; // Stored crop configuration (percent crop)
}

// Custom fonts from /public/Fontes/
const FONTS = [
    "Bebas Neue",
    "Montserrat Thin",
    "Montserrat ExtraLight",
    "Montserrat Light",
    "Montserrat",
    "Montserrat Medium",
    "Montserrat SemiBold",
    "Montserrat Bold",
    "Montserrat ExtraBold",
    "Montserrat Black",
];

// Internal component that uses useSearchParams
export function StudioContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Get mockup data from URL
    const mockupFromUrl = searchParams.get("mockup");
    const productTypeFromUrl = searchParams.get("productType");
    const colorFromUrl = searchParams.get("color");
    const editDesignId = searchParams.get("edit_design_id");
    const clientId = searchParams.get("client_id");

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
    const [lockAspectRatio, setLockAspectRatio] = useState(false); // Lock aspect ratio for resized images

    // Crop Modal State
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [croppingElementId, setCroppingElementId] = useState<string | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const designContainerRef = useRef<HTMLDivElement>(null);

    // Get selected element
    const selectedElement = elements.find(el => el.id === selectedElementId);

    // History management functions need to be defined before usage
    const addToHistory = (newElements: Element[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newElements);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // Calculate responsive canvas dimensions
    useEffect(() => {
        const calculateCanvasSize = () => {
            const windowWidth = window.innerWidth;
            const availableWidth = windowWidth - 256 - 64; // 64px for padding
            const newWidth = Math.min(Math.max(availableWidth, 600), 1000);
            const newHeight = newWidth / 2;
            setCanvasWidth(newWidth);
            setCanvasHeight(newHeight);
        };

        calculateCanvasSize();
        window.addEventListener('resize', calculateCanvasSize);
        return () => window.removeEventListener('resize', calculateCanvasSize);
    }, []);

    // Load design for editing
    useEffect(() => {
        if (!editDesignId) return;

        const loadDesign = async () => {
            const { data, error } = await supabase
                .from('designs')
                .select('*')
                .eq('id', editDesignId)
                .single();

            if (data) {
                console.log("Design carregado:", data);
                setMockupImage(data.mockup_image);
                setProductType(data.product_type);
                setColor(data.color);
                setElements(data.elements || []);
                setTimeout(() => setHistory([data.elements || []]), 100);
            } else {
                console.error("Design not found for editing", error);
            }
        };

        loadDesign();
    }, [editDesignId]);

    // Helper functions
    const pixelsToPercent = (pixels: number, canvasSize: number) => (pixels / canvasSize) * 100;
    const percentToPixels = (percent: number, canvasSize: number) => (percent / 100) * canvasSize;

    const measureTextSizing = (text: string, fontFamily: string, fontSize: number, fontWeight: string) => {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return { width: 200, height: 50 };
        context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        const metrics = context.measureText(text);
        return {
            width: Math.ceil(metrics.width + 40),
            height: Math.ceil(fontSize * 1.5)
        };
    };

    // Helper to get image dimensions
    const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.src = url;
        });
    };

    // Helper to convert URL to Base64
    const toBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    // Add text element
    const handleAddText = () => {
        const textStr = "Adicionar Texto";
        const fontFamily = "Inter";
        const fontSize = 24;
        const fontWeight = "normal";
        const { width, height } = measureTextSizing(textStr, fontFamily, fontSize, fontWeight);
        const x = 150;
        const y = 150;

        const newElement: Element = {
            id: crypto.randomUUID(),
            type: "text",
            x, y, width, height, rotation: 0,
            xPercent: pixelsToPercent(x, canvasWidth),
            yPercent: pixelsToPercent(y, canvasHeight),
            widthPercent: pixelsToPercent(width, canvasWidth),
            heightPercent: pixelsToPercent(height, canvasHeight),
            content: textStr,
            fontFamily, fontSize, fontWeight,
            fontStyle: "normal", textDecoration: "none",
            color: "#000000", textAlign: "center",
        };

        const newElements = [...elements, newElement];
        setElements(newElements);
        setSelectedElementId(newElement.id);
        addToHistory(newElements);
        toast.success("Texto adicionado!");
    };

    // Handle image upload (local file)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("A imagem deve ter no máximo 5MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = async () => {
                const imageUrl = reader.result as string;
                if (!uploadedImages.includes(imageUrl)) {
                    setUploadedImages(prev => [...prev, imageUrl]);
                }
                const { width: natWidth, height: natHeight } = await getImageDimensions(imageUrl);

                const MAX_SIZE = 300;
                let width = natWidth;
                let height = natHeight;
                if (width > MAX_SIZE || height > MAX_SIZE) {
                    const ratio = natWidth / natHeight;
                    if (natWidth > natHeight) { width = MAX_SIZE; height = width / ratio; }
                    else { height = MAX_SIZE; width = height * ratio; }
                }

                const x = 100;
                const y = 100;
                const newElement: Element = {
                    id: crypto.randomUUID(),
                    type: "image",
                    x, y, width, height, rotation: 0,
                    xPercent: pixelsToPercent(x, canvasWidth),
                    yPercent: pixelsToPercent(y, canvasHeight),
                    widthPercent: pixelsToPercent(width, canvasWidth),
                    heightPercent: pixelsToPercent(height, canvasHeight),
                    src: imageUrl,
                    originalSrc: imageUrl,
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
    const handleAddImageFromGallery = async (imageUrl: string) => {
        try {
            const base64Url = await toBase64(imageUrl).catch(() => imageUrl);
            const { width: natWidth, height: natHeight } = await getImageDimensions(base64Url);

            const MAX_SIZE = 300;
            let width = natWidth;
            let height = natHeight;
            if (width > MAX_SIZE || height > MAX_SIZE) {
                const ratio = natWidth / natHeight;
                if (natWidth > natHeight) { width = MAX_SIZE; height = width / ratio; }
                else { height = MAX_SIZE; width = height * ratio; }
            }

            const x = 150;
            const y = 150;
            const newElement: Element = {
                id: crypto.randomUUID(),
                type: "image",
                x, y, width, height, rotation: 0,
                xPercent: pixelsToPercent(x, canvasWidth),
                yPercent: pixelsToPercent(y, canvasHeight),
                widthPercent: pixelsToPercent(width, canvasWidth),
                heightPercent: pixelsToPercent(height, canvasHeight),
                src: base64Url,
                originalSrc: imageUrl,
            };

            const newElements = [...elements, newElement];
            setElements(newElements);
            setSelectedElementId(newElement.id);
            addToHistory(newElements);
            toast.success("Imagem adicionada da galeria!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao adicionar imagem da galeria");
        }
    };

    const updateElement = (id: string, updates: Partial<Element>) => {
        const newElements = elements.map(el => {
            if (el.id === id) {
                let updatedEl = { ...el, ...updates };
                if (el.type === 'text' && (updates.fontFamily || updates.fontSize || updates.fontWeight || updates.fontStyle || updates.content) && !updates.width && !updates.height) {
                    const { width, height } = measureTextSizing(updatedEl.content || "", updatedEl.fontFamily || "Inter", updatedEl.fontSize || 24, updatedEl.fontWeight || "normal");
                    updatedEl.width = width;
                    updatedEl.height = height;
                }
                if (updatedEl.x !== undefined || updatedEl.y !== undefined || updatedEl.width !== undefined || updatedEl.height !== undefined) {
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

    const handleDeleteSelected = () => {
        if (selectedElementId) {
            const newElements = elements.filter(el => el.id !== selectedElementId);
            setElements(newElements);
            setSelectedElementId(null);
            addToHistory(newElements);
            toast.success("Elemento removido!");
        }
    };

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

    const handleRemoveBackground = async () => {
        if (!selectedElementId) { toast.error("Selecione uma imagem primeiro"); return; }
        const element = elements.find(el => el.id === selectedElementId);
        if (!element || element.type !== "image" || !element.src) { toast.error("Selecione uma imagem para remover o fundo"); return; }

        setIsRemovingBg(true);
        toast.info("Removendo fundo da imagem...");
        try {
            const response = await fetch("/api/remove-bg", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: element.src }),
            });
            const data = await response.json();
            if (data.status === "success" && data.image) {
                const newElements = elements.map(el => el.id === selectedElementId ? { ...el, src: data.image } : el);
                setElements(newElements);
                addToHistory(newElements);
                toast.success("Fundo removido com sucesso!");
            } else { throw new Error(data.message || "Erro ao remover fundo"); }
        } catch (error: any) {
            console.error("Error removing background:", error);
            toast.error(error.message || "Erro ao remover fundo da imagem");
        } finally { setIsRemovingBg(false); }
    };

    const handleOpenCrop = (elementId: string, src: string) => {
        setCroppingElementId(elementId);
        setImageToCrop(src);
        setCropModalOpen(true);
    };

    const handleSaveCrop = (croppedImage: string, cropData: any) => {
        if (croppingElementId) {
            const element = elements.find(el => el.id === croppingElementId);
            if (element) {
                // Get new dimensions
                getImageDimensions(croppedImage).then(({ width: newWidth, height: newHeight }) => {
                    const currentWidth = element.width;
                    const ratio = newWidth / newHeight;
                    const newCalculatedHeight = currentWidth / ratio;

                    const newElements = elements.map(el => el.id === croppingElementId ? {
                        ...el,
                        src: croppedImage,
                        width: currentWidth,
                        height: newCalculatedHeight,
                        heightPercent: pixelsToPercent(newCalculatedHeight, canvasHeight),
                        cropData: cropData
                    } : el);

                    setElements(newElements);
                    addToHistory(newElements);
                    if (!uploadedImages.includes(croppedImage)) {
                        setUploadedImages(prev => [croppedImage, ...prev]);
                    }
                    setCropModalOpen(false);
                    setCroppingElementId(null);
                    setImageToCrop(null);
                    toast.success("Imagem recortada com sucesso!");
                });
            }
        }
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

    const generateFinalImage = async (): Promise<string | null> => {
        try {
            // 1. Get original background dimensions
            const bgImg = new Image();
            bgImg.crossOrigin = "anonymous";
            bgImg.src = mockupImage;
            await new Promise((resolve, reject) => {
                bgImg.onload = resolve;
                bgImg.onerror = reject;
            });

            const originalWidth = bgImg.naturalWidth;
            const originalHeight = bgImg.naturalHeight;

            // 2. Create off-screen canvas with FULL resolution
            const canvas = document.createElement("canvas");
            canvas.width = originalWidth;
            canvas.height = originalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Could not create canvas context");

            // 3. Draw Background
            ctx.drawImage(bgImg, 0, 0, originalWidth, originalHeight);

            // 4. Calculate scaling and offsets (Mimic background-size: cover)
            const imageAspect = originalWidth / originalHeight;
            const canvasAspect = canvasWidth / canvasHeight;

            let renderWidth, renderHeight;
            let offsetX = 0, offsetY = 0;

            if (imageAspect > canvasAspect) {
                // Image is wider than canvas (Horizontal crop)
                // Cover matches height
                renderHeight = originalHeight;
                renderWidth = originalHeight * canvasAspect;
                offsetX = (originalWidth - renderWidth) / 2;
            } else {
                // Image is taller than canvas (Vertical crop)
                // Cover matches width
                renderWidth = originalWidth;
                renderHeight = originalWidth / canvasAspect;
                offsetY = (originalHeight - renderHeight) / 2;
            }

            // Scale factor: Relation between "Virtual Rendered Width" and "Screen Canvas Width"
            const scaleFactor = renderWidth / canvasWidth;

            // 5. Draw Elements
            for (const el of elements) {
                // Apply Scale AND Offset
                const x = ((el.xPercent !== undefined) ? percentToPixels(el.xPercent, canvasWidth) : el.x) * scaleFactor + offsetX;
                const y = ((el.yPercent !== undefined) ? percentToPixels(el.yPercent, canvasHeight) : el.y) * scaleFactor + offsetY;
                const width = ((el.widthPercent !== undefined) ? percentToPixels(el.widthPercent, canvasWidth) : el.width) * scaleFactor;
                const height = ((el.heightPercent !== undefined) ? percentToPixels(el.heightPercent, canvasHeight) : el.height) * scaleFactor;

                ctx.save();

                // Translate to center of element for rotation
                ctx.translate(x + width / 2, y + height / 2);
                ctx.rotate((el.rotation * Math.PI) / 180);
                ctx.translate(-(x + width / 2), -(y + height / 2));

                if (el.type === "image" && el.src) {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = el.src;
                    await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; }); // Proceed even if fail to avoid crash
                    ctx.drawImage(img, x, y, width, height);
                } else if (el.type === "text" && el.content) {
                    const fontSize = (el.fontSize || 24) * scaleFactor;
                    ctx.font = `${el.fontStyle || "normal"} ${el.fontWeight || "normal"} ${fontSize}px ${el.fontFamily || "Inter"}`;
                    ctx.fillStyle = el.color || "#000000";
                    ctx.textAlign = (el.textAlign as CanvasTextAlign) || "center";
                    ctx.textBaseline = "middle"; // Vertical align

                    // Adjust Text Position: Rnd centers content, but fillText uses baseline/align
                    // We need to draw at the center of the bounding box
                    ctx.fillText(el.content, x + width / 2, y + height / 2.2); // 2.2 is a slight optical adjustment for middle

                    // Handle underline manually if needed (omitted for brevity unless requested)
                }

                ctx.restore();
            }

            return canvas.toDataURL("image/png", 1.0); // High quality
        } catch (error) {
            console.error("Erro ao gerar imagem de alta qualidade:", error);
            toast.error("Erro ao gerar imagem final.");
            return null;
        }
    };

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

    const handleSave = async () => {
        try {
            const finalImage = await generateFinalImage();
            if (!finalImage) { toast.error("Erro ao gerar imagem final"); return; }
            toast.info("Salvando design...");
            const base64Response = await fetch(finalImage);
            const blob = await base64Response.blob();
            const fileName = `design-${Date.now()}-${crypto.randomUUID()}.png`;
            const { data: uploadData, error: uploadError } = await supabase.storage.from('designs').upload(fileName, blob, { contentType: 'image/png', cacheControl: '3600' });
            if (uploadError) { console.error('Upload error:', uploadError); toast.error("Erro ao fazer upload da imagem."); return; }
            const { data: { publicUrl } } = supabase.storage.from('designs').getPublicUrl(fileName);

            // Get workspace user if available
            const workspaceUser = localStorage.getItem("folk_employee_user");

            if (editDesignId) {
                const { error } = await supabase.from('designs').update({
                    mockup_image: mockupImage, product_type: productType, color: color,
                    elements: elements, final_image_url: publicUrl,
                    created_by_user: workspaceUser || 'admin' // Default to admin for dashboard
                }).eq('id', editDesignId);
                if (error) throw error;
                toast.success("Design atualizado com sucesso!");
            } else {
                const { error } = await supabase.from('designs').insert({
                    mockup_image: mockupImage, product_type: productType, color: color,
                    elements: elements, final_image_url: publicUrl,
                    created_by_user: workspaceUser || 'admin'
                });
                if (error) throw error;
                toast.success("Design salvo com sucesso!");
            }

            if (clientId) { setTimeout(() => router.push(`/dashboard/clientes/${clientId}`), 1000); }
            else if (editDesignId) { setTimeout(() => router.push(`/dashboard/estampas`), 1000); }
        } catch (error) {
            console.error('Save error:', error);
            toast.error("Erro ao salvar design");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">Estúdio de Criação</h1>
                    <div className="text-sm text-gray-500">{productType} - {color}</div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleUndo} disabled={historyIndex === 0} variant="outline" size="sm"><Undo className="h-4 w-4" /></Button>
                    <Button onClick={handleRedo} disabled={historyIndex === history.length - 1} variant="outline" size="sm"><Redo className="h-4 w-4" /></Button>
                    <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm" className="ml-4"><ImageIcon className="h-4 w-4 mr-2" />Trocar Mockup</Button>
                    <Button onClick={handleSave} variant="outline" size="sm" className="ml-4"><Save className="h-4 w-4 mr-2" />Salvar</Button>
                    <Button onClick={handleDownload} size="sm" className="bg-[#7D4CDB] hover:bg-[#6b3bb5]"><Download className="h-4 w-4 mr-2" />Download</Button>
                </div>
            </div>

            {selectedElement && selectedElement.type === "text" && (
                <div className="w-full bg-white border-b border-gray-200 px-6 py-3">
                    <div className="flex items-center gap-6 justify-center flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Fonte:</label>
                            <select value={selectedElement.fontFamily} onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm min-w-[140px]">
                                {FONTS.map(font => (<option key={font} value={font} style={{ fontFamily: font }}>{font}</option>))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Tamanho:</label>
                            <input type="range" min="12" max="72" value={selectedElement.fontSize} onChange={(e) => updateElement(selectedElement.id, { fontSize: parseInt(e.target.value) })} className="w-32" />
                            <span className="text-sm text-gray-600 w-10">{selectedElement.fontSize}px</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Cor:</label>
                            <input type="color" value={selectedElement.color} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} className="w-12 h-8 rounded cursor-pointer border border-gray-300" />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Formatação:</label>
                            <div className="flex gap-1">
                                <button onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold" })} className={`px-3 py-1.5 rounded border ${selectedElement.fontWeight === "bold" ? "bg-[#7D4CDB] text-white border-[#7D4CDB]" : "bg-white border-gray-300 hover:bg-gray-50"}`} title="Negrito"><Bold className="h-4 w-4" /></button>
                                <button onClick={() => updateElement(selectedElement.id, { fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic" })} className={`px-3 py-1.5 rounded border ${selectedElement.fontStyle === "italic" ? "bg-[#7D4CDB] text-white border-[#7D4CDB]" : "bg-white border-gray-300 hover:bg-gray-50"}`} title="Itálico"><Italic className="h-4 w-4" /></button>
                                <button onClick={() => updateElement(selectedElement.id, { textDecoration: selectedElement.textDecoration === "underline" ? "none" : "underline" })} className={`px-3 py-1.5 rounded border ${selectedElement.textDecoration === "underline" ? "bg-[#7D4CDB] text-white border-[#7D4CDB]" : "bg-white border-gray-300 hover:bg-gray-50"}`} title="Sublinhado"><Underline className="h-4 w-4" /></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Alinhamento:</label>
                            <div className="flex gap-1">
                                <button onClick={() => updateElement(selectedElement.id, { textAlign: "left" })} className={`px-3 py-1.5 rounded border ${selectedElement.textAlign === "left" ? "bg-[#7D4CDB] text-white border-[#7D4CDB]" : "bg-white border-gray-300 hover:bg-gray-50"}`} title="Alinhar à esquerda"><AlignLeft className="h-4 w-4" /></button>
                                <button onClick={() => updateElement(selectedElement.id, { textAlign: "center" })} className={`px-3 py-1.5 rounded border ${selectedElement.textAlign === "center" ? "bg-[#7D4CDB] text-white border-[#7D4CDB]" : "bg-white border-gray-300 hover:bg-gray-50"}`} title="Centralizar"><AlignCenter className="h-4 w-4" /></button>
                                <button onClick={() => updateElement(selectedElement.id, { textAlign: "right" })} className={`px-3 py-1.5 rounded border ${selectedElement.textAlign === "right" ? "bg-[#7D4CDB] text-white border-[#7D4CDB]" : "bg-white border-gray-300 hover:bg-gray-50"}`} title="Alinhar à direita"><AlignRight className="h-4 w-4" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                <div className="w-64 min-w-[200px] max-w-[280px] bg-white border-r border-gray-200 p-4 space-y-4 overflow-y-auto flex-shrink-0">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Ferramentas</h3>
                        <div className="space-y-2">
                            <button onClick={handleAddText} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                <Type className="h-5 w-5 text-gray-700" />
                                <span className="text-sm font-medium text-gray-900">Adicionar Texto</span>
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                <ImageIcon className="h-5 w-5 text-gray-700" />
                                <span className="text-sm font-medium text-gray-900">Adicionar Imagem</span>
                            </button>
                            {selectedElementId && (
                                <>
                                    <button onClick={handleDuplicateElement} className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                        <Copy className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-900">Duplicar</span>
                                    </button>
                                    {selectedElement?.type === "image" && (
                                        <button onClick={handleRemoveBackground} disabled={isRemovingBg} className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Eraser className="h-5 w-5 text-purple-600" />
                                            <span className="text-sm font-medium text-purple-900">{isRemovingBg ? "Removendo..." : "Remover Fundo"}</span>
                                        </button>
                                    )}
                                    <button onClick={handleDeleteSelected} className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
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
                                <div key={el.id} onClick={() => setSelectedElementId(el.id)} className={`px-3 py-2 rounded cursor-pointer text-sm ${selectedElementId === el.id ? "bg-[#7D4CDB] text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}>
                                    {el.type === "text" ? `📝 ${el.content?.substring(0, 20)}` : "🖼️ Imagem"}
                                </div>
                            ))}
                        </div>
                    </div>

                    {uploadedImages.length > 0 && (
                        <div className="pt-4 border-t border-gray-200">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Galeria de Imagens ({uploadedImages.length})</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {uploadedImages.map((img, index) => (
                                    <div key={index} onClick={() => handleAddImageFromGallery(img)} className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#7D4CDB] transition-all bg-white" title="Clique para adicionar ao canvas">
                                        <img src={img} alt={`Imagem ${index + 1}`} className="w-full h-20 object-cover" />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                            <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                    <div ref={designContainerRef} className="relative shadow-2xl" style={{ width: canvasWidth, height: canvasHeight, maxWidth: '100%' }}>
                        {mockupImage && (
                            <div className="absolute inset-0 w-full h-full pointer-events-none" style={{ backgroundImage: `url('${mockupImage}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />
                        )}

                        <div className="absolute inset-0">
                            {elements.map((el) => {
                                const dynamicX = (el.xPercent !== undefined) ? percentToPixels(el.xPercent, canvasWidth) : el.x;
                                const dynamicY = (el.yPercent !== undefined) ? percentToPixels(el.yPercent, canvasHeight) : el.y;
                                const dynamicWidth = (el.widthPercent !== undefined) ? percentToPixels(el.widthPercent, canvasWidth) : el.width;
                                const dynamicHeight = (el.heightPercent !== undefined) ? percentToPixels(el.heightPercent, canvasHeight) : el.height;

                                return (
                                    <Rnd
                                        key={el.id}
                                        size={{ width: dynamicWidth, height: dynamicHeight }}
                                        position={{ x: dynamicX, y: dynamicY }}
                                        lockAspectRatio={el.type === 'image' ? lockAspectRatio : false}
                                        onResizeStart={(e, dir) => { if (el.type === 'image') setLockAspectRatio(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].includes(dir)); }}
                                        onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                                        onResizeStop={(e, direction, ref, delta, position) => { setLockAspectRatio(false); updateElement(el.id, { width: parseInt(ref.style.width), height: parseInt(ref.style.height), ...position }); }}
                                        onClick={() => setSelectedElementId(el.id)}
                                        bounds="parent"
                                        className={`${selectedElementId === el.id ? "ring-2 ring-[#7D4CDB]" : ""} ${el.type === 'image' ? 'overflow-hidden' : ''}`}
                                    >
                                        {el.type === "text" && (
                                            <div onDoubleClick={() => setIsEditingText(true)} style={{ fontFamily: el.fontFamily, fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle, textDecoration: el.textDecoration, color: el.color, textAlign: el.textAlign as any, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "move", userSelect: "none" }}>
                                                {isEditingText && selectedElementId === el.id ? (
                                                    <input type="text" value={el.content} onChange={(e) => updateElement(el.id, { content: e.target.value })} onBlur={() => { setIsEditingText(false); if (el.content) { const { width, height } = measureTextSizing(el.content, el.fontFamily || "Inter", el.fontSize || 24, el.fontWeight || "normal"); updateElement(el.id, { width, height }); } }} autoFocus className="w-full h-full text-center bg-transparent border-none outline-none" style={{ fontFamily: el.fontFamily, fontSize: el.fontSize, fontWeight: el.fontWeight, fontStyle: el.fontStyle, textDecoration: el.textDecoration, color: el.color }} />
                                                ) : (el.content)}
                                            </div>
                                        )}
                                        {el.type === "image" && el.src && (
                                            <div className="w-full h-full" onDoubleClick={() => handleOpenCrop(el.id, el.originalSrc || el.src!)}>
                                                <img src={el.src} alt="Element" crossOrigin="anonymous" className="w-full h-full object-fill pointer-events-none" />
                                            </div>
                                        )}
                                    </Rnd>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {imageToCrop && (
                <CropModal isOpen={cropModalOpen} onClose={() => setCropModalOpen(false)} imageSrc={imageToCrop} onSave={handleSaveCrop} initialCrop={selectedElement?.cropData} />
            )}

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        </div>
    );
}

export default function CanvaEditorPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-50"><div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D4CDB] mb-4"></div><p className="text-lg text-gray-600">Carregando estúdio...</p></div></div>}>
            <StudioContent />
        </Suspense>
    );
}
