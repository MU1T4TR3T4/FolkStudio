"use client";

import { useEffect, useState } from "react";
import { getAllOrders, Order } from "@/lib/orders";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
import { NewOrderForm } from "@/components/orders/NewOrderForm";
import { Button } from "@/components/ui/button";
import { Search, Eye, Filter, Plus } from "lucide-react";

export default function AllOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showNewOrderForm, setShowNewOrderForm] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [searchTerm, orders]);

    async function loadData() {
        setLoading(true);
        try {
            const data = await getAllOrders();
            setOrders(data);
            setFilteredOrders(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    function filterOrders() {
        if (!searchTerm) {
            setFilteredOrders(orders);
            return;
        }
        const term = searchTerm.toLowerCase();
        setFilteredOrders(orders.filter(o =>
            (o.order_number || o.id).toLowerCase().includes(term) ||
            o.customer_name?.toLowerCase().includes(term)
        ));
    }

    // Helper for Status Badge
    const StatusBadge = ({ stage }: { stage?: string }) => {
        const map: Record<string, { label: string, color: string }> = {
            'waiting_confirmation': { label: 'Aguardando', color: 'bg-gray-100 text-gray-700' },
            'photolith': { label: 'Fotolito', color: 'bg-blue-100 text-blue-700' },
            'waiting_arrival': { label: 'Chegada', color: 'bg-orange-100 text-orange-700' },
            'customization': { label: 'Personalização', color: 'bg-purple-100 text-purple-700' },
            'delivery': { label: 'Entrega', color: 'bg-yellow-100 text-yellow-700' },
            'finalized': { label: 'Finalizado', color: 'bg-green-100 text-green-700' },
            'returned': { label: 'Devolvido', color: 'bg-red-100 text-red-700' },
            'cancelled': { label: 'Cancelado', color: 'bg-red-50 text-red-500' }
        };

        const config = map[stage || ''] || { label: stage || 'Desconhecido', color: 'bg-gray-100 text-gray-500' };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Histórico de Pedidos</h1>
                    <p className="text-sm text-gray-500">Lista completa de todos os pedidos do sistema</p>
                </div>
                <Button onClick={() => setShowNewOrderForm(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Pedido
                </Button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar por cliente ou número do pedido..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando pedidos...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum pedido encontrado.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                                <tr>
                                    <th className="px-6 py-3">Pedido</th>
                                    <th className="px-6 py-3">Cliente</th>
                                    <th className="px-6 py-3">Data</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            #{order.order_number?.split('-').pop() || order.id.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {order.customer_name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge stage={order.kanban_stage} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Ver Detalhes
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Modal (ReadOnly) */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    readOnly={true} // Ensures no actions can be taken
                />
            )}

            <NewOrderForm
                open={showNewOrderForm}
                onClose={() => setShowNewOrderForm(false)}
                onSuccess={() => {
                    setShowNewOrderForm(false);
                    loadData();
                }}
            />
        </div>
    );
}
