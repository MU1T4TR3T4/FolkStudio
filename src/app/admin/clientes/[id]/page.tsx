"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Save, User, Mail, Phone, MapPin, FileText, Package, Calendar } from "lucide-react";

interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    observations?: string;
    createdAt: string;
    totalOrders: number;
}

interface Order {
    id: string;
    clientName?: string;
    createdAt: string;
    adminStatus?: string;
    totalQty?: number;
}

export default function ClienteDetalhesPage() {
    const router = useRouter();
    const params = useParams();
    const clientId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [client, setClient] = useState<Client | null>(null);
    const [clientOrders, setClientOrders] = useState<Order[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        observations: ""
    });

    useEffect(() => {
        loadClient();
    }, [clientId]);

    function loadClient() {
        try {
            const savedClients = localStorage.getItem("folk_clients");
            if (savedClients) {
                const clients: Client[] = JSON.parse(savedClients);
                const foundClient = clients.find(c => c.id === clientId);

                if (foundClient) {
                    setClient(foundClient);
                    setFormData({
                        name: foundClient.name,
                        email: foundClient.email,
                        phone: foundClient.phone,
                        address: foundClient.address || "",
                        observations: foundClient.observations || ""
                    });

                    // Carregar pedidos do cliente
                    const savedOrders = localStorage.getItem("folk_studio_orders");
                    if (savedOrders) {
                        const orders: Order[] = JSON.parse(savedOrders);
                        const clientOrdersList = orders.filter(o => o.clientName === foundClient.name);
                        setClientOrders(clientOrdersList);
                    }
                } else {
                    toast.error("Cliente não encontrado");
                    router.push("/admin/clientes");
                }
            }
        } catch (error) {
            console.error("Erro ao carregar cliente:", error);
            toast.error("Erro ao carregar cliente");
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.name || !formData.email || !formData.phone) {
                toast.error("Preencha todos os campos obrigatórios");
                setLoading(false);
                return;
            }

            const savedClients = localStorage.getItem("folk_clients");
            if (savedClients) {
                const clients: Client[] = JSON.parse(savedClients);
                const updatedClients = clients.map(c =>
                    c.id === clientId
                        ? { ...c, ...formData }
                        : c
                );
                localStorage.setItem("folk_clients", JSON.stringify(updatedClients));

                setClient(prev => prev ? { ...prev, ...formData } : null);
                setIsEditing(false);
                toast.success("Cliente atualizado com sucesso!");
            }
        } catch (error) {
            console.error("Erro ao atualizar cliente:", error);
            toast.error("Erro ao atualizar cliente");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const getStatusBadge = (status?: string) => {
        const badges: Record<string, { label: string; class: string }> = {
            novo: { label: "Novo", class: "bg-blue-100 text-blue-700" },
            producao: { label: "Em Produção", class: "bg-yellow-100 text-yellow-700" },
            pronto: { label: "Pronto", class: "bg-green-100 text-green-700" },
            entregue: { label: "Entregue", class: "bg-gray-100 text-gray-700" }
        };
        const badge = badges[status || "novo"];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                {badge.label}
            </span>
        );
    };

    if (!client) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                        <p className="text-sm text-gray-500 mt-1">Detalhes e histórico do cliente</p>
                    </div>
                </div>
                {!isEditing && (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        Editar Cliente
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Client Info */}
                <div className="lg:col-span-2 space-y-6">
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                            <h2 className="text-lg font-semibold text-gray-900">Editar Informações</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome Completo <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Telefone <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleChange("phone", e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Endereço
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => handleChange("address", e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Observações
                                </label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <textarea
                                        value={formData.observations}
                                        onChange={(e) => handleChange("observations", e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                        rows={4}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    <Save className="h-4 w-4" />
                                    {loading ? "Salvando..." : "Salvar Alterações"}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            name: client.name,
                                            email: client.email,
                                            phone: client.phone,
                                            address: client.address || "",
                                            observations: client.observations || ""
                                        });
                                    }}
                                    disabled={loading}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                            <h2 className="text-lg font-semibold text-gray-900">Informações do Cliente</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2 mt-1">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        {client.email}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Telefone</p>
                                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2 mt-1">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        {client.phone}
                                    </p>
                                </div>
                            </div>

                            {client.address && (
                                <div>
                                    <p className="text-sm text-gray-500">Endereço</p>
                                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2 mt-1">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        {client.address}
                                    </p>
                                </div>
                            )}

                            {client.observations && (
                                <div>
                                    <p className="text-sm text-gray-500">Observações</p>
                                    <p className="text-sm text-gray-700 mt-1">{client.observations}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-500">Data de Cadastro</p>
                                <p className="text-sm font-medium text-gray-900 flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {new Date(client.createdAt).toLocaleDateString("pt-BR", {
                                        day: "2-digit",
                                        month: "long",
                                        year: "numeric"
                                    })}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Order History */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Pedidos</h2>

                        {clientOrders.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                Nenhum pedido encontrado para este cliente
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {clientOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                Pedido #{order.id.slice(0, 8)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(order.createdAt).toLocaleDateString("pt-BR")} • {order.totalQty || 0} peças
                                            </p>
                                        </div>
                                        {getStatusBadge(order.adminStatus)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-4">Estatísticas</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-indigo-600" />
                                    <span className="text-sm text-gray-700">Total de Pedidos</span>
                                </div>
                                <span className="text-lg font-bold text-gray-900">{clientOrders.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-green-600" />
                                    <span className="text-sm text-gray-700">Cliente desde</span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                    {new Date(client.createdAt).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
