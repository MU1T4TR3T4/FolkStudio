"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, LayoutGrid, List, Search, Filter, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { getOrdersByUser, Order } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";
import { getImage } from "@/lib/storage";

// Unified Components
import { KanbanBoard } from "@/components/orders/KanbanBoard";
import { NewOrderForm } from "@/components/orders/NewOrderForm";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";

function OrdersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check URL params
    const isNewOrderRequested = searchParams.get('new') === 'true';

    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
    const [searchTerm, setSearchTerm] = useState("");

    // Modals
    const [showNewOrderForm, setShowNewOrderForm] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (isNewOrderRequested) setShowNewOrderForm(true);
    }, [isNewOrderRequested]);

    useEffect(() => {
        filterOrders();
    }, [searchTerm, orders]);

    async function loadData() {
        setLoading(true);
        try {
            const user = getCurrentUser();
            const data = await getOrdersByUser(user?.id || "");

            // Resolve images for display
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
            toast.error("Erro ao carregar seus pedidos");
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
            o.id.toLowerCase().includes(term) ||
            o.customer_name?.toLowerCase().includes(term)
        ));
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
                    <p className="text-sm text-gray-500">Acompanhe a produção dos seus pedidos</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setViewMode("kanban")} className={`p-2 rounded ${viewMode === "kanban" ? "bg-white shadow" : ""}`}><LayoutGrid className="h-4 w-4" /></button>
                        <button onClick={() => setViewMode("table")} className={`p-2 rounded ${viewMode === "table" ? "bg-white shadow" : ""}`}><List className="h-4 w-4" /></button>
                    </div>
                    <Button
                        onClick={() => setShowNewOrderForm(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4" /> Novo Pedido
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Buscar meus pedidos..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Carregando...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Você ainda não tem pedidos</p>
                    <Button onClick={() => setShowNewOrderForm(true)}>Criar Primeiro Pedido</Button>
                </div>
            ) : (
                <>
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
                                        <th className="px-6 py-3">Cor</th>
                                        <th className="px-6 py-3">Qtd</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Data</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredOrders.map(o => (
                                        <tr key={o.id} onClick={() => setSelectedOrder(o)} className="hover:bg-gray-50 cursor-pointer">
                                            <td className="px-6 py-3 font-medium">#{o.id.slice(0, 8)}</td>
                                            <td className="px-6 py-3">{o.color}</td>
                                            <td className="px-6 py-3">{o.quantity}</td>
                                            <td className="px-6 py-3">{o.kanban_stage}</td>
                                            <td className="px-6 py-3">{new Date(o.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {(showNewOrderForm || editingOrder) && (
                <NewOrderForm
                    open={showNewOrderForm || !!editingOrder}
                    initialData={editingOrder}
                    onClose={() => {
                        setShowNewOrderForm(false);
                        setEditingOrder(null);
                        if (isNewOrderRequested) router.replace('/dashboard/orders');
                    }}
                    onSuccess={() => {
                        setShowNewOrderForm(false);
                        setEditingOrder(null);
                        loadData();
                        if (isNewOrderRequested) router.replace('/dashboard/orders');
                    }}
                />
            )}

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    readOnly={true} // Vendor cannot change status
                    onEditOrder={(order) => {
                        setSelectedOrder(null);
                        setEditingOrder(order);
                    }}
                    onUpdateOrder={(updated) => {
                        // Vendor might update some info? Unlikely for now.
                        console.log("Vendor tried to update", updated);
                    }}
                />
            )}
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <OrdersContent />
        </Suspense>
    );
}
