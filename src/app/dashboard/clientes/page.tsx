"use client";

import { useState, useEffect } from "react";
import { Plus, Search, User, Mail, Phone, MapPin, MoreVertical, FileText, ShoppingBag, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClients, deleteClient, Client } from "@/lib/clients";
import { ClientModal } from "@/components/dashboard/ClientModal";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ClientsPage() {
    const router = useRouter();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // Delete confirmation state
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

    useEffect(() => {
        loadClients();
    }, []);

    async function loadClients() {
        setLoading(true);
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            toast.error("Erro ao carregar clientes");
        } finally {
            setLoading(false);
        }
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase()) ||
        client.phone?.toLowerCase().includes(search.toLowerCase()) ||
        client.company_name?.toLowerCase().includes(search.toLowerCase())
    );

    const checkAndDelete = (client: Client) => {
        setClientToDelete(client);
    };

    const confirmDelete = async () => {
        if (!clientToDelete) return;

        try {
            const result = await deleteClient(clientToDelete.id);
            if (result.success) {
                toast.success("Cliente removido");
                loadClients();
            } else {
                toast.error(result.error || "Erro ao remover cliente");
            }
        } catch (error) {
            toast.error("Erro ao processar exclusão");
        } finally {
            setClientToDelete(null);
        }
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleNewClient = () => {
        setEditingClient(null);
        setIsModalOpen(true);
    };

    const handleViewDetails = (client: Client) => {
        router.push(`/dashboard/clientes/${client.id}`);
    };

    return (
        <div className="space-y-8">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Meus Clientes</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie sua carteira de clientes, pedidos e preferências
                    </p>
                </div>
                <Button
                    onClick={handleNewClient}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Novo Cliente
                </Button>
            </div>

            {/* Search and Filter */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nome, email, telefone ou empresa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
            </div>

            {/* Clients Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Carregando clientes...</p>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                        <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Nenhum cliente encontrado</h3>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                        {search ? "Tente buscar com outros termos." : "Comece adicionando seu primeiro cliente para gerenciar pedidos e estampas."}
                    </p>
                    {!search && (
                        <Button onClick={handleNewClient} variant="outline" className="mt-6">
                            Adicionar Cliente
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <div
                            key={client.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group overflow-hidden cursor-pointer"
                            onClick={() => handleViewDetails(client)}
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {client.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {client.name}
                                            </h3>
                                            {client.company_name && (
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {client.company_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                                <MoreVertical className="h-4 w-4 text-gray-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(client); }}>
                                                <User className="mr-2 h-4 w-4" /> Ver Detalhes
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(client); }}>
                                                <FileText className="mr-2 h-4 w-4" /> Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600 bg-red-50 focus:bg-red-100 mt-1" onClick={(e) => { e.stopPropagation(); checkAndDelete(client); }}>
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600">
                                    {client.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="truncate">{client.email}</span>
                                        </div>
                                    )}
                                    {client.phone && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span>{client.phone}</span>
                                        </div>
                                    )}
                                    {client.address_city && (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span className="truncate">
                                                {client.address_city}{client.address_state ? ` - ${client.address_state}` : ""}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs font-medium text-gray-500">
                                <span>Cadastrado em {new Date(client.created_at || "").toLocaleDateString()}</span>
                                <div className="flex gap-2">
                                    {/* Placeholder for future stats icons */}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadClients}
                client={editingClient}
            />

            {/* Delete Confirmation Dialog */}
            {clientToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Cliente</h3>
                        <p className="text-gray-500 mb-6">
                            Tem certeza que deseja excluir <strong>{clientToDelete.name}</strong>?
                            Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setClientToDelete(null)}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete}>
                                Confirmar Exclusão
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
