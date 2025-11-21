"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, Shirt } from "lucide-react";
import { toast } from "sonner";

interface Order {
    id: string;
    previewUrl: string;
    model: string;
    color: string;
    createdAt: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const res = await fetch("/api/orders/list");
                const data = await res.json();
                if (data.status === "success") {
                    setOrders(data.orders);
                } else {
                    toast.error("Erro ao carregar pedidos.");
                }
            } catch (error) {
                toast.error("Erro de conexão.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchOrders();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Shirt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Você ainda não tem pedidos salvos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="aspect-square relative bg-gray-100">
                                <img
                                    src={order.previewUrl}
                                    alt={`Pedido ${order.id}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-medium text-gray-900 capitalize">
                                            {order.model === "short" ? "Manga Curta" : "Manga Longa"}
                                        </p>
                                        <p className="text-sm text-gray-500 capitalize">{order.color === "white" ? "Branco" : order.color === "black" ? "Preto" : "Azul"}</p>
                                    </div>
                                    <span className="text-xs font-mono text-gray-400">#{order.id.slice(0, 6)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
