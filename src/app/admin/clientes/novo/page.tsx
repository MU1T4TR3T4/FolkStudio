"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Save, User, Mail, Phone, MapPin, FileText } from "lucide-react";

interface ClientFormData {
    name: string;
    email: string;
    phone: string;
    address: string;
    observations: string;
}

export default function NovoClientePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ClientFormData>({
        name: "",
        email: "",
        phone: "",
        address: "",
        observations: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validação básica
            if (!formData.name || !formData.email || !formData.phone) {
                toast.error("Preencha todos os campos obrigatórios");
                setLoading(false);
                return;
            }

            // Criar novo cliente
            const newClient = {
                id: crypto.randomUUID(),
                ...formData,
                createdAt: new Date().toISOString(),
                totalOrders: 0
            };

            // Salvar no localStorage
            const savedClients = localStorage.getItem("folk_clients");
            const clients = savedClients ? JSON.parse(savedClients) : [];
            clients.push(newClient);
            localStorage.setItem("folk_clients", JSON.stringify(clients));

            toast.success("Cliente cadastrado com sucesso!");
            router.push("/admin/clientes");
        } catch (error) {
            console.error("Erro ao cadastrar cliente:", error);
            toast.error("Erro ao cadastrar cliente");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof ClientFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
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
                    <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
                    <p className="text-sm text-gray-500 mt-1">Cadastre um novo cliente no sistema</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="max-w-3xl">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                    {/* Nome */}
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
                                placeholder="Digite o nome completo do cliente"
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
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
                                placeholder="email@exemplo.com"
                                required
                            />
                        </div>
                    </div>

                    {/* Telefone */}
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
                                placeholder="(00) 00000-0000"
                                required
                            />
                        </div>
                    </div>

                    {/* Endereço */}
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
                                placeholder="Rua, número, bairro, cidade, estado"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Observações */}
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
                                placeholder="Informações adicionais sobre o cliente"
                                rows={4}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? "Salvando..." : "Salvar Cliente"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
