"use client";

import { useState, useEffect } from "react";
import { Trash2, Download, Plus, Image as ImageIcon, Wand2, Shirt, Eye, ShoppingBag, X, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { getImage } from "@/lib/storage";
import { supabase, Design } from "@/lib/supabase";

interface Stamp {
    id: string;
    name: string | null;
    frontImageUrl: string;
    backImageUrl: string | null;
    logoFrontUrl?: string | null;
    logoBackUrl?: string | null;
    createdAt: string;
    color?: string;
    model?: string;
    designFront?: { x: number; y: number; width: number; height: number; rotation: number } | null;
    designBack?: { x: number; y: number; width: number; height: number; rotation: number } | null;
}

export default function EstampasPage() {
    const [activeTab, setActiveTab] = useState<"designs" | "models" | "ai" | "uploads">("designs");
    const [designs, setDesigns] = useState<Design[]>([]);
    const [stamps, setStamps] = useState<Stamp[]>([]);
    const [generatedDesigns, setGeneratedDesigns] = useState<string[]>([]);
    const [uploads, setUploads] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingStamp, setViewingStamp] = useState<Stamp | null>(null);
    const [viewingDesign, setViewingDesign] = useState<Design | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadAllData();
    }, []);

    async function loadAllData() {
        try {
            // Load designs from Supabase
            const { data: designsData, error: designsError } = await supabase
                .from('designs')
                .select('*')
                .order('created_at', { ascending: false });

            if (!designsError && designsData) {
                setDesigns(designsData as Design[]);
            }

            // Try loading stamps from Supabase
            const { data: stampsData, error: stampsError } = await supabase
                .from('stamps')
                .select('*')
                .order('created_at', { ascending: false });

            if (!stampsError && stampsData) {
                // Convert Supabase stamps to local format
                const convertedStamps: Stamp[] = stampsData.map(stamp => ({
                    id: stamp.id,
                    name: stamp.name,
                    frontImageUrl: stamp.image_url,
                    backImageUrl: null,
                    createdAt: stamp.created_at,
                }));
                setStamps(convertedStamps);

                // Separate by type
                const generated = stampsData
                    .filter(s => s.type === 'generated')
                    .map(s => s.image_url);
                const uploaded = stampsData
                    .filter(s => s.type === 'uploaded')
                    .map(s => s.image_url);

                setGeneratedDesigns(generated);
                setUploads(uploaded);
            } else {
                // Fallback to localStorage
                const savedStamps = localStorage.getItem("folk_studio_stamps");
                if (savedStamps) {
                    const parsedStamps: Stamp[] = JSON.parse(savedStamps);
                    const processedStamps = await Promise.all(
                        parsedStamps.map(async (stamp) => {
                            const newStamp = { ...stamp };
                            if (newStamp.frontImageUrl?.startsWith("idb:")) {
                                const key = newStamp.frontImageUrl.replace("idb:", "");
                                const image = await getImage(key);
                                if (image) newStamp.frontImageUrl = image;
                            }
                            if (newStamp.backImageUrl?.startsWith("idb:")) {
                                const key = newStamp.backImageUrl.replace("idb:", "");
                                const image = await getImage(key);
                                if (image) newStamp.backImageUrl = image;
                            }
                            return newStamp;
                        })
                    );
                    setStamps(processedStamps);
                }
                const savedGenerated = localStorage.getItem("folk_studio_generated_designs");
                if (savedGenerated) setGeneratedDesigns(JSON.parse(savedGenerated));
                const savedUploads = localStorage.getItem("folk_studio_uploads");
                if (savedUploads) setUploads(JSON.parse(savedUploads));
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteModel(id: string) {
        try {
            // Try deleting from Supabase
            const { error } = await supabase
                .from('stamps')
                .delete()
                .eq('id', id);

            if (!error) {
                const updated = stamps.filter((s) => s.id !== id);
                setStamps(updated);
                toast.success("Modelo deletado!");
            } else {
                // Fallback to localStorage
                const updated = stamps.filter((s) => s.id !== id);
                setStamps(updated);
                localStorage.setItem("folk_studio_stamps", JSON.stringify(updated));
                toast.success("Modelo deletado (local)!");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao deletar modelo");
        }
    }

    async function handleDeleteDesign(id: string) {
        if (!confirm("Tem certeza que deseja deletar este design?")) return;
        try {
            // Try deleting from Supabase
            const { error } = await supabase
                .from('designs')
                .delete()
                .eq('id', id);

            if (!error) {
                const updated = designs.filter((d) => d.id !== id);
                setDesigns(updated);
                toast.success("Design deletado!");
            } else {
                console.error('Delete error:', error);
                toast.error("Erro ao deletar design");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao deletar design");
        }
    }

    function handleStartOrderFromDesign(design: Design) {
        try {
            const draftOrder = {
                imageUrl: design.final_image_url,
                mockupImage: design.mockup_image,
                productType: design.product_type,
                color: design.color,
                elements: design.elements,
                source: "design_page",
            };
            localStorage.setItem("folk_studio_draft_order", JSON.stringify(draftOrder));
            toast.success("Redirecionando para criar pedido...");
            router.push("/dashboard/orders");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao iniciar pedido");
        }
    }

    function handleDeleteImage(index: number, type: "ai" | "upload") {
        if (!confirm("Tem certeza que deseja deletar esta imagem?")) return;
        if (type === "ai") {
            const updated = generatedDesigns.filter((_, i) => i !== index);
            setGeneratedDesigns(updated);
            localStorage.setItem("folk_studio_generated_designs", JSON.stringify(updated));
        } else {
            const updated = uploads.filter((_, i) => i !== index);
            setUploads(updated);
            localStorage.setItem("folk_studio_uploads", JSON.stringify(updated));
        }
        toast.success("Imagem deletada!");
    }

    function handleDownload(imageUrl: string, name: string) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `${name}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download iniciado!");
    }

    function handleStartOrder(stamp: Stamp) {
        try {
            const savedStamps = localStorage.getItem("folk_studio_stamps");
            const originalStamp = savedStamps ? JSON.parse(savedStamps).find((s: Stamp) => s.id === stamp.id) : null;
            const draftOrder = {
                imageUrl: originalStamp?.frontImageUrl || stamp.frontImageUrl,
                backImageUrl: originalStamp?.backImageUrl || stamp.backImageUrl || null,
                logoFrontUrl: originalStamp?.logoFrontUrl || stamp.logoFrontUrl || null,
                logoBackUrl: originalStamp?.logoBackUrl || stamp.logoBackUrl || null,
                color: stamp.color || "white",
                source: "stamp_page",
                designFront: stamp.designFront || null,
                designBack: stamp.designBack || null,
            };
            localStorage.setItem("folk_studio_draft_order", JSON.stringify(draftOrder));
            toast.success("Redirecionando para criar pedido...");
            router.push("/dashboard/orders");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao iniciar pedido");
        }
    }

    function EmptyState({ message }: { message: string }) {
        const router = useRouter();
        return (
            <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">{message}</p>
                <Button onClick={() => router.push("/dashboard/studio")}>Ir para o Estúdio</Button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <Toaster position="top-right" richColors />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Minhas Estampas</h1>
                    <p className="text-gray-600 mt-1">Gerencie seus modelos, designs e uploads</p>
                </div>
                <Button onClick={() => router.push("/dashboard/studio")} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Criar Novo
                </Button>
            </div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button onClick={() => setActiveTab("designs")} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "designs" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                    <Palette className="h-4 w-4" /> Designs Salvos ({designs.length})
                </button>
                <button onClick={() => setActiveTab("models")} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "models" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                    <Shirt className="h-4 w-4" /> Modelos Criados ({stamps.length})
                </button>
                <button onClick={() => setActiveTab("ai")} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "ai" ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                    <Wand2 className="h-4 w-4" /> Designs Gerados ({generatedDesigns.length})
                </button>
                <button onClick={() => setActiveTab("uploads")} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "uploads" ? "border-green-600 text-green-600" : "border-transparent text-gray-5 00 hover:text-gray-700 hover:border-gray-300"}`}>
                    <ImageIcon className="h-4 w-4" /> Uploads ({uploads.length})
                </button>
            </div>
            {/* Content */}
            {loading ? (
                <div className="text-center py-12"><p className="text-gray-500">Carregando...</p></div>
            ) : (
                <div className="min-h-[400px]">
                    {/* Tab: Designs Salvos */}
                    {activeTab === "designs" && (
                        designs.length === 0 ? (
                            <EmptyState message="Você ainda não salvou nenhum design no estúdio." />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {designs.map((design) => (
                                    <div key={design.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                        <div className="bg-gray-100 p-4">
                                            <img
                                                src={design.final_image_url || '/placeholder.png'}
                                                alt={`Design ${design.product_type}`}
                                                className="w-full aspect-square object-contain rounded"
                                            />
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h3 className="font-semibold text-gray-900 mb-1 capitalize">
                                                {design.product_type} - {design.color}
                                            </h3>
                                            <p className="text-xs text-gray-500 mb-1">
                                                {design.elements.length} elemento(s)
                                            </p>
                                            <p className="text-xs text-gray-500 mb-3">
                                                {new Date(design.created_at).toLocaleDateString("pt-BR")}
                                            </p>
                                            <div className="mt-auto grid grid-cols-2 gap-2">
                                                <Button
                                                    onClick={() => setViewingDesign(design)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full text-xs"
                                                >
                                                    <Eye className="h-3 w-3 mr-1" /> Ver
                                                </Button>
                                                <Button
                                                    onClick={() => handleStartOrderFromDesign(design)}
                                                    size="sm"
                                                    className="w-full text-xs bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <ShoppingBag className="h-3 w-3 mr-1" /> Pedir
                                                </Button>
                                            </div>
                                            <Button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteDesign(design.id);
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="w-full mt-2 text-red-500 hover:text-red-700 hover:bg-red-50 h-6 text-xs"
                                            >
                                                Excluir Design
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                    {/* Tab: Modelos Criados */}
                    {activeTab === "models" && (
                        stamps.length === 0 ? (
                            <EmptyState message="Você ainda não salvou nenhum modelo de camiseta." />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {stamps.map((stamp) => (
                                    <div key={stamp.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-2">
                                            <div className="bg-white rounded p-1">
                                                <p className="text-xs text-gray-500 mb-1 text-center">Frente</p>
                                                <img src={stamp.frontImageUrl} alt="Frente" className="w-full aspect-square object-contain" />
                                            </div>
                                            {stamp.backImageUrl && (
                                                <div className="bg-white rounded p-1">
                                                    <p className="text-xs text-gray-500 mb-1 text-center">Costas</p>
                                                    <img src={stamp.backImageUrl} alt="Costas" className="w-full aspect-square object-contain" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h3 className="font-semibold text-gray-900 mb-1 truncate">{stamp.name}</h3>
                                            <p className="text-xs text-gray-500 mb-3">{new Date(stamp.createdAt).toLocaleDateString("pt-BR")}</p>
                                            <div className="mt-auto grid grid-cols-2 gap-2">
                                                <Button onClick={() => setViewingStamp(stamp)} variant="outline" size="sm" className="w-full text-xs">
                                                    <Eye className="h-3 w-3 mr-1" /> Ver
                                                </Button>
                                                <Button onClick={() => handleStartOrder(stamp)} size="sm" className="w-full text-xs bg-green-600 hover:bg-green-700 text-white">
                                                    <ShoppingBag className="h-3 w-3 mr-1" /> Pedir
                                                </Button>
                                            </div>
                                            <Button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleDeleteModel(stamp.id);
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="w-full mt-2 text-red-500 hover:text-red-700 hover:bg-red-50 h-6 text-xs"
                                            >
                                                Excluir Modelo
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                    {/* Tab: Designs Gerados */}
                    {activeTab === "ai" && (
                        generatedDesigns.length === 0 ? (
                            <EmptyState message="Você ainda não gerou nenhum design com IA." />
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {generatedDesigns.map((img, index) => (
                                    <div key={index} className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden aspect-square">
                                        <img src={img} alt={`Design IA ${index}`} className="w-full h-full object-contain p-2" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button onClick={() => handleDownload(img, `design-ia-${index}`)} size="icon" variant="secondary" className="h-8 w-8">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button onClick={() => handleDeleteImage(index, "ai")} size="icon" variant="destructive" className="h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                    {/* Tab: Uploads */}
                    {activeTab === "uploads" && (
                        uploads.length === 0 ? (
                            <EmptyState message="Você ainda não fez upload de nenhuma imagem." />
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {uploads.map((img, index) => (
                                    <div key={index} className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden aspect-square">
                                        <img src={img} alt={`Upload ${index}`} className="w-full h-full object-contain p-2" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <Button onClick={() => handleDownload(img, `upload-${index}`)} size="icon" variant="secondary" className="h-8 w-8">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button onClick={() => handleDeleteImage(index, "upload")} size="icon" variant="destructive" className="h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
            {/* Modal de Visualização */}
            {viewingStamp && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewingStamp(null)}>
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setViewingStamp(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 pr-12">{viewingStamp.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <h3 className="text-center font-medium text-gray-500 mb-4">Frente</h3>
                                <img src={viewingStamp.frontImageUrl} alt="Frente" className="w-full h-auto object-contain rounded-lg shadow-sm" />
                                <Button onClick={() => handleDownload(viewingStamp.frontImageUrl, `${viewingStamp.name}-frente`)} variant="outline" className="w-full mt-4">
                                    <Download className="h-4 w-4 mr-2" /> Baixar Imagem
                                </Button>
                            </div>
                            {viewingStamp.backImageUrl ? (
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <h3 className="text-center font-medium text-gray-500 mb-4">Costas</h3>
                                    <img src={viewingStamp.backImageUrl} alt="Costas" className="w-full h-auto object-contain rounded-lg shadow-sm" />
                                    <Button onClick={() => handleDownload(viewingStamp.backImageUrl!, `${viewingStamp.name}-costas`)} variant="outline" className="w-full mt-4">
                                        <Download className="h-4 w-4 mr-2" /> Baixar Imagem
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                                    <p>Sem verso</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-100">
                            <Button onClick={() => setViewingStamp(null)} variant="outline">Fechar</Button>
                            <Button onClick={() => { handleStartOrder(viewingStamp); setViewingStamp(null); }} className="bg-green-600 hover:bg-green-700 text-white px-8">
                                <ShoppingBag className="h-4 w-4 mr-2" /> Iniciar Pedido com este Modelo
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal de Visualização de Design */}
            {viewingDesign && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewingDesign(null)}>
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setViewingDesign(null)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                        <h2 className="text-2xl font-bold mb-2 pr-12 capitalize">{viewingDesign.product_type} - {viewingDesign.color}</h2>
                        <p className="text-sm text-gray-500 mb-6">{viewingDesign.elements.length} elemento(s) | {new Date(viewingDesign.created_at).toLocaleDateString("pt-BR")}</p>
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                            <h3 className="text-center font-medium text-gray-500 mb-4">Preview do Design</h3>
                            <img
                                src={viewingDesign.final_image_url || '/placeholder.png'}
                                alt="Design Preview"
                                className="w-full h-auto object-contain rounded-lg shadow-sm max-h-[500px]"
                            />
                            <Button
                                onClick={() => handleDownload(viewingDesign.final_image_url || '', `design-${viewingDesign.product_type}-${viewingDesign.color}`)}
                                variant="outline"
                                className="w-full mt-4"
                            >
                                <Download className="h-4 w-4 mr-2" /> Baixar Imagem
                            </Button>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold text-blue-900 mb-2">Elementos do Design:</h3>
                            <ul className="space-y-1 text-sm text-blue-800">
                                {viewingDesign.elements.map((el, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        {el.type === "text" ? `Texto: "${el.content}"` : "Imagem"}
                                        <span className="text-xs text-blue-600">
                                            ({Math.round(el.width)}x{Math.round(el.height)}px)
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                            <Button onClick={() => setViewingDesign(null)} variant="outline">Fechar</Button>
                            <Button
                                onClick={() => { handleStartOrderFromDesign(viewingDesign); setViewingDesign(null); }}
                                className="bg-green-600 hover:bg-green-700 text-white px-8"
                            >
                                <ShoppingBag className="h-4 w-4 mr-2" /> Iniciar Pedido com este Design
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
