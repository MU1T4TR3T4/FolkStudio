"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar, Activity, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { getProfileData } from "@/lib/profile";
import { getActivityLogsByUser } from "@/lib/orders";
import AvatarUpload from "@/components/AvatarUpload";

export default function WorkspaceProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const currentUser = getCurrentUser();

            if (!currentUser) {
                router.push("/login");
                return;
            }

            // 1. Load Profile
            const result = await getProfileData(currentUser.id);
            if (!result.success) {
                toast.error("Erro ao carregar perfil");
                return;
            }
            setUser(result.user);

            // 2. Load Activities (Status Logs)
            // Use ID or Full Name for legacy matching
            const logs = await getActivityLogsByUser(currentUser.id, result.user.full_name);
            setActivities(logs);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    }

    function handleAvatarUploadSuccess(url: string) {
        setUser({ ...user, avatar_url: url });
        const currentUser = getCurrentUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, avatar_url: url };
            localStorage.setItem('folk_user', JSON.stringify(updatedUser));
        }
        window.dispatchEvent(new Event('avatarUpdated'));
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando perfil...</div>;
    }

    if (!user) return null;

    // Calculate stats from logs
    const totalActions = activities.length;
    const completedActions = activities.filter(a => a.new_status === 'completed' || a.new_status === 'delivered' || a.new_status === 'finalized').length;
    // Group by status for a quick breakdown? Or just show recent list.

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button onClick={() => router.back()} variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meu Perfil (Equipe)</h1>
                    <p className="text-sm text-gray-500">Gerencie suas informações e visualize suas atividades</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    <div className="flex-shrink-0">
                        <AvatarUpload
                            currentAvatarUrl={user.avatar_url}
                            userId={user.id}
                            onUploadSuccess={handleAvatarUploadSuccess}
                        />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
                        <p className="text-gray-600 mt-1">{user.email}</p>
                        <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4" />
                                <span>{user.phone || "Não informado"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                <span>Membro desde {new Date(user.created_at).toLocaleDateString("pt-BR")}</span>
                            </div>
                        </div>
                        <div className="mt-3">
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                                {user.role === 'admin' ? 'Administrador' : 'Colaborador da Equipe'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Activity className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total de Atividades</p>
                            <p className="text-2xl font-bold text-gray-900">{totalActions}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Finalizações</p>
                            <p className="text-2xl font-bold text-gray-900">{completedActions}</p>
                            <p className="text-xs text-gray-500">Pedidos concluídos ou entregues</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Última Atividade</p>
                            <p className="text-sm font-medium text-gray-900">
                                {activities.length > 0
                                    ? new Date(activities[0].created_at).toLocaleDateString()
                                    : "Nenhuma"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Log */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Histórico Recente</h3>
                </div>
                {activities.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Nenhuma atividade registrada recentemente.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {activities.slice(0, 10).map((log) => (
                            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        Alterou status do pedido <span className="text-blue-600">#{log.order?.order_number || "..."}</span>
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        De <span className="font-mono">{log.old_status}</span> para <span className="font-mono font-bold">{log.new_status}</span>
                                    </p>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {new Date(log.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
