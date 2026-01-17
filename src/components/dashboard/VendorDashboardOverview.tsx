"use client";

import { useEffect, useState } from "react";
import { getOrdersByUser, Order } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";
import { StatsCards } from "./StatsCards";
import { KanbanStageChart } from "./KanbanStageChart";
import { ChecklistActivityFeed } from "./ChecklistActivityFeed";
// import { ProductionReport } from "./ProductionReport"; // Not showing global report to vendor
import { OrderAgingList } from "./OrderAgingList";
import { Skeleton } from "@/components/ui/skeleton";

export function VendorDashboardOverview() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const user = getCurrentUser();
                if (!user) return; // Should not happen if guarded by layout

                // Use the dedicated function for fetching user's orders
                const myOrders = await getOrdersByUser(user.id);

                setOrders(myOrders); // Keeping 'orders' as the main state
                setFilteredOrders(myOrders); // filteredOrders is effectively the same here

            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    if (loading) {
        return <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>;
    }

    // Use filteredOrders for stats
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Visão Geral de Produção</h1>

            {/* 1. Stats Cards (Active, Late, Returns, Today) */}
            <StatsCards orders={filteredOrders} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2. Volume Chart (Left, spans 2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-6">Volume por Etapa</h2>
                    <KanbanStageChart orders={filteredOrders} />
                </div>

                {/* 3. Activity Feed or Quick Actions (Right, span 1 col) */}
                <div className="space-y-6">
                    {/* Maybe show recent activity for this user's orders? */}
                    {/* <UserChecklistFeed orders={filteredOrders} />  */}
                    {/* Warning: UserChecklistFeed shows checklist completions. If filteredOrders contains only my orders, 
                       it shows who completed checklists on MY orders (which is good). */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-sm font-semibold text-gray-900 mb-4">Últimas Atividades em Seus Pedidos</h2>
                        <ChecklistActivityFeed orders={filteredOrders} limit={5} />
                    </div>
                </div>
            </div>

            {/* 4. Bottle Necks / Aging List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-sm font-semibold text-gray-900">Pedidos com Atraso (+3 dias na mesma etapa)</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Crítico</span>
                </div>
                <OrderAgingList orders={filteredOrders} />
            </div>
        </div>
    );
}
