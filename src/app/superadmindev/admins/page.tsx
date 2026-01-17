"use client";

import { useState, useEffect } from "react";
import { getAllUsers, createUser, deleteUser, User } from "@/lib/auth";
import { Trash2, UserPlus, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AdminsManagementPage() {
    const [admins, setAdmins] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [creating, setCreating] = useState(false);

    const loadAdmins = async () => {
        setLoading(true);
        const users = await getAllUsers();
        // Filter only admins
        const adminUsers = users.filter(u => u.role === 'admin');
        setAdmins(adminUsers);
        setLoading(false);
    };

    useEffect(() => {
        loadAdmins();
    }, []);

    const handleCreateAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        const result = await createUser({
            name,
            email,
            password,
            phone,
            role: 'admin'
        });

        if (result.success) {
            toast.success("Novo administrador criado com sucesso!");
            // Reset form
            setName("");
            setEmail("");
            setPassword("");
            setPhone("");
            loadAdmins();
        } else {
            toast.error(result.error || "Erro ao criar administrador");
        }
        setCreating(false);
    };

    const handleDeleteAdmin = async (id: string, email: string) => {
        if (!confirm(`Tem certeza que deseja remover o acesso de administrador para ${email}?`)) return;

        const result = await deleteUser(id);
        if (result.success) {
            toast.success("Administrador removido.");
            loadAdmins();
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-red-500" />
                <h1 className="text-2xl font-bold text-slate-200">Gerenciar Administradores</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
                    <h2 className="text-lg font-semibold text-slate-200 mb-6 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-red-500" />
                        Novo Administrador
                    </h2>

                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Nome Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Telefone</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Login (Email)</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Senha de Acesso</label>
                            <input
                                type="text" // Visible for admin creation convenience
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 focus:border-red-500 outline-none"
                                required
                                minLength={6}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={creating}
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                        >
                            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Acesso Admin"}
                        </Button>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-200 mb-2">Administradores Ativos</h2>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-slate-500">Carregando...</div>
                        ) : admins.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">Nenhum administrador encontrado (além do Super Admin).</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-950 uppercase font-medium text-slate-500">
                                        <tr>
                                            <th className="px-6 py-4">Admin</th>
                                            <th className="px-6 py-4">Login</th>
                                            <th className="px-6 py-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {admins.map((admin) => (
                                            <tr key={admin.id} className="hover:bg-slate-800/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-slate-200">{admin.full_name}</div>
                                                    <div className="text-xs text-slate-500">{admin.phone}</div>
                                                </td>
                                                <td className="px-6 py-4">{admin.email}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                                                        className="text-red-500 hover:text-red-400 hover:bg-red-950/50 p-2 rounded transition-colors"
                                                        title="Revogar Acesso"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
