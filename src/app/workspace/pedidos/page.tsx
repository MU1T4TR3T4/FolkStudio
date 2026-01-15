"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, LayoutGrid, List, Search, Filter } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Order, getAllOrders, updateOrderStatus as updateStatusInDb, updateOrder } from "@/lib/orders";
import { getImage } from "@/lib/storage";

// Unified Components
import { KanbanBoard } from "@/components/orders/KanbanBoard";
import { NewOrderForm } from "@/components/orders/NewOrderForm";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";

export default function WorkspacePedidosPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [searchTerm, statusFilter, orders]);

    async function loadOrders() {
        try {
            // Load all orders (Shared View)
            const data = await getAllOrders();

            // Resolve Images (IDB) for display
            const processed = await Promise.all(data.map(async (o) => {
                const copy = { ...o };
                const resolve = async (k?: string) => k?.startsWith('idb:') ? await getImage(k.replace('idb:', '')) : k;

                if (copy.imageUrl?.startsWith('idb:')) copy.imageUrl = await resolve(copy.imageUrl) || copy.imageUrl;

                return copy;
            }));

            setOrders(processed);
            setFilteredOrders(processed);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar pedidos");
        }
    }

    function filterOrders() {
        let result = [...orders];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(order =>
                order.id.toLowerCase().includes(term) ||
                order.customer_name?.toLowerCase().includes(term) ||
                (order as any).clientName?.toLowerCase().includes(term)
            );
        }

        if (statusFilter !== "todos") {
            result = result.filter(order => (order.kanban_stage || 'waiting_confirmation') === statusFilter);
        }

        setFilteredOrders(result);
    }

    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        // Optimistic UI
        const updatedOrders = orders.map(o => o.id === orderId ? { ...o, kanban_stage: newStatus as any } : o);
        setOrders(updatedOrders);
        if (selectedOrder?.id === orderId) {
            setSelectedOrder({ ...selectedOrder, kanban_stage: newStatus as any });
        }

        const success = await updateStatusInDb(orderId, newStatus, "Workspace User");
        if (success) {
            toast.success("Status atualizado");
        } else {
            toast.error("Erro ao atualizar status");
            loadOrders(); // Revert
        }
    };

    const handleUpdateOrder = async (updated: Order) => {
        // Optimistic
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
        setSelectedOrder(updated);

        // Update DB
        await updateOrder(updated.id, updated);
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Workspace</h1>
                    <p className="text-sm text-gray-500">Acompanhamento e Produção</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setViewMode("kanban")} className={`p-2 rounded ${viewMode === "kanban" ? "bg-white shadow" : ""}`}><LayoutGrid className="h-4 w-4" /></button>
                        <button onClick={() => setViewMode("table")} className={`p-2 rounded ${viewMode === "table" ? "bg-white shadow" : ""}`}><List className="h-4 w-4" /></button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar pedido ou cliente..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded-lg bg-white"
                    >
                        <option value="todos">Todos Status</option>
                        <option value="waiting_confirmation">Aguardando</option>
                        <option value="photolith">Fotolito</option>
                        <option value="waiting_arrival">Chegada</option>
                        <option value="customization">Personalização</option>
                        <option value="delivery">Entrega</option>
                        <option value="finalized">Finalizado</option>
                        <option value="returned">Devolvido</option>
                    </select>
                </div>
            </div>

            {/* Board / Table */}
            {viewMode === "kanban" ? (
                <KanbanBoard
                    orders={filteredOrders}
                    onOrderClick={setSelectedOrder}
                />
            ) : (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                            <tr>
                                <th className="px-6 py-3">Pedido</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredOrders.map(o => (
                                <tr key={o.id} onClick={() => setSelectedOrder(o)} className="hover:bg-gray-50 cursor-pointer">
                                    <td className="px-6 py-3 font-medium">#{o.id.slice(0, 8)}</td>
                                    <td className="px-6 py-3">{o.customer_name}</td>
                                    <td className="px-6 py-3">{o.kanban_stage}</td>
                                    <td className="px-6 py-3">{new Date(o.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdateStatus={handleUpdateStatus}
                    onUpdateOrder={handleUpdateOrder}
                    readOnly={false} // Workspace users can advance stages
                />
            )}
        </div>
    );
}
