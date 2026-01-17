"use client";

import { useEffect, useState } from "react";
import { getOrdersByUser, Order } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";
import { KanbanBoard } from "@/components/orders/KanbanBoard";
import { OrderDetailsModal } from "@/components/orders/OrderDetailsModal";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductionPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        async function loadData() {
            const user = getCurrentUser();
            if (!user) return;
            try {
                const data = await getOrdersByUser(user.id);
                setOrders(data);
            } catch (error) {
                console.error("Error loading production orders", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return (
        <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-64" />
            <div className="flex gap-4">
                <Skeleton className="h-96 w-64" />
                <Skeleton className="h-96 w-64" />
                <Skeleton className="h-96 w-64" />
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Produção</h1>
                <p className="text-sm text-gray-500">Acompanhe o status dos seus pedidos</p>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                    <p className="text-gray-500">Nenhum pedido em produção.</p>
                </div>
            ) : (
                <KanbanBoard orders={orders} onOrderClick={setSelectedOrder} />
            )}

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    readOnly={false} // Vendor likely wants to see checklist or update status if allowed? 
                // User said "Produção: ira aparecer o kambam with orders made by user".
                // Assuming they might want to see details.
                />
            )}
        </div>
    );
}
