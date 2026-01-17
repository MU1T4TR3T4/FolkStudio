"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getAllUsers, User } from "@/lib/auth";
import { Trash2, AlertTriangle, Download, RefreshCw, Users, FileText, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function SuperAdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState({ orders: 0, customers: 0, users: 0 });
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        const usersList = await getAllUsers();
        setUsers(usersList);

        const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
        const { count: clientsCount } = await supabase.from('clients').select('*', { count: 'exact', head: true });

        setStats({
            orders: ordersCount || 0,
            customers: clientsCount || 0,
            users: usersList.length
        });
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("TEM CERTEZA? Essa ação não pode ser desfeita.")) return;

        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) {
            toast.error(`Erro ao deletar usuário: ${error.message}`);
        } else {
            toast.success("Usuário deletado");
            loadData();
        }
    };

    const handleResetTable = async (table: 'orders' | 'clients') => {
        const password = prompt(`Digite a SENHA DE SUPER ADMIN para confirmar a exclusão de TODOS os dados de ${table}.`);

        if (password === "Mu1t4tr3t@") {
            const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) {
                toast.error(`Erro ao limpar tabela: ${error.message}`);
            } else {
                toast.success(`Tabela ${table} resetada com sucesso.`);
                loadData();
            }
        } else if (password) {
            toast.error("Senha incorreta. Ação cancelada.");
        }
    };

    const handleBackup = async (table: string) => {
        toast.info(`Gerando backup de ${table}...`);
        const { data, error } = await supabase.from(table).select('*');
        if (error || !data) {
            toast.error("Erro ao buscar dados.");
            return;
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${table}_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Backup baixado com sucesso.");
    };

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>, table: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (!Array.isArray(json)) {
                    toast.error("Arquivo inválido. O backup deve ser uma lista de itens.");
                    return;
                }

                if (!confirm(`Confirmar restauração de ${json.length} registros em ${table}? Isso pode sobrescrever dados existentes.`)) return;

                toast.info(`Restaurando ${table}...`);
                const { error } = await supabase.from(table).upsert(json);

                if (error) {
                    toast.error(`Erro na restauração: ${error.message}`);
                } else {
                    toast.success("Dados restaurados com sucesso!");
                    loadData();
                }
            } catch (err) {
                toast.error("Erro ao processar arquivo JSON.");
            }
        };
        reader.readAsText(file);
        // Clear input
        e.target.value = '';
    };

    if (loading) return <div className="p-8 text-red-400 font-mono animate-pulse">Scanning Database...</div>;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Total Users</p>
                        <h3 className="text-3xl font-bold text-slate-200">{stats.users}</h3>
                    </div>
                    <Users className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Total Orders</p>
                        <h3 className="text-3xl font-bold text-slate-200">{stats.orders}</h3>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Total Clients</p>
                        <h3 className="text-3xl font-bold text-slate-200">{stats.customers}</h3>
                    </div>
                    <Users className="h-8 w-8 text-green-500 opacity-50" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Danger Zone */}
                <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        <h2 className="text-xl font-bold text-red-500">DANGER ZONE</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-red-900/10">
                            <div>
                                <h4 className="font-semibold text-slate-200">Resetar Pedidos</h4>
                                <p className="text-xs text-slate-500">Exige Senha Super Admin</p>
                            </div>
                            <Button variant="destructive" onClick={() => handleResetTable('orders')} className="bg-red-600 hover:bg-red-700">
                                <Trash2 className="h-4 w-4 mr-2" /> WIPE
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-red-900/10">
                            <div>
                                <h4 className="font-semibold text-slate-200">Resetar Clientes</h4>
                                <p className="text-xs text-slate-500">Exige Senha Super Admin</p>
                            </div>
                            <Button variant="destructive" onClick={() => handleResetTable('clients')} className="bg-red-600 hover:bg-red-700">
                                <Trash2 className="h-4 w-4 mr-2" /> WIPE
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Backup Zone */}
                <div className="bg-blue-950/10 border border-blue-900/30 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Download className="h-6 w-6 text-blue-500" />
                        <h2 className="text-xl font-bold text-blue-500">BACKUP & RESTORE</h2>
                    </div>
                    <div className="space-y-4">
                        {['users', 'orders', 'clients'].map(table => (
                            <div key={table} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-blue-900/10">
                                <div>
                                    <h4 className="font-semibold text-slate-200 font-mono capitalize">{table}</h4>
                                </div>
                                <div className="flex gap-2">
                                    {/* Upload Button */}
                                    <label className="cursor-pointer">
                                        <input
                                            type="file"
                                            accept=".json"
                                            className="hidden"
                                            onChange={(e) => handleRestore(e, table)}
                                        />
                                        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-slate-800 hover:text-slate-200 h-9 px-3 border-slate-700 text-slate-400">
                                            <RefreshCw className="h-4 w-4 mr-2" /> Restore
                                        </div>
                                    </label>

                                    {/* Download Button */}
                                    <Button variant="outline" onClick={() => handleBackup(table)} className="border-blue-900 text-blue-400 hover:bg-blue-900/20">
                                        <Download className="h-4 w-4 mr-2" /> JSON
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Users Management */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-200">User Managment</h2>
                    <Button onClick={loadData} variant="ghost" size="sm"><RefreshCw className="h-4 w-4" /></Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 uppercase font-medium text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Função</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-medium text-slate-200 flex items-center gap-3">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} className="w-8 h-8 rounded-full" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">{user.full_name?.substring(0, 2)}</div>
                                        )}
                                        {user.full_name}
                                    </td>
                                    <td className="px-6 py-4">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-900/50 text-purple-400' :
                                            user.role === 'vendedor' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                                            }`}>
                                            {user.role?.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs">{user.id}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-500 hover:text-red-400 p-2 hover:bg-red-950 rounded"
                                            title="Excluir Usuário permanentemente"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
