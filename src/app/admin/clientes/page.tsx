"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Plus, Users, Mail, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { getClients } from "@/lib/clients";

interface Client {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    observations?: string;
    createdAt: string;
    totalOrders: number;
}


export default function AdminClientesPage() {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterBy, setFilterBy] = useState<"all" | "recent" | "active">("all");

    useEffect(() => {
        loadClients();
    }, []);

    useEffect(() => {
        filterClients();
    }, [searchTerm, filterBy, clients]);

    async function loadClients() {
        try {
            // Buscar todos os clientes do Supabase E localStorage
            const allClients = await getClients();

            // Calcular total de pedidos para cada cliente
            const savedOrders = localStorage.getItem("folk_studio_orders");
            const orders = savedOrders ? JSON.parse(savedOrders) : [];

            // Map and safely handle potentially missing properties
            const clientsWithOrders: Client[] = allClients.map(client => ({
                id: client.id,
                name: client.name,
                email: client.email || "",
                phone: client.phone || "",
                address: `${client.address_city || ''} ${client.address_state || ''}`.trim(),
                observations: client.notes,
                createdAt: client.created_at || new Date().toISOString(),
                totalOrders: orders.filter((o: any) => o.clientName === client.name).length
            }));

            setClients(clientsWithOrders);
        } catch (error) {
            console.error("Erro ao carregar clientes:", error);
            toast.error("Erro ao carregar clientes");
        }
    }

    function filterClients() {
        let result = [...clients];

        // Filtro por busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(client =>
                client.name.toLowerCase().includes(term) ||
                (client.email || "").toLowerCase().includes(term) ||
                (client.phone || "").includes(term)
            );
        }

        // Filtro por categoria
        if (filterBy === "recent") {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            result = result.filter(client => new Date(client.createdAt) >= thirtyDaysAgo);
        } else if (filterBy === "active") {
            result = result.filter(client => client.totalOrders > 0);
        }

        setFilteredClients(result);
    }

    function handleDeleteClient(clientId: string) {
        if (confirm("Tem certeza que deseja excluir este cliente?")) {
            try {
                const updatedClients = clients.filter(c => c.id !== clientId);
                setClients(updatedClients);
                localStorage.setItem("folk_clients", JSON.stringify(updatedClients));
                toast.success("Cliente excluído com sucesso!");
            } catch (error) {
                console.error("Erro ao excluir cliente:", error);
                toast.error("Erro ao excluir cliente");
            }
        }
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes</h1>
                    <p className="text-sm text-gray-500 mt-1">Gerencie todos os clientes cadastrados</p>
                </div>
                <Button
                    onClick={() => router.push("/admin/clientes/novo")}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                    <Plus className="h-4 w-4" />
                    Novo Cliente
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <Users className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total de Clientes</p>
                            <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Novos (30 dias)</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {clients.filter(c => {
                                    const thirtyDaysAgo = new Date();
                                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                    return new Date(c.createdAt) >= thirtyDaysAgo;
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Mail className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Clientes Ativos</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {clients.filter(c => c.totalOrders > 0).length}
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
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as any)}
                        className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                        <option value="all">Todos os Clientes</option>
                        <option value="recent">Novos (30 dias)</option>
                        <option value="active">Clientes Ativos</option>
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
                                    Nº Pedidos
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
                            {filteredClients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm || filterBy !== "all"
                                            ? "Nenhum cliente encontrado com os filtros aplicados"
                                            : "Nenhum cliente cadastrado. Clique em 'Novo Cliente' para começar."}
                                    </td>
                                </tr>
                            ) : (
                                filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <span className="text-indigo-600 font-medium text-sm">
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{client.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Mail className="h-4 w-4" />
                                                {client.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Phone className="h-4 w-4" />
                                                {client.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {client.totalOrders} pedidos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(client.createdAt).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => router.push(`/admin/clientes/${client.id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Ver/Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClient(client.id)}
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
            {filteredClients.length > 0 && (
                <div className="text-sm text-gray-500 text-center">
                    Mostrando {filteredClients.length} de {clients.length} clientes
                </div>
            )}
        </div>
    );
}
