"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import OrderChat from "@/components/shared/OrderChat";

interface Order {
    id: string;
    imageUrl: string;
    color: string;
    material: string;
    sizes: Record<string, number>;
    totalQty: number;
    observations: string | null;
    status: string;
    createdAt: string;
    backImageUrl?: string | null;
    adminStatus?: "novo" | "producao" | "pronto" | "entregue";
}

export default function ClientOrderDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrder();
    }, [params.id]);

    function loadOrder() {
        try {
            const savedOrders = localStorage.getItem("folk_studio_orders");
            if (savedOrders) {
                const orders: Order[] = JSON.parse(savedOrders);
                const found = orders.find(o => o.id === params.id);
                if (found) {
                    setOrder(found);
                } else {
                    toast.error("Pedido não encontrado");
                    router.push("/dashboard/orders");
                }
            }
        } catch (error) {
            console.error("Erro ao carregar pedido:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Carregando...</p>
            </div>
        );
    }

    if (!order) return null;

    const getStatusBadge = () => {
        const status = order.adminStatus || "novo";
        const badges = {
            novo: { label: "Recebido", class: "bg-blue-100 text-blue-700", icon: Clock },
            producao: { label: "Em Produção", class: "bg-yellow-100 text-yellow-700", icon: Package },
            pronto: { label: "Pronto para Envio", class: "bg-green-100 text-green-700", icon: CheckCircle },
            entregue: { label: "Entregue", class: "bg-gray-100 text-gray-700", icon: CheckCircle }
        };
        const badge = badges[status] || badges.novo;
        const Icon = badge.icon;

        return (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${badge.class}`}>
                <Icon className="h-5 w-5" />
                <span className="font-medium">{badge.label}</span>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard/orders")}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Detalhes do Pedido</h1>
                    <p className="text-sm text-gray-500">#{order.id.slice(0, 8)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Esquerda - Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Status Atual</p>
                            <h2 className="text-lg font-semibold text-gray-900 capitalize">
                                {order.adminStatus === "novo" ? "Pedido Recebido" :
                                    order.adminStatus === "producao" ? "Em Produção" :
                                        order.adminStatus === "pronto" ? "Pronto" : "Entregue"}
                            </h2>
                        </div>
                        {getStatusBadge()}
                    </div>

                    {/* Detalhes do Produto */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h3>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex gap-4">
                                <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                    <p className="text-xs text-center text-gray-500 mt-1">Frente</p>
                                    <img src={order.imageUrl} alt="Arte Frente" className="w-full h-full object-contain" />
                                </div>
                                {order.backImageUrl && (
                                    <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                                        <p className="text-xs text-center text-gray-500 mt-1">Costas</p>
                                        <img src={order.backImageUrl} alt="Arte Costas" className="w-full h-full object-contain" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Cor</p>
                                    <p className="font-medium capitalize">{order.color}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Material</p>
                                    <p className="font-medium capitalize">{order.material}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Quantidade Total</p>
                                    <p className="font-medium">{order.totalQty} unidades</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Data do Pedido</p>
                                    <p className="font-medium">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Grade de Tamanhos</h4>
                            <div className="flex gap-4">
                                {Object.entries(order.sizes).map(([size, qty]) => (
                                    qty > 0 && (
                                        <div key={size} className="bg-gray-50 px-3 py-2 rounded-lg text-center min-w-[60px]">
                                            <div className="text-xs text-gray-500 mb-1">{size}</div>
                                            <div className="font-bold text-gray-900">{qty}</div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna Direita - Chat */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fale Conosco</h3>
                        <OrderChat
                            orderId={order.id}
                            currentUserType="client"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
