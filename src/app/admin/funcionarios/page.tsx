"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Filter, Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { toast, Toaster } from "sonner";
import { getAllUsers, toggleUserStatus, deleteUser, User } from "@/lib/auth";

export default function FuncionariosPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<User[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("todos");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEmployees();
    }, []);

    useEffect(() => {
        filterEmployees();
    }, [searchTerm, roleFilter, statusFilter, employees]);

    async function loadEmployees() {
        setLoading(true);
        try {
            const data = await getAllUsers();
            // Filter to show only team/admin, exclude vendedores
            const teamMembers = data.filter(u => u.role !== 'vendedor');
            setEmployees(teamMembers);
            setFilteredEmployees(teamMembers);
        } catch (error) {
            console.error("Erro ao carregar funcionários:", error);
            toast.error("Erro ao carregar equipe");
        } finally {
            setLoading(false);
        }
    }

    function filterEmployees() {
        let result = [...employees];

        // Busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (e) =>
                    e.full_name.toLowerCase().includes(term) ||
                    e.email.toLowerCase().includes(term)
            );
        }

        // Filtro por cargo
        if (roleFilter !== "todos") {
            result = result.filter((e) => e.role === roleFilter);
        }

        // Filtro por status
        if (statusFilter !== "todos") {
            const isActive = statusFilter === "ativo";
            result = result.filter((e) => e.is_active === isActive);
        }

        setFilteredEmployees(result);
    }

    async function handleDelete(id: string) {
        const employee = employees.find(e => e.id === id);
        if (!employee) return;

        if (!confirm(`Excluir membro da equipe ${employee.full_name}? esta ação não pode ser desfeita.`)) return;

        try {
            const result = await deleteUser(id);
            if (result.success) {
                toast.success("Membro excluído com sucesso!");
                loadEmployees();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error("Erro ao excluir:", error);
            toast.error("Erro ao excluir membro");
        }
    }

    async function handleToggleStatus(id: string, currentStatus: boolean) {
        try {
            const result = await toggleUserStatus(id, !currentStatus);
            if (result.success) {
                toast.success(`Membro ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
                loadEmployees();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Erro ao atualizar status");
        }
    }

    const getRoleBadge = (role: string) => {
        return role === "admin" ? (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                Admin
            </span>
        ) : (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Equipe
            </span>
        );
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Ativo
            </span>
        ) : (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                Inativo
            </span>
        );
    };

    const activeEmployees = employees.filter(e => e.is_active).length;
    const adminCount = employees.filter(e => e.role === "admin").length;

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando equipe...</div>;
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Equipe</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie a equipe e suas permissões
                    </p>
                </div>
                <button
                    onClick={() => router.push("/admin/funcionarios/novo")}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                    <Plus className="h-4 w-4" />
                    Novo Membro
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <Users className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total da Equipe</p>
                            <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Ativos</p>
                            <p className="text-2xl font-bold text-gray-900">{activeEmployees}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Administradores</p>
                            <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`px-3 py-2 border rounded-lg transition-colors ${showAdvancedFilters
                            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        Filtros Avançados
                    </button>
                </div>

                {/* Filtros Avançados */}
                {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cargo
                            </label>
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="todos">Todos os Cargos</option>
                                <option value="admin">Administrador</option>
                                {/* Removed Vendedor Option */}
                                <option value="equipe">Equipe</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="todos">Todos os Status</option>
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabela */}
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
                                    Cargo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {employees.length === 0
                                            ? "Nenhum funcionário cadastrado. Clique em 'Novo Funcionário' para começar."
                                            : "Nenhum funcionário encontrado com os filtros aplicados."}
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {employee.full_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{employee.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{employee.phone || "-"}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(employee.role)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(employee.is_active)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => router.push(`/admin/funcionarios/${employee.id}`)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                    title="Detalhes"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(employee.id, employee.is_active)}
                                                    className={employee.is_active ? "text-yellow-600 hover:text-yellow-900" : "text-green-600 hover:text-green-900"}
                                                    title={employee.is_active ? "Desativar" : "Ativar"}
                                                >
                                                    {employee.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(employee.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
