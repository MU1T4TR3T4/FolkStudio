"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient, updateClient, Client } from "@/lib/clients";
import { toast } from "sonner";
import { X, User, Phone, Mail, MapPin, FileText } from "lucide-react";

interface ClientModalProps {
    client?: Client | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ClientModal({ client, isOpen, onClose, onSuccess }: ClientModalProps) {
    const [loading, setLoading] = useState(false);
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
        }
    }, [client, isOpen]);

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
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar cliente");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        {client ? "Editar Cliente" : "Novo Cliente"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <User className="h-4 w-4" /> Informações Básicas
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ""}
                                        onChange={handleChange}
                                        className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="joao@email.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone || ""}
                                        onChange={handleChange}
                                        className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa (Opcional)</label>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
                                <input
                                    type="text"
                                    name="cpf_cnpj"
                                    value={formData.cpf_cnpj || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="000.000.000-00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Address */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Endereço
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                                <input
                                    type="text"
                                    name="address_zip"
                                    value={formData.address_zip || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="00000-000"
                                />
                            </div>
                            <div className="sm:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rua</label>
                                <input
                                    type="text"
                                    name="address_street"
                                    value={formData.address_street || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Nome da Rua"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                                <input
                                    type="text"
                                    name="address_number"
                                    value={formData.address_number || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="123"
                                />
                            </div>
                            <div className="sm:col-span-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                                <input
                                    type="text"
                                    name="address_complement"
                                    value={formData.address_complement || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    placeholder="Apto, Sala, Bloco..."
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                                <input
                                    type="text"
                                    name="address_neighborhood"
                                    value={formData.address_neighborhood || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="sm:col-span-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                                <input
                                    type="text"
                                    name="address_city"
                                    value={formData.address_city || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="sm:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                                <input
                                    type="text"
                                    name="address_state"
                                    value={formData.address_state || ""}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Notes */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Observações
                        </h3>
                        <div>
                            <textarea
                                name="notes"
                                value={formData.notes || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[100px]"
                                placeholder="Anotações gerais sobre o cliente..."
                            />
                        </div>
                    </div>

                    <div className="sticky bottom-0 bg-white border-t pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                            {loading ? "Salvando..." : (client ? "Atualizar Cliente" : "Cadastrar Cliente")}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
