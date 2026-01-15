"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, Calendar, Package, TrendingUp, Users, Image, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { getCurrentUser } from "@/lib/auth";
import { getProfileData, updateProfile, changePassword, VendorStatistics } from "@/lib/profile";
import AvatarUpload from "@/components/AvatarUpload";

export default function PerfilPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [statistics, setStatistics] = useState<VendorStatistics | null>(null);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        loadProfileData();
    }, []);

    async function loadProfileData() {
        try {
            setLoading(true);
            const currentUser = getCurrentUser();

            if (!currentUser) {
                router.push("/login");
                return;
            }

            const result = await getProfileData(currentUser.id);

            if (!result.success) {
                toast.error(result.error || "Erro ao carregar perfil");
                return;
            }

            setUser(result.user);
            setStatistics(result.statistics || null);
            setFormData({
                full_name: result.user.full_name || "",
                email: result.user.email || "",
                phone: result.user.phone || "",
            });
        } catch (error) {
            console.error("Erro ao carregar perfil:", error);
            toast.error("Erro ao carregar perfil");
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveProfile() {
        try {
            setSaving(true);

            if (!user) return;

            const result = await updateProfile(user.id, formData);

            if (!result.success) {
                toast.error(result.error || "Erro ao salvar perfil");
                return;
            }

            toast.success("Perfil atualizado com sucesso!");

            // Atualizar user state
            setUser({ ...user, ...formData });

            // Recarregar para atualizar header
            window.location.reload();
        } catch (error) {
            console.error("Erro ao salvar perfil:", error);
            toast.error("Erro ao salvar perfil");
        } finally {
            setSaving(false);
        }
    }

    async function handleChangePassword() {
        try {
            if (!user) return;

            // Validações
            if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
                toast.error("Preencha todos os campos de senha");
                return;
            }

            if (passwordData.newPassword.length < 8) {
                toast.error("A nova senha deve ter no mínimo 8 caracteres");
                return;
            }

            if (passwordData.newPassword !== passwordData.confirmPassword) {
                toast.error("As senhas não coincidem");
                return;
            }

            setSaving(true);

            const result = await changePassword(user.id, passwordData.currentPassword, passwordData.newPassword);

            if (!result.success) {
                toast.error(result.error || "Erro ao alterar senha");
                return;
            }

            toast.success("Senha alterada com sucesso!");
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error) {
            console.error("Erro ao alterar senha:", error);
            toast.error("Erro ao alterar senha");
        } finally {
            setSaving(false);
        }
    }

    function handleAvatarUploadSuccess(url: string) {
        setUser({ ...user, avatar_url: url });

        // Atualizar localStorage
        const currentUser = getCurrentUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, avatar_url: url };
            localStorage.setItem('folk_user', JSON.stringify(updatedUser));
        }

        // Disparar evento para atualizar Header
        window.dispatchEvent(new Event('avatarUpdated'));
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-gray-500">Carregando perfil...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-8">
                <div className="text-center py-12">
                    <p className="text-gray-500">Erro ao carregar perfil</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    onClick={() => router.back()}
                    variant="ghost"
                    size="icon"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
                    <p className="text-sm text-gray-500 mt-1">Gerencie suas informações pessoais</p>
                </div>
            </div>

            {/* Profile Card with Avatar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Avatar Upload */}
                    <div className="flex-shrink-0">
                        <AvatarUpload
                            currentAvatarUrl={user.avatar_url}
                            userId={user.id}
                            onUploadSuccess={handleAvatarUploadSuccess}
                        />
                    </div>

                    {/* User Info */}
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
                        {user.role === 'vendedor' && user.commission && (
                            <div className="mt-3">
                                <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                                    <TrendingUp className="h-4 w-4" />
                                    Comissão: {user.commission}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Cards (Only for vendors) */}
            {user.role === 'vendedor' && statistics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Package className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total de Pedidos</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.totalOrders}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Em Produção</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.ordersInProduction}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <Package className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Concluídos</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.ordersCompleted}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Users className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Clientes</p>
                                <p className="text-2xl font-bold text-gray-900">{statistics.totalClients}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Form */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Telefone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Alterar Senha
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Senha Atual
                        </label>
                        <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nova Senha
                        </label>
                        <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirmar Nova Senha
                        </label>
                        <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <Button
                        onClick={handleChangePassword}
                        disabled={saving}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                        <Lock className="h-4 w-4 mr-2" />
                        {saving ? "Alterando..." : "Alterar Senha"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
