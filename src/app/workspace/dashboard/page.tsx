"use client";

import { useEffect, useState } from "react";
import { Package, Clock, CheckCircle, Archive } from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";

interface Order {
    id: string;
    status: string;
    adminStatus?: "novo" | "producao" | "pronto" | "entregue";
    createdAt: string;
}

export default function WorkspaceDashboardPage() {
    const [stats, setStats] = useState({
        novos: 0,
        producao: 0,
        prontos: 0,
        concluidos: 0,
        total: 0
    });
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);

    useEffect(() => {
        loadStats();
    }, []);

    function loadStats() {
        try {
            const savedOrders = localStorage.getItem("folk_studio_orders");
            if (savedOrders) {
                const orders: Order[] = JSON.parse(savedOrders);

                // Contar por status
                const novos = orders.filter(o => !o.adminStatus || o.adminStatus === "novo").length;
                const producao = orders.filter(o => o.adminStatus === "producao").length;
                const prontos = orders.filter(o => o.adminStatus === "pronto").length;
                const concluidos = orders.filter(o => o.adminStatus === "entregue").length;

                setStats({
                    novos,
                    producao,
                    prontos,
                    concluidos,
                    total: orders.length
                });

                // Pegar os 5 pedidos mais recentes
                const recent = orders
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5);
                setRecentOrders(recent);
            }
        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
        }
    }

    const getStatusBadge = (order: Order) => {
        const status = order.adminStatus || "novo";
        const badges = {
            novo: { label: "Novo", class: "bg-blue-100 text-blue-700" },
            producao: { label: "Em Produção", class: "bg-yellow-100 text-yellow-700" },
            pronto: { label: "Pronto", class: "bg-green-100 text-green-700" },
            entregue: { label: "Entregue", class: "bg-gray-100 text-gray-700" }
        };
        const badge = badges[status];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                {badge.label}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1">Visão geral dos pedidos</p>
            </div>

            {/* Cards de Estatísticas */}
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

            {/* Pedidos Recentes */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Pedidos Recentes</h2>
                    <p className="text-sm text-gray-500 mt-1">Últimos 5 pedidos criados</p>
                </div>
                <div className="divide-y divide-gray-200">
                    {recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Nenhum pedido encontrado
                        </div>
                    ) : (
                        recentOrders.map((order) => (
                            <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            Pedido #{order.id.slice(0, 8)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </p>
                                    </div>
                                    {getStatusBadge(order)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
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
