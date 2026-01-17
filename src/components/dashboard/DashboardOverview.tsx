"use client";

import { useEffect, useState } from "react";
import { getAllOrders, Order } from "@/lib/orders";
import { StatsCards } from "./StatsCards";
import { KanbanStageChart } from "./KanbanStageChart"; // Will create next
import { OrderAgingList } from "./OrderAgingList";     // Will create next
import { ChecklistActivityFeed } from "./ChecklistActivityFeed"; // Will create next
import { ProductionReport } from "./ProductionReport"; // Will create next
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DashboardOverview() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getAllOrders();
            setOrders(data);
        } catch (error) {
            console.error("Failed to load orders", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Visão Geral de Produção</h1>
                <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Atualizar
                </Button>
            </div>

            {/* Top Stats */}
            <StatsCards orders={orders} />

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                {/* Main Chart Area - 4 Columns */}
                <div className="md:col-span-4 space-y-6">
                    <KanbanStageChart orders={orders} />
                    <ProductionReport orders={orders} />
                </div>

                {/* Side Feed Area - 3 Columns */}
                <div className="md:col-span-3 space-y-6">
                    <ChecklistActivityFeed orders={orders} />
                    <OrderAgingList orders={orders} />
                </div>
            </div>
        </div>
    );
}
