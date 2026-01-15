"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar, TrendingUp, Image, Users, ShoppingCart, Upload, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { supabase } from "@/lib/supabase";
import { getVendorData } from "@/lib/vendor-data";
import { getCurrentUser } from "@/lib/auth";

interface VendorData {
    vendor: any;
    stats: {
        totalStamps: number;
        totalClients: number;
        totalOrders: number;
        totalDesigns: number;
    };
    stamps: any[];
    clients: any[];
    orders: any[];
    designs: any[];
}

export default function VendorDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const vendorId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [vendorData, setVendorData] = useState<VendorData | null>(null);
    const [activeTab, setActiveTab] = useState<"estampas" | "clientes" | "pedidos" | "designs">("estampas");

    useEffect(() => {
        loadVendorData();
    }, [vendorId]);

    async function loadVendorData() {
        try {
            setLoading(true);
            const result = await getVendorData(vendorId);

            if (!result.success) {
                toast.error(result.error || "Erro ao carregar dados do vendedor");
                router.push("/admin/vendedores");
                return;
            }

            setVendorData(result as VendorData);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar dados do vendedor");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-gray-500">Carregando dados do vendedor...</p>
                </div>
            </div>
        );
    }

    if (!vendorData) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-gray-500">Vendedor não encontrado</p>
                    <Button onClick={() => router.push("/admin/vendedores")} className="mt-4">
                        Voltar
                    </Button>
                </div>
            </div>
        );
    }

    const { vendor, stats, stamps, clients, orders, designs } = vendorData;

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => router.push("/admin/vendedores")}
                        variant="ghost"
                        size="icon"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{vendor.full_name}</h1>
                        <p className="text-sm text-gray-500 mt-1">Detalhes do vendedor</p>
                    </div>
                </div>
            </div>

            {/* Vendor Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">{vendor.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Telefone</p>
                            <p className="font-medium text-gray-900">{vendor.phone || "Não informado"}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Cadastro</p>
                            <p className="font-medium text-gray-900">
                                {new Date(vendor.created_at).toLocaleDateString("pt-BR")}
                            </p>
                        </div>
                    </div>
                </div>

                {vendor.commission && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-gray-600" />
                            <span className="text-sm text-gray-600">Comissão:</span>
                            <span className="font-semibold text-gray-900">{vendor.commission}%</span>
                        </div>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${vendor.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {vendor.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Image className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Estampas</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalStamps}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Clientes</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <ShoppingCart className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Pedidos</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Upload className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Designs</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalDesigns}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab("estampas")}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "estampas"
                                ? "border-purple-600 text-purple-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <Image className="h-4 w-4" />
                        Estampas ({stamps.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("clientes")}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "clientes"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <Users className="h-4 w-4" />
                        Clientes ({clients.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("pedidos")}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "pedidos"
                                ? "border-green-600 text-green-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        Pedidos ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("designs")}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "designs"
                                ? "border-orange-600 text-orange-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                    >
                        <Upload className="h-4 w-4" />
                        Designs ({designs.length})
                    </button>
                </div>

                <div className="p-6">
                    {/* Tab: Estampas */}
                    {activeTab === "estampas" && (
                        <div>
                            {stamps.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    Nenhuma estampa criada por este vendedor
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {stamps.map((stamp) => (
                                        <div key={stamp.id} className="group relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden aspect-square">
                                            <img
                                                src={stamp.image_url}
                                                alt={stamp.name || "Estampa"}
                                                className="w-full h-full object-contain p-2"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <p className="text-white text-xs text-center px-2">
                                                    {stamp.name || "Sem nome"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Clientes */}
                    {activeTab === "clientes" && (
                        <div>
                            {clients.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    Nenhum cliente cadastrado por este vendedor
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cadastro</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {clients.map((client) => (
                                                <tr key={client.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {client.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {client.email || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {client.phone || "-"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(client.created_at).toLocaleDateString("pt-BR")}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Pedidos */}
                    {activeTab === "pedidos" && (
                        <div>
                            {orders.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    Nenhum pedido realizado por este vendedor
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {orders.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {order.order_number}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {order.customer_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {order.product_type}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(order.created_at).toLocaleDateString("pt-BR")}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab: Designs */}
                    {activeTab === "designs" && (
                        <div>
                            {designs.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    Nenhum design criado por este vendedor
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {designs.map((design) => (
                                        <div key={design.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                            <div className="aspect-video bg-white">
                                                <img
                                                    src={design.final_image_url || '/placeholder.png'}
                                                    alt={`Design ${design.product_type}`}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold text-gray-900 capitalize">
                                                    {design.product_type} - {design.color}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {design.elements.length} elemento(s)
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(design.created_at).toLocaleDateString("pt-BR")}
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
        </div>
    );
}
