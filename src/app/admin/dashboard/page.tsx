"use client";

import { useEffect, useState } from "react";
import { Package, Clock, CheckCircle, Archive, Users, DollarSign, AlertTriangle, TrendingUp, Activity, UserPlus } from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";
import OrdersLineChart from "@/components/admin/Charts/OrdersLineChart";
import StatusPieChart from "@/components/admin/Charts/StatusPieChart";
import { DeadlineList } from "@/components/admin/DeadlineList";
import { UserPerformanceTable } from "@/components/admin/UserPerformanceTable";
import { StatsListModal } from "@/components/admin/StatsListModal";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";
import { ClientModal } from "@/components/dashboard/ClientModal";
import { getAdminDashboardAnalytics, UserAnalytics } from "@/lib/admin-analytics";
import { Order } from "@/lib/orders";
import { Client } from "@/lib/clients";
import { toast } from "sonner";
import { updateOrderStatus, updateOrder } from "@/lib/orders";

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        novos: 0,
        producao: 0,
        prontos: 0,
        concluidos: 0,
        total: 0,
        todayOrders: 0,
        newClients: 0,
        monthOrders: 0,
        problems: 0
    });

    const [chartData, setChartData] = useState({
        ordersPerDay: [] as Array<{ date: string; orders: number }>,
        statusDistribution: [] as Array<{ name: string; value: number }>,
    });

    const [userPerformance, setUserPerformance] = useState<any[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    // Interaction State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'orders' | 'clients';
        title: string;
        data: any[];
    }>({
        isOpen: false,
        type: 'orders',
        title: '',
        data: []
    });

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            setLoading(true);
            const analytics = await getAdminDashboardAnalytics();

            setOrders(analytics.rawOrders);
            setClients(analytics.rawClients);

            const ordersData = analytics.rawOrders;
            const usersData = analytics.users;

            // Calcular estatísticas básicas
            const novos = ordersData.filter(o => !o.kanban_stage || o.kanban_stage === "waiting_confirmation").length;
            const producao = ordersData.filter(o => ['photolith', 'waiting_arrival', 'customization'].includes(o.kanban_stage || '')).length;
            const prontos = ordersData.filter(o => o.kanban_stage === "delivery").length; // "Ready for delivery"
            const concluidos = ordersData.filter(o => o.kanban_stage === "finalized").length;

            // Pedidos de hoje
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayOrders = ordersData.filter(o => new Date(o.created_at) >= today).length;

            // Pedidos do Mês (Substituindo Total Clientes)
            const thisMonth = new Date();
            thisMonth.setDate(1);
            thisMonth.setHours(0, 0, 0, 0);
            const monthOrders = ordersData.filter(o => new Date(o.created_at) >= thisMonth).length;

            // Novos clientes
            const newClientsCount = analytics.rawClients.filter(c => new Date(c.created_at || '') >= thisMonth).length;

            // Problems: Returned
            const problems = ordersData.filter(o => o.kanban_stage === 'returned').length;

            setStats({
                novos,
                producao,
                prontos,
                concluidos,
                total: ordersData.length,
                todayOrders,
                newClients: newClientsCount,
                monthOrders, // New metric
                problems
            });

            // Preparar dados para gráficos
            prepareChartData(ordersData);

            // Set User Performance
            prepareUserPerformance(usersData);

        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
        } finally {
            setLoading(false);
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
                const orderDate = new Date(o.created_at);
                return orderDate.toDateString() === date.toDateString();
            }).length;

            return { date: dateStr, orders: count };
        });

        // Gráfico de pizza: Distribuição por status
        const statusDistribution = [
            { name: 'Novo', value: orders.filter(o => !o.kanban_stage || o.kanban_stage === 'waiting_confirmation').length },
            { name: 'Em Produção', value: orders.filter(o => ['photolith', 'waiting_arrival', 'customization'].includes(o.kanban_stage || '')).length },
            { name: 'Pronto', value: orders.filter(o => o.kanban_stage === 'delivery').length },
            { name: 'Entregue', value: orders.filter(o => o.kanban_stage === 'finalized').length },
        ].filter(item => item.value > 0);

        setChartData({
            ordersPerDay,
            statusDistribution
        });
    }

    function prepareUserPerformance(users: UserAnalytics[]) {
        const performanceData = users.map(u => ({
            userId: u.userId,
            userName: u.userName,
            role: u.role,
            email: u.email,
            totalActivityCount: u.totalActivities,
            lastActive: u.lastActive,
            isOnline: u.isOnline,
            userObj: u.userObj,
            recentActivities: u.activities
        }));
        setUserPerformance(performanceData);
    }

    const handleStatClick = (category: string) => {
        let filteredOrders: Order[] = [];
        let filteredClients: Client[] = [];
        let title = "";
        let type: 'orders' | 'clients' = 'orders';

        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        switch (category) {
            case 'novos':
                title = "Novos Pedidos (Aguardando)";
                filteredOrders = orders.filter(o => !o.kanban_stage || o.kanban_stage === 'waiting_confirmation');
                break;
            case 'producao':
                title = "Pedidos em Produção";
                filteredOrders = orders.filter(o => ['photolith', 'waiting_arrival', 'customization'].includes(o.kanban_stage || ''));
                break;
            case 'prontos':
                title = "Pedidos Prontos para Entrega";
                filteredOrders = orders.filter(o => o.kanban_stage === 'delivery');
                break;
            case 'concluidos':
                title = "Pedidos Entregues/Finalizados";
                filteredOrders = orders.filter(o => ['finalized', 'delivered'].includes(o.kanban_stage || ''));
                break;
            case 'monthOrders':
                title = "Pedidos deste Mês";
                filteredOrders = orders.filter(o => new Date(o.created_at) >= thisMonth);
                break;
            case 'total':
                title = "Todos os Pedidos";
                filteredOrders = orders;
                break;
            case 'problems':
                title = "Pedidos com Pendências/Devolução";
                filteredOrders = orders.filter(o => o.kanban_stage === 'returned');
                break;
            case 'newClients':
                title = "Novos Clientes (Mês Atual)";
                type = 'clients';
                // Assumes clients have created_at, fallback to empty check
                filteredClients = clients.filter(c => c.created_at && new Date(c.created_at) >= thisMonth);
                break;
            default:
                return;
        }

        setModalConfig({
            isOpen: true,
            type,
            title,
            data: type === 'orders' ? filteredOrders : filteredClients
        });
    };

    const handleItemClick = (item: any) => {
        // Close the list modal first as requested
        setModalConfig(prev => ({ ...prev, isOpen: false }));

        if (modalConfig.type === 'orders') {
            setSelectedOrder(item as Order);
        } else {
            setSelectedClient(item as Client);
            setIsClientModalOpen(true);
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            toast.success("Status atualizado!");
            loadDashboardData(); // Refresh all
            setSelectedOrder(null);
            setModalConfig(prev => ({ ...prev, isOpen: false })); // Close lists
        } catch (error) {
            toast.error("Erro ao atualizar status");
        }
    };

    const handleUpdateOrder = async (updatedOrder: Order) => {
        try {
            await updateOrder(updatedOrder.id, updatedOrder);
            // Don't toast here as detail modal might handle specific logic, or toast "Pedido atualizado"
            setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
            // Also update selectedOrder to reflect changes immediately in modal
            setSelectedOrder(updatedOrder);
        } catch (error) {
            console.error(error);
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando dashboard...</div>;
    }

    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
                <p className="text-sm text-gray-500 mt-1">Visão geral e controle de gestão</p>
            </div>

            {/* Cards de Estatísticas - Linha 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Pedidos (Mês)"
                    value={stats.monthOrders}
                    icon={Package}
                    color="indigo"
                    subtitle="Criados este mês"
                    onClick={() => handleStatClick('monthOrders')}
                />
                <StatsCard
                    title="Pendências"
                    value={stats.problems}
                    icon={AlertTriangle}
                    color="red"
                    subtitle="Devoluções ou problemas"
                    onClick={() => handleStatClick('problems')}
                />
                <StatsCard
                    title="Novos Clientes"
                    value={stats.newClients}
                    icon={UserPlus}
                    color="purple"
                    subtitle="Cadastrados este mês"
                    onClick={() => handleStatClick('newClients')}
                />
                <StatsCard
                    title="Volume Total"
                    value={stats.total}
                    icon={Package}
                    color="gray"
                    subtitle="Pedidos no sistema"
                    onClick={() => handleStatClick('total')}
                />
            </div>

            {/* Cards de KPIs Operacionais (Status) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Novos Pedidos"
                    value={stats.novos}
                    icon={Package}
                    color="blue"
                    subtitle="Aguardando início"
                    onClick={() => handleStatClick('novos')}
                />
                <StatsCard
                    title="Em Produção"
                    value={stats.producao}
                    icon={Clock}
                    color="yellow"
                    subtitle="Estágios ativos"
                    onClick={() => handleStatClick('producao')}
                />
                <StatsCard
                    title="Prontos p/ Entrega"
                    value={stats.prontos}
                    icon={CheckCircle}
                    color="green"
                    subtitle="Aguardando retirada"
                    onClick={() => handleStatClick('prontos')}
                />
                <StatsCard
                    title="Entregues"
                    value={stats.concluidos}
                    icon={Archive}
                    color="purple"
                    subtitle="Ciclos fechados"
                    onClick={() => handleStatClick('concluidos')}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Deadlines and Charts */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <OrdersLineChart data={chartData.ordersPerDay} />
                        <StatusPieChart data={chartData.statusDistribution} />
                    </div>

                    {/* Deadline List (Bottlenecks) */}
                    <DeadlineList orders={orders} />
                </div>

                {/* Right Column: Team Performance */}
                <div className="space-y-6">
                    <UserPerformanceTable users={userPerformance} />
                </div>
            </div>

            {/* INTERACTIVE MODALS */}
            <StatsListModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                title={modalConfig.title}
                type={modalConfig.type}
                data={modalConfig.data}
                onItemClick={handleItemClick}
            />

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdateStatus={handleUpdateOrderStatus}
                    onUpdateOrder={handleUpdateOrder}
                />
            )}

            <ClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                client={selectedClient}
                onSuccess={() => {
                    loadDashboardData();
                    setIsClientModalOpen(false);
                }}
            />
        </div>
    );
}
