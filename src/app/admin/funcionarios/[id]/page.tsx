"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, User, Mail, Phone, Shield, Package } from "lucide-react";
import { toast, Toaster } from "sonner";

interface Employee {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: "admin" | "funcionario";
    createdAt: string;
    isActive: boolean;
}

export default function EditarFuncionarioPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        role: "funcionario" as "admin" | "funcionario",
        isActive: true,
    });
    const [metrics, setMetrics] = useState({
        totalOrders: 0,
        createdAt: "",
    });

    useEffect(() => {
        loadEmployee();
    }, [id]);

    function loadEmployee() {
        try {
            const employees = JSON.parse(localStorage.getItem("folk_employees") || "[]");
            const employee = employees.find((e: Employee) => e.id === id);

            if (!employee) {
                toast.error("Funcionário não encontrado");
                router.push("/admin/funcionarios");
                return;
            }

            setFormData({
                name: employee.name,
                email: employee.email,
                phone: employee.phone || "",
                role: employee.role,
                isActive: employee.isActive,
            });

            // Calcular métricas
            const orders = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]");
            const employeeOrders = orders.filter((o: any) => o.responsible === employee.name);

            setMetrics({
                totalOrders: employeeOrders.length,
                createdAt: employee.createdAt,
            });

            setLoading(false);
        } catch (error) {
            console.error("Erro ao carregar funcionário:", error);
            toast.error("Erro ao carregar funcionário");
            router.push("/admin/funcionarios");
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Nome é obrigatório");
            return;
        }

        if (!formData.email.trim()) {
            toast.error("Email é obrigatório");
            return;
        }

        try {
            const employees = JSON.parse(localStorage.getItem("folk_employees") || "[]");
            const updated = employees.map((e: Employee) =>
                e.id === id
                    ? {
                        ...e,
                        name: formData.name.trim(),
                        email: formData.email.trim(),
                        phone: formData.phone.trim(),
                        role: formData.role,
                        isActive: formData.isActive,
                    }
                    : e
            );

            localStorage.setItem("folk_employees", JSON.stringify(updated));
            toast.success("Funcionário atualizado com sucesso!");
            router.push("/admin/funcionarios");
        } catch (error) {
            console.error("Erro ao atualizar funcionário:", error);
            toast.error("Erro ao atualizar funcionário");
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Carregando...</div>
            </div>
        );
    }

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
                    <h1 className="text-2xl font-bold text-gray-900">Editar Funcionário</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Atualize os dados do funcionário
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Formulário */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="p-6 space-y-6">
                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome Completo *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Digite o nome completo"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="email@exemplo.com"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Telefone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Telefone
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Cargo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cargo *
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "funcionario" })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                        required
                                    >
                                        <option value="funcionario">Funcionário</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={formData.isActive}
                                            onChange={() => setFormData({ ...formData, isActive: true })}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">Ativo</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!formData.isActive}
                                            onChange={() => setFormData({ ...formData, isActive: false })}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">Inativo</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                            >
                                <Save className="h-4 w-4" />
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sidebar com Métricas */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-4">Estatísticas</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                    <Package className="h-4 w-4" />
                                    <span>Pedidos Produzidos</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</p>
                            </div>
                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-500">Cadastrado em</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {new Date(metrics.createdAt).toLocaleDateString("pt-BR")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
