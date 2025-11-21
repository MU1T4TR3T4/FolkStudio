"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Edit, CreditCard, Calendar, Shirt, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

interface Order {
    id: string;
    previewUrl: string;
    designUrl: string;
    model: string;
    color: string;
    createdAt: string;
}

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOrder() {
            if (!id) return;
            try {
                const res = await fetch(`/api/orders/get?id=${id}`);
                const data = await res.json();

                if (data.status === "success") {
                    setOrder(data.order);
                } else {
                    setError(data.message || "Erro ao carregar pedido");
                    toast.error(data.message || "Erro ao carregar pedido");
                }
            } catch (err) {
                setError("Erro de conexão");
                toast.error("Erro de conexão");
            } finally {
                setLoading(false);
            }
        }

        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-4">
                <p className="text-red-500 font-medium">{error || "Pedido não encontrado"}</p>
                <Button variant="outline" onClick={() => router.push("/dashboard/pedidos")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Pedidos
                </Button>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const colorMap: Record<string, string> = {
        white: "Branco",
        black: "Preto",
        blue: "Azul",
    };

    const modelMap: Record<string, string> = {
        short: "Manga Curta",
        long: "Manga Longa",
    };

    return (
        <div className="container max-w-3xl mx-auto py-8 px-4 space-y-8">
            <Toaster position="top-right" richColors />

            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => router.push("/dashboard/pedidos")}>
                            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                        </Button>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Detalhes do Pedido</h1>
                    <p className="text-gray-500 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(order.createdAt)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Coluna Principal: Prévia */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 flex items-center justify-center">
                        <div className="relative w-full aspect-[4/5] max-w-md">
                            <img
                                src={order.previewUrl}
                                alt="Prévia da Camiseta"
                                className="w-full h-full object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Coluna Lateral: Detalhes e Ações */}
                <div className="space-y-6">
                    {/* Card de Informações */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                        <h3 className="font-semibold text-gray-900 border-b pb-2">Resumo</h3>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Shirt className="h-4 w-4" /> Modelo
                                </span>
                                <span className="font-medium text-gray-900">{modelMap[order.model] || order.model}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500 flex items-center gap-2">
                                    <Palette className="h-4 w-4" /> Cor
                                </span>
                                <span className="font-medium text-gray-900 flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full border border-gray-200"
                                        style={{ backgroundColor: order.color === 'blue' ? '#2563eb' : order.color }}
                                    />
                                    {colorMap[order.color] || order.color}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Arte Original */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3">
                        <h3 className="font-semibold text-gray-900 text-sm">Arte Enviada</h3>
                        <div className="aspect-square w-full bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center">
                            <img
                                src={order.designUrl}
                                alt="Arte Original"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Ações */}
                    <div className="space-y-3">
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                            onClick={() => router.push(`/dashboard/checkout/${order.id}`)}
                        >
                            <CreditCard className="mr-2 h-5 w-5" />
                            Prosseguir
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                            onClick={() => router.push(`/dashboard/editor?orderId=${order.id}`)}
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Reabrir no Editor
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
