"use client";

import { useState, useEffect } from "react";
import { Trash2, Download, Plus, Image as ImageIcon, Wand2, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";

interface Stamp {
    id: string;
    name: string | null;
    frontImageUrl: string;
    backImageUrl: string | null;
    createdAt: string;
}

export default function EstampasPage() {
    const [activeTab, setActiveTab] = useState<"models" | "ai" | "uploads">("models");
    const [stamps, setStamps] = useState<Stamp[]>([]);
    const [generatedDesigns, setGeneratedDesigns] = useState<string[]>([]);
    const [uploads, setUploads] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadAllData();
    }, []);

    function loadAllData() {
        try {
            // Carregar Modelos
            const savedStamps = localStorage.getItem("folk_studio_stamps");
            if (savedStamps) setStamps(JSON.parse(savedStamps));

            // Carregar Designs IA
            const savedGenerated = localStorage.getItem("folk_studio_generated_designs");
            if (savedGenerated) setGeneratedDesigns(JSON.parse(savedGenerated));

            // Carregar Uploads
            const savedUploads = localStorage.getItem("folk_studio_uploads");
            if (savedUploads) setUploads(JSON.parse(savedUploads));

        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    }

    function handleDeleteModel(id: string) {
        if (!confirm("Tem certeza que deseja deletar este modelo?")) return;
        const updated = stamps.filter(s => s.id !== id);
        setStamps(updated);
        localStorage.setItem("folk_studio_stamps", JSON.stringify(updated));
        toast.success("Modelo deletado!");
    }

    function handleDeleteDesign(index: number, type: "ai" | "upload") {
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

    return (
        <div className="p-8 space-y-8">
            <Toaster position="top-right" richColors />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Minhas Estampas</h1>
                    <p className="text-gray-600 mt-1">Gerencie seus modelos, designs e uploads</p>
                </div>
                <Button
                    onClick={() => router.push("/dashboard/studio")}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" />
                    Criar Novo
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("models")}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "models"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                >
                    <Shirt className="h-4 w-4" />
                    Modelos Criados ({stamps.length})
                </button>
                <button
                    onClick={() => setActiveTab("ai")}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "ai"
                            ? "border-purple-600 text-purple-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                >
                    <Wand2 className="h-4 w-4" />
                    Designs Gerados ({generatedDesigns.length})
                </button>
                <button
                    onClick={() => setActiveTab("uploads")}
                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "uploads"
                            ? "border-green-600 text-green-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                >
                    <ImageIcon className="h-4 w-4" />
                    Uploads ({uploads.length})
                </button>
            </div>

            {/* Conteúdo */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Carregando...</p>
                </div>
            ) : (
                <div className="min-h-[400px]">
                    {/* Tab: Modelos Criados */}
                    {activeTab === "models" && (
                        stamps.length === 0 ? (
                            <EmptyState message="Você ainda não salvou nenhum modelo de camiseta." />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {stamps.map((stamp) => (
                                    <div key={stamp.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 mb-1 truncate">{stamp.name}</h3>
                                            <p className="text-xs text-gray-500 mb-3">{new Date(stamp.createdAt).toLocaleDateString("pt-BR")}</p>
                                            <div className="flex gap-2">
                                                <Button onClick={() => handleDownload(stamp.frontImageUrl, "modelo-frente")} variant="outline" size="sm" className="flex-1">
                                                    <Download className="h-3 w-3 mr-1" /> Frente
                                                </Button>
                                                <Button onClick={() => handleDeleteModel(stamp.id)} variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
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
                                            <Button onClick={() => handleDeleteDesign(index, "ai")} size="icon" variant="destructive" className="h-8 w-8">
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
                                            <Button onClick={() => handleDeleteDesign(index, "upload")} size="icon" variant="destructive" className="h-8 w-8">
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
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    const router = useRouter();
    return (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">{message}</p>
            <Button onClick={() => router.push("/dashboard/studio")}>
                Ir para o Estúdio
            </Button>
        </div>
    );
}
