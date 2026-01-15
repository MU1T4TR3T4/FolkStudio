"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, User as UserIcon, Package, Image as ImageIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { getClientById, Client, getClientStamps, ClientStamp } from "@/lib/clients";
import { supabase } from "@/lib/supabase";

interface Order {
    id: string;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
}

export default function ClientDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState<Client | null>(null);
    const [createdBy, setCreatedBy] = useState<any>(null);
    const [stamps, setStamps] = useState<ClientStamp[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        loadClientData();
    }, [params.id]);

    async function loadClientData() {
        try {
            setLoading(true);

            // Load client
            const clientData = await getClientById(params.id);
            if (!clientData) {
                toast.error("Cliente não encontrado");
                router.push("/admin/clientes");
                return;
            }
            setClient(clientData);

            // Load who created the client
            if ((clientData as any).created_by_user_id) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('full_name, role')
                    .eq('id', (clientData as any).created_by_user_id)
                    .single();

                if (userData) {
                    setCreatedBy(userData);
                }
            }

            // Load assigned stamps
            const stampsData = await getClientStamps(params.id);
            setStamps(stampsData);

            // Load orders
            const { data: ordersData } = await supabase
                .from('orders')
                .select('id, order_number, status, total_amount, created_at')
                .eq('client_id', params.id)
                .order('created_at', { ascending: false });

            if (ordersData) {
                setOrders(ordersData);
            }

        } catch (error) {
            console.error("Erro ao carregar dados do cliente:", error);
            toast.error("Erro ao carregar dados do cliente");
        } finally {
            setLoading(false);
        }
    }

    function getStatusBadge(status: string) {
        const statusConfig: Record<string, { label: string; color: string }> = {
            pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
            confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
            in_production: { label: "Em Produção", color: "bg-orange-100 text-orange-800" },
            ready: { label: "Pronto", color: "bg-green-100 text-green-800" },
            delivered: { label: "Entregue", color: "bg-green-200 text-green-900" },
            cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
        };

        const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800" };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    }

    function getRoleLabel(role: string) {
        const roleLabels: Record<string, string> = {
            admin: "Administrador",
            vendedor: "Vendedor",
            equipe: "Equipe",
        };
        return roleLabels[role] || role;
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-gray-500">Carregando detalhes do cliente...</p>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-gray-500">Cliente não encontrado</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    onClick={() => router.back()}
                    variant="ghost"
                    size="icon"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                    <p className="text-sm text-gray-500 mt-1">Detalhes e histórico do cliente</p>
                </div>
            </div>

            {/* Client Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Nome</p>
                            <p className="text-sm font-medium text-gray-900">{client.name}</p>
                        </div>
                    </div>

                    {client.email && (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Mail className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm font-medium text-gray-900">{client.email}</p>
                            </div>
                        </div>
                    )}

                    {client.phone && (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Phone className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Telefone</p>
                                <p className="text-sm font-medium text-gray-900">{client.phone}</p>
                            </div>
                        </div>
                    )}

                    {client.company_name && (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Package className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Empresa</p>
                                <p className="text-sm font-medium text-gray-900">{client.company_name}</p>
                            </div>
                        </div>
                    )}

                    {(client.address_city || client.address_state) && (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <MapPin className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Localização</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {client.address_city}{client.address_state ? ` - ${client.address_state}` : ""}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Cadastrado em</p>
                            <p className="text-sm font-medium text-gray-900">
                                {new Date(client.created_at || "").toLocaleDateString("pt-BR")}
                            </p>
                        </div>
                    </div>

                    {createdBy && (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <UserIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Cadastrado por</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {createdBy.full_name} ({getRoleLabel(createdBy.role)})
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Assigned Stamps */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Estampas Atribuídas ({stamps.length})
                </h2>
                {stamps.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma estampa atribuída a este cliente.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stamps.map((stamp) => (
                            <div key={stamp.id} className="border border-gray-200 rounded-lg p-3">
                                {stamp.stamp?.image_url ? (
                                    <img
                                        src={stamp.stamp.image_url}
                                        alt={stamp.stamp.name || "Estampa"}
                                        className="w-full h-32 object-cover rounded-lg mb-2"
                                    />
                                ) : stamp.design?.preview_url ? (
                                    <img
                                        src={stamp.design.preview_url}
                                        alt={stamp.design.name || "Design"}
                                        className="w-full h-32 object-cover rounded-lg mb-2"
                                    />
                                ) : (
                                    <div className="w-full h-32 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                )}
                                <p className="text-xs font-medium text-gray-900 truncate">
                                    {stamp.stamp?.name || stamp.design?.name || "Sem nome"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {stamp.approval_status === 'approved' ? '✓ Aprovado' :
                                        stamp.approval_status === 'rejected' ? '✗ Rejeitado' :
                                            '⏳ Pendente'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Order History */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Histórico de Pedidos ({orders.length})
                </h2>
                {orders.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum pedido realizado por este cliente.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Número
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Data
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            #{order.order_number}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {new Date(order.created_at).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                            {order.total_amount ? `R$ ${order.total_amount.toFixed(2)}` : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <Button
                    onClick={() => router.push(`/admin/clientes/${client.id}/editar`)}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    Editar Cliente
                </Button>
                <Button
                    onClick={() => router.back()}
                    variant="outline"
                >
                    Voltar
                </Button>
            </div>
        </div>
    );
}
