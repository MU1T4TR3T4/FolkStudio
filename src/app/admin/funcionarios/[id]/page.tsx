"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, Shield, Calendar, CheckCircle, Clock, ShoppingBag } from "lucide-react";
import { toast, Toaster } from "sonner";
import { getUserById, User } from "@/lib/auth";
import { getOrdersByUser, getActivityLogsByUser } from "@/lib/orders";

export default function FuncionarioDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [employee, setEmployee] = useState<User | null>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'logs'>('info');

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    async function loadData() {
        setLoading(true);
        try {
            // Load User Profile
            const userData = await getUserById(id);
            if (!userData) {
                toast.error("Funcionário não encontrado");
                router.push("/admin/funcionarios");
                return;
            }
            setEmployee(userData);

            // Load Orders Created
            const ordersData = await getOrdersByUser(id);
            setOrders(ordersData);

            // Load Activity Logs (Status Changes)
            // Use ID and Full Name for better coverage (legacy vs new)
            const logsData = await getActivityLogsByUser(id, userData.full_name);
            setLogs(logsData);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando perfil...</div>;
    if (!employee) return null;

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{employee.full_name}</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Detalhes e histórico de atividades
                    </p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Mail className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{employee.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Phone className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Telefone</p>
                            <p className="font-medium text-gray-900">{employee.phone || "Não cadastrado"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Shield className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Cargo</p>
                            <p className="font-medium text-gray-900 capitalize">{employee.role}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Cadastrado em</p>
                            <p className="font-medium text-gray-900">{new Date(employee.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === 'info'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === 'orders'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        Pedidos Criados e Checklist
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === 'logs'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        Histórico de Atividades
                    </button>
                </nav>
            </div>

            {/* Content Areas */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">

                {/* INFO TAB */}
                {activeTab === 'info' && (
                    <div className="space-y-6">
                        <h3 className="font-semibold text-gray-900">Resumo de Performance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-gray-500 text-sm">Pedidos Iniciados</p>
                                <p className="text-2xl font-bold text-indigo-600">{orders.length}</p>
                                <p className="text-xs text-gray-400 mt-1">Pedidos onde preencheu o checklist inicial</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-gray-500 text-sm">Ações Registradas</p>
                                <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
                                <p className="text-xs text-gray-400 mt-1">Mudanças de status e atualizações</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Pedidos Iniciados por {employee.full_name}</h3>
                        {orders.length === 0 ? (
                            <p className="text-gray-500">Nenhum pedido criado por este usuário.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Número</th>
                                            <th className="px-4 py-3">Cliente</th>
                                            <th className="px-4 py-3">Data</th>
                                            <th className="px-4 py-3">Status Atual</th>
                                            <th className="px-4 py-3">Checklist</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    #{order.order_number?.substring(0, 8) || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3">{order.customer_name}</td>
                                                <td className="px-4 py-3 text-gray-500">
                                                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs">
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-green-600 flex items-center gap-1">
                                                    <CheckCircle className="h-4 w-4" />
                                                    Verificado
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* LOGS TAB */}
                {activeTab === 'logs' && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-900 mb-4">Histórico de Alterações</h3>
                        {logs.length === 0 ? (
                            <p className="text-gray-500">Nenhuma atividade registrada.</p>
                        ) : (
                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="flex gap-4 p-4 rounded-lg bg-gray-50 border border-gray-100">
                                        <div className="flex-shrink-0 mt-1">
                                            <Clock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                Alterou status do pedido
                                                <span className="text-indigo-600 mx-1">
                                                    #{log.order?.order_number?.substring(0, 8) || '...'}
                                                </span>
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-sm">
                                                <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-xs line-through">
                                                    {log.old_status || 'N/A'}
                                                </span>
                                                <span className="text-gray-400 text-xs">→</span>
                                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-bold">
                                                    {log.new_status || 'N/A'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
