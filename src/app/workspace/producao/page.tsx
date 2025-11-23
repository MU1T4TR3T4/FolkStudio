"use client";

import { useEffect, useState } from "react";
import ProductionStats from "@/components/admin/ProductionStats";
import { toast, Toaster } from "sonner";

interface Order {
    id: string;
    adminStatus?: "novo" | "producao" | "pronto" | "entregue";
}

interface StatusLog {
    id: string;
    orderId: string;
    from: string;
    to: string;
    timestamp: string;
    user: string;
}

export default function AdminProducaoPage() {
    const [stats, setStats] = useState({
        producedToday: 0,
        pendingTotal: 0,
        avgProductionTime: "0 min",
        topProducer: "-"
    });
    const [dailyProduction, setDailyProduction] = useState<{ date: string; count: number }[]>([]);

    useEffect(() => {
        calculateStats();
    }, []);

    function calculateStats() {
        try {
            const savedOrders = localStorage.getItem("folk_studio_orders");
            const savedLogs = localStorage.getItem("folk_admin_status_logs");

            const orders: Order[] = savedOrders ? JSON.parse(savedOrders) : [];
            const logs: StatusLog[] = savedLogs ? JSON.parse(savedLogs) : [];

            // 1. Total Pendente (Novo ou Em Produção)
            const pendingTotal = orders.filter(o =>
                !o.adminStatus || o.adminStatus === "novo" || o.adminStatus === "producao"
            ).length;

            // 2. Produzidos Hoje (Logs de mudança para 'pronto' ou 'entregue' hoje)
            const today = new Date().toISOString().split('T')[0];
            const producedToday = logs.filter(log => {
                const logDate = log.timestamp.split('T')[0];
                return logDate === today && (log.to === "pronto" || log.to === "entregue");
            }).length;

            // 3. Tempo Médio (Diferença entre entrar em 'producao' e sair para 'pronto')
            let totalTimeMs = 0;
            let countTime = 0;

            // Agrupar logs por pedido
            const orderLogs: Record<string, StatusLog[]> = {};
            logs.forEach(log => {
                if (!orderLogs[log.orderId]) orderLogs[log.orderId] = [];
                orderLogs[log.orderId].push(log);
            });

            Object.values(orderLogs).forEach(pLogs => {
                // Ordenar por data
                pLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                const startProd = pLogs.find(l => l.to === "producao");
                const endProd = pLogs.find(l => l.to === "pronto" && new Date(l.timestamp) > new Date(startProd?.timestamp || 0));

                if (startProd && endProd) {
                    const diff = new Date(endProd.timestamp).getTime() - new Date(startProd.timestamp).getTime();
                    totalTimeMs += diff;
                    countTime++;
                }
            });

            let avgProductionTime = "0 min";
            if (countTime > 0) {
                const avgMs = totalTimeMs / countTime;
                const minutes = Math.floor(avgMs / 60000);
                const hours = Math.floor(minutes / 60);

                if (hours > 0) {
                    avgProductionTime = `${hours}h ${minutes % 60}min`;
                } else {
                    avgProductionTime = `${minutes}min`;
                }
            }

            // 4. Top Produtor (Quem mais moveu para 'pronto')
            const producerCounts: Record<string, number> = {};
            logs.filter(l => l.to === "pronto").forEach(log => {
                producerCounts[log.user] = (producerCounts[log.user] || 0) + 1;
            });

            let topProducer = "-";
            let maxCount = 0;
            Object.entries(producerCounts).forEach(([user, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    topProducer = user;
                }
            });

            // 5. Produção Diária (Últimos 7 dias)
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d.toISOString().split('T')[0];
            });

            const dailyData = last7Days.map(date => {
                const count = logs.filter(log =>
                    log.timestamp.startsWith(date) && log.to === "pronto"
                ).length;

                return {
                    date: date.split('-').slice(1).join('/'), // MM/DD
                    count
                };
            });

            setStats({
                producedToday,
                pendingTotal,
                avgProductionTime,
                topProducer
            });
            setDailyProduction(dailyData);

        } catch (error) {
            console.error("Erro ao calcular estatísticas:", error);
            toast.error("Erro ao calcular estatísticas");
        }
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            <div>
                <h1 className="text-2xl font-bold text-gray-900">Controle de Produção</h1>
                <p className="text-sm text-gray-500 mt-1">Métricas e desempenho da equipe</p>
            </div>

            <ProductionStats stats={stats} dailyProduction={dailyProduction} />
        </div>
    );
}
