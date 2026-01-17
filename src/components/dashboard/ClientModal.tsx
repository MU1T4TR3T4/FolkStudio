"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient, updateClient, Client } from "@/lib/clients";
import { toast } from "sonner";
import { X, User, Phone, Mail, MapPin, FileText, ShoppingBag, Clock, ArrowRight } from "lucide-react";
import { getOrdersByClientId, Order } from "@/lib/orders";

interface ClientModalProps {
    client?: Client | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ClientModal({ client, isOpen, onClose, onSuccess }: ClientModalProps) {
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [formData, setFormData] = useState<Partial<Client>>({
        name: "",
        email: "",
        phone: "",
        company_name: "",
        cpf_cnpj: "",
        address_street: "",
        address_number: "",
        address_complement: "",
        address_neighborhood: "",
        address_city: "",
        address_state: "",
        address_zip: "",
        notes: "",
    });

    useEffect(() => {
        if (client) {
            setFormData(client);
            fetchClientOrders(client.id);
        } else {
            // Reset form for new client
            setFormData({
                name: "",
                email: "",
                phone: "",
                company_name: "",
                cpf_cnpj: "",
                address_street: "",
                address_number: "",
                address_complement: "",
                address_neighborhood: "",
                address_city: "",
                address_state: "",
                address_zip: "",
                notes: "",
            });
            setOrders([]);
        }
    }, [client, isOpen]);

    const fetchClientOrders = async (clientId: string) => {
        setLoadingOrders(true);
        try {
            const clientOrders = await getOrdersByClientId(clientId);
            setOrders(clientOrders);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar histórico de pedidos");
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error("O nome do cliente é obrigatório");
            return;
        }

        setLoading(true);
        try {
            if (client) {
                await updateClient(client.id, formData);
                toast.success("Cliente atualizado com sucesso!");
            } else {
                await createClient(formData);
                toast.success("Cliente cadastrado com sucesso!");
            }
            onSuccess();
            // Don't close immediately if editing, maybe user wants to see history
            if (!client) onClose();
            else onClose(); // Closing for now as per standard behavior
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar cliente");
        } finally {
            setLoading(false);
        }
    };

    function getStageLabel(stage?: string) {
        const map: Record<string, string> = {
            'waiting_confirmation': 'Aguardando',
            'photolith': 'Fotolito',
            'waiting_arrival': 'Chegada',
            'customization': 'Personalização',
            'delivery': 'Entrega',
            'finalized': 'Finalizado',
            'returned': 'Devolvido'
        };
        return map[stage || ''] || stage || 'Pendente';
    }

    function getStageColor(stage?: string) {
        if (stage === 'finalized' || stage === 'delivered') return 'bg-green-100 text-green-700';
        if (stage === 'returned') return 'bg-red-100 text-red-700';
        if (stage === 'waiting_confirmation') return 'bg-blue-100 text-blue-700';
        return 'bg-yellow-100 text-yellow-800';
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {client ? <User className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5 text-green-600" />}
                        {client ? "Editar Cliente & Histórico" : "Novo Cliente"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-0 flex flex-col md:flex-row">

                    {/* Left Column: Form */}
                    <div className="flex-1 p-6 border-r border-gray-100 overflow-y-auto">
                        <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <User className="h-4 w-4" /> Informações Básicas
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name || ""}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                            placeholder="Ex: João Silva"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email || ""}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="email@exemplo.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone || ""}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                            <input
                                                type="text"
                                                name="company_name"
                                                value={formData.company_name || ""}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="Nome da Empresa"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
                                            <input
                                                type="text"
                                                name="cpf_cnpj"
                                                value={formData.cpf_cnpj || ""}
                                                onChange={handleChange}
                                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                placeholder="Documento"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100" />

                            {/* Address */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> Endereço
                                </h3>
                                <div className="grid grid-cols-6 gap-3">
                                    <div className="col-span-2">
                                        <input name="address_zip" value={formData.address_zip || ""} onChange={handleChange} placeholder="CEP" className="w-full px-3 py-2 border rounded text-sm" />
                                    </div>
                                    <div className="col-span-4">
                                        <input name="address_street" value={formData.address_street || ""} onChange={handleChange} placeholder="Rua" className="w-full px-3 py-2 border rounded text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <input name="address_number" value={formData.address_number || ""} onChange={handleChange} placeholder="Nº" className="w-full px-3 py-2 border rounded text-sm" />
                                    </div>
                                    <div className="col-span-4">
                                        <input name="address_complement" value={formData.address_complement || ""} onChange={handleChange} placeholder="Complemento" className="w-full px-3 py-2 border rounded text-sm" />
                                    </div>
                                    <div className="col-span-3">
                                        <input name="address_neighborhood" value={formData.address_neighborhood || ""} onChange={handleChange} placeholder="Bairro" className="w-full px-3 py-2 border rounded text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <input name="address_city" value={formData.address_city || ""} onChange={handleChange} placeholder="Cidade" className="w-full px-3 py-2 border rounded text-sm" />
                                    </div>
                                    <div className="col-span-1">
                                        <input name="address_state" value={formData.address_state || ""} onChange={handleChange} placeholder="UF" className="w-full px-3 py-2 border rounded text-sm" maxLength={2} />
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Observações
                                </h3>
                                <textarea
                                    name="notes"
                                    value={formData.notes || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[80px]"
                                    placeholder="Anotações..."
                                />
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Order History (Only if client exists) */}
                    {client && (
                        <div className="w-full md:w-[400px] bg-gray-50 p-6 flex flex-col overflow-hidden">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-gray-500" /> Histórico de Pedidos</span>
                                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">{orders.length} pedidos</span>
                            </h3>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {loadingOrders ? (
                                    <div className="text-center py-10 text-gray-500">Carregando pedidos...</div>
                                ) : orders.length > 0 ? (
                                    orders.map(order => (
                                        <div key={order.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-gray-800">#{order.order_number || order.id.slice(0, 8)}</span>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getStageColor(order.kanban_stage)}`}>
                                                    {getStageLabel(order.kanban_stage)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 mb-1">
                                                {order.product_type} - {order.quantity} un
                                            </div>
                                            <div className="text-xs text-gray-400 flex items-center gap-1 mb-2">
                                                <Clock className="h-3 w-3" />
                                                {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                            {/* Future: Add 'View Order' button logic here if needed, but for now just display */}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-gray-400 italic bg-white rounded-lg border border-dashed border-gray-300">
                                        Nenhum pedido encontrado para este cliente.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-white border-t p-4 flex justify-end gap-3 shrink-0">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="client-form" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                        {loading ? "Salvando..." : (client ? "Atualizar Cliente" : "Cadastrar Cliente")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
