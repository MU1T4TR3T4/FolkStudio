"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Plus, BadgeDollarSign, Mail, Phone, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/auth";

interface Vendedor {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    commission: number;
    is_active: boolean;
    created_at: string;
    avatar_url?: string;
}

export default function AdminVendedoresPage() {
    const router = useRouter();
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [filteredVendedores, setFilteredVendedores] = useState<Vendedor[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterBy, setFilterBy] = useState<"all" | "recent" | "active">("all");

    useEffect(() => {
        loadVendedores();
    }, []);

    useEffect(() => {
        filterVendedores();
    }, [searchTerm, filterBy, vendedores]);

    async function loadVendedores() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'vendedor')
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Erro ao carregar vendedores:", error);
                toast.error("Erro ao carregar vendedores");
                return;
            }

            setVendedores(data || []);
        } catch (error) {
            console.error("Erro ao carregar vendedores:", error);
            toast.error("Erro ao carregar vendedores");
        }
    }

    function filterVendedores() {
        let result = [...vendedores];

        // Filtro por busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(vendedor =>
                vendedor.full_name.toLowerCase().includes(term) ||
                vendedor.email.toLowerCase().includes(term) ||
                (vendedor.phone && vendedor.phone.includes(term))
            );
        }

        // Filtro por categoria
        if (filterBy === "recent") {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            result = result.filter(vendedor => new Date(vendedor.created_at) >= thirtyDaysAgo);
        } else if (filterBy === "active") {
            result = result.filter(vendedor => vendedor.is_active);
        }

        setFilteredVendedores(result);
    }

    async function handleDeleteVendedor(vendedorId: string) {
        if (confirm("Tem certeza que deseja excluir este vendedor?")) {
            try {
                const { error } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', vendedorId);

                if (error) {
                    throw error;
                }

                toast.success("Vendedor excluído com sucesso!");
                loadVendedores(); // Recarregar lista
            } catch (error) {
                console.error("Erro ao excluir vendedor:", error);
                toast.error("Erro ao excluir vendedor");
            }
        }
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Vendedores</h1>
                    <p className="text-sm text-gray-500 mt-1">Gerencie todos os vendedores cadastrados</p>
                </div>
                <Button
                    onClick={() => router.push("/admin/vendedores/novo")}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                    <Plus className="h-4 w-4" />
                    Adicionar Vendedor
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <BadgeDollarSign className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total de Vendedores</p>
                            <p className="text-2xl font-bold text-gray-900">{vendedores.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Novos (30 dias)</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {vendedores.filter(v => {
                                    const thirtyDaysAgo = new Date();
                                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                    return new Date(v.created_at) >= thirtyDaysAgo;
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Vendedores Ativos</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {vendedores.filter(v => v.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, email ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as any)}
                        className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                    >
                        <option value="all">Todos os Vendedores</option>
                        <option value="recent">Novos (30 dias)</option>
                        <option value="active">Apenas Ativos</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nome
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Telefone
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cadastro
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredVendedores.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm || filterBy !== "all"
                                            ? "Nenhum vendedor encontrado com os filtros aplicados"
                                            : "Nenhum vendedor cadastrado. Clique em 'Adicionar Vendedor' para começar."}
                                    </td>
                                </tr>
                            ) : (
                                filteredVendedores.map((vendedor) => (
                                    <tr key={vendedor.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 h-10 w-10 rounded-full overflow-hidden flex items-center justify-center ${(vendedor as any).avatar_url ? 'bg-gray-100' : 'bg-gradient-to-br from-green-500 to-emerald-600'
                                                    }`}>
                                                    {(vendedor as any).avatar_url ? (
                                                        <img
                                                            src={(vendedor as any).avatar_url}
                                                            alt={vendedor.full_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-white font-medium text-sm">
                                                            {vendedor.full_name.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{vendedor.full_name}</div>
                                                    {!vendedor.is_active && (
                                                        <span className="text-xs text-red-500">Inativo</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Mail className="h-4 w-4" />
                                                {vendedor.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Phone className="h-4 w-4" />
                                                {vendedor.phone}
                                            </div>
                                        </td>
                                        {/* Commission removed */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${vendedor.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {vendedor.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(vendedor.created_at).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => router.push(`/admin/vendedores/${vendedor.id}`)}
                                                className="text-green-600 hover:text-green-900 mr-4"
                                            >
                                                Ver/Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteVendedor(vendedor.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination info */}
            {filteredVendedores.length > 0 && (
                <div className="text-sm text-gray-500 text-center">
                    Mostrando {filteredVendedores.length} de {vendedores.length} vendedores
                </div>
            )}
        </div>
    );
}
