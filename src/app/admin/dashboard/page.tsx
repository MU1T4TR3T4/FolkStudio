"use client";

import { useEffect, useState } from "react";
import { Package, Clock, CheckCircle, Archive, Users, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";
import OrdersLineChart from "@/components/admin/Charts/OrdersLineChart";
import StatusPieChart from "@/components/admin/Charts/StatusPieChart";
import TopItemsBarChart from "@/components/admin/Charts/TopItemsBarChart";
import ActivityTimeline from "@/components/admin/ActivityTimeline";

interface Order {
    id: string;
    status: string;
    adminStatus?: "novo" | "producao" | "pronto" | "entregue";
    createdAt: string;
    color?: string;
    clientName?: string;
    totalQty?: number;
}

interface Activity {
    id: string;
    type: 'status_change' | 'new_order' | 'order_completed';
    message: string;
    timestamp: string;
    user?: string;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        novos: 0,
        producao: 0,
        prontos: 0,
        concluidos: 0,
        total: 0,
        todayOrders: 0,
        newClients: 0,
        monthSales: 0,
        problems: 0
    });

    const [chartData, setChartData] = useState({
        ordersPerDay: [] as Array<{ date: string; orders: number }>,
        statusDistribution: [] as Array<{ name: string; value: number }>,
        topColors: [] as Array<{ name: string; count: number }>,
    });

    const [activities, setActivities] = useState<Activity[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    function loadDashboardData() {
        try {
            const savedOrders = localStorage.getItem("folk_studio_orders");
            if (savedOrders) {
                const orders: Order[] = JSON.parse(savedOrders);

                // Calcular estatísticas básicas
                const novos = orders.filter(o => !o.adminStatus || o.adminStatus === "novo").length;
                const producao = orders.filter(o => o.adminStatus === "producao").length;
                const prontos = orders.filter(o => o.adminStatus === "pronto").length;
                const concluidos = orders.filter(o => o.adminStatus === "entregue").length;

                // Pedidos de hoje
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayOrders = orders.filter(o => new Date(o.createdAt) >= today).length;

                // Novos clientes (simplificado - conta clientes únicos este mês)
                const thisMonth = new Date();
                thisMonth.setDate(1);
                thisMonth.setHours(0, 0, 0, 0);
                const clientsThisMonth = new Set(
                    orders
                        .filter(o => new Date(o.createdAt) >= thisMonth)
                        .map(o => o.clientName)
                        .filter(Boolean)
                ).size;

                // Vendas do mês (simplificado - conta total de peças)
                const monthSales = orders
                    .filter(o => new Date(o.createdAt) >= thisMonth)
                    .reduce((sum, o) => sum + (o.totalQty || 0), 0);

                setStats({
                    novos,
                    producao,
                    prontos,
                    concluidos,
                    total: orders.length,
                    todayOrders,
                    newClients: clientsThisMonth,
                    monthSales,
                    problems: 0 // Implementar lógica de problemas futuramente
                });

                // Preparar dados para gráficos
                prepareChartData(orders);

                // Carregar atividades
                loadActivities();
            }
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    }

    function prepareChartData(orders: Order[]) {
        // Gráfico de linha: Pedidos por dia (últimos 30 dias)
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date;
        });

        const ordersPerDay = last30Days.map(date => {
            const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const count = orders.filter(o => {
                const orderDate = new Date(o.createdAt);
                return orderDate.toDateString() === date.toDateString();
            }).length;

            return { date: dateStr, orders: count };
        });

        // Gráfico de pizza: Distribuição por status
        const statusDistribution = [
            { name: 'Novo', value: orders.filter(o => !o.adminStatus || o.adminStatus === 'novo').length },
            { name: 'Em Produção', value: orders.filter(o => o.adminStatus === 'producao').length },
            { name: 'Pronto', value: orders.filter(o => o.adminStatus === 'pronto').length },
            { name: 'Entregue', value: orders.filter(o => o.adminStatus === 'entregue').length },
        ].filter(item => item.value > 0);

        // Gráfico de barras: Cores mais vendidas
        const colorCounts: Record<string, number> = {};
        orders.forEach(order => {
            if (order.color) {
                colorCounts[order.color] = (colorCounts[order.color] || 0) + 1;
            }
        });

        const topColors = Object.entries(colorCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        setChartData({
            ordersPerDay,
            statusDistribution,
            topColors
        });
    }

    function loadActivities() {
        try {
            const savedLogs = localStorage.getItem("folk_admin_status_logs");
            if (savedLogs) {
                const logs = JSON.parse(savedLogs);

                // Converter logs em atividades
                const recentActivities: Activity[] = logs
                    .slice(-10)
                    .reverse()
                    .map((log: any) => ({
                        id: log.id,
                        type: 'status_change' as const,
                        message: `Pedido #${log.orderId.slice(0, 8)} movido para "${getStatusName(log.to)}"`,
                        timestamp: log.timestamp,
                        user: log.user
                    }));

                setActivities(recentActivities);
            }
        } catch (error) {
            console.error("Erro ao carregar atividades:", error);
        }
    }

    function getStatusName(status: string): string {
        const names: Record<string, string> = {
            novo: 'Novo',
            producao: 'Em Produção',
            pronto: 'Pronto',
            entregue: 'Entregue'
        };
        return names[status] || status;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Visão geral completa do sistema</p>
            </div>

            {/* Cards de Estatísticas - Linha 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Pedidos Novos"
                    value={stats.novos}
                    icon={Package}
                    color="blue"
                    subtitle="Aguardando produção"
                />
                <StatsCard
                    title="Em Produção"
                    value={stats.producao}
                    icon={Clock}
                    color="yellow"
                    subtitle="Sendo processados"
                />
                <StatsCard
                    title="Prontos"
                    value={stats.prontos}
                    icon={CheckCircle}
                    color="green"
                    subtitle="Para retirada/envio"
                />
                <StatsCard
                    title="Concluídos"
                    value={stats.concluidos}
                    icon={Archive}
                    color="gray"
                    subtitle="Entregues"
                />
            </div>

            {/* Cards de Estatísticas - Linha 2 (Novos KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Pedidos Hoje"
                    value={stats.todayOrders}
                    icon={TrendingUp}
                    color="purple"
                    subtitle="Criados hoje"
                />
                <StatsCard
                    title="Novos Clientes"
                    value={stats.newClients}
                    icon={Users}
                    color="indigo"
                    subtitle="Este mês"
                />
                <StatsCard
                    title="Vendas do Mês"
                    value={stats.monthSales}
                    icon={DollarSign}
                    color="emerald"
                    subtitle="Total de peças"
                />
                <StatsCard
                    title="Com Problema"
                    value={stats.problems}
                    icon={AlertTriangle}
                    color="red"
                    subtitle="Requer atenção"
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OrdersLineChart data={chartData.ordersPerDay} />
                <StatusPieChart data={chartData.statusDistribution} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopItemsBarChart
                    data={chartData.topColors}
                    title="Cores Mais Vendidas"
                    dataKey="count"
                />
                <ActivityTimeline activities={activities} />
            </div>

            {/* Resumo Total */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-90">Total de Pedidos</p>
                        <p className="text-4xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <Package className="h-16 w-16 opacity-50" />
                </div>
            </div>
        </div>
    );
}
