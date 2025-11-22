"use client";

import { useState, useEffect } from "react";
import { Trash2, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";

interface Stamp {
    id: string;
    name: string | null;
    imageUrl: string;
    createdAt: string;
}

export default function EstampasPage() {
    const [stamps, setStamps] = useState<Stamp[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadStamps();
    }, []);

    async function loadStamps() {
        try {
            const res = await fetch("/api/stamps/list");
            const data = await res.json();
            if (data.status === "success") {
                setStamps(data.stamps);
            }
        } catch (error) {
            toast.error("Erro ao carregar estampas");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(stampId: string) {
        if (!confirm("Tem certeza que deseja deletar esta estampa?")) return;

        try {
            const res = await fetch(`/api/stamps/delete?id=${stampId}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (data.status === "success") {
                toast.success("Estampa deletada!");
                loadStamps();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Erro ao deletar estampa");
        }
    }

    function handleDownload(imageUrl: string, name: string | null) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = name || "estampa.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download iniciado!");
    }

    return (
        <div className="p-8">
            <Toaster position="top-right" richColors />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Minhas Estampas</h1>
                    <p className="text-gray-600 mt-1">Gerencie suas estampas salvas</p>
                </div>
                <Button
                    onClick={() => router.push("/dashboard/studio")}
                    className="flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Nova Estampa
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Carregando estampas...</p>
                </div>
            ) : stamps.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 mb-4">Você ainda não tem estampas salvas</p>
                    <Button onClick={() => router.push("/dashboard/studio")}>
                        Criar Primeira Estampa
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {stamps.map((stamp) => (
                        <div
                            key={stamp.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-square bg-gray-100 relative">
                                <img
                                    src={stamp.imageUrl}
                                    alt={stamp.name || "Estampa"}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                                    {stamp.name || "Sem nome"}
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    {new Date(stamp.createdAt).toLocaleDateString("pt-BR")}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleDownload(stamp.imageUrl, stamp.name)}
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                    >
                                        <Download className="h-3 w-3 mr-1" />
                                        Baixar
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(stamp.id)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
