"use client";

import { useState, useEffect, useRef } from "react";
import { User, Mail, Shield, Save, Key, Camera, Loader2, Upload, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [avatar, setAvatar] = useState<string | null>(null);

    // Password fields
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passLoading, setPassLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load data from localStorage
        const user = localStorage.getItem("folk_admin_user") || "admin";
        const display = localStorage.getItem("folk_admin_display_name") || user;
        const savedAvatar = localStorage.getItem("folk_admin_avatar");

        setUsername(user);
        setDisplayName(display);
        if (savedAvatar) setAvatar(savedAvatar);

        setLoading(false);
    }, []);

    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        try {
            localStorage.setItem("folk_admin_display_name", displayName);
            window.dispatchEvent(new Event("storage"));
            toast.success("Perfil atualizado com sucesso!");
        } catch (error) {
            toast.error("Erro ao salvar perfil.");
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limit size to 2MB to avoid localStorage issues
        if (file.size > 2 * 1024 * 1024) {
            toast.error("A imagem deve ter no máximo 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            setAvatar(base64String);
            try {
                localStorage.setItem("folk_admin_avatar", base64String);
                window.dispatchEvent(new Event("storage"));
                toast.success("Foto de perfil atualizada!");
            } catch (error) {
                toast.error("Erro ao salvar imagem (possivelmente muito grande).");
            }
        };
        reader.readAsDataURL(file);
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("As novas senhas não coincidem.");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("A nova senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setPassLoading(true);

        // Simulate async check
        setTimeout(() => {
            const storedPassword = localStorage.getItem("folk_admin_password") || "admin123";

            if (currentPassword !== storedPassword) {
                toast.error("Senha atual incorreta.");
                setPassLoading(false);
                return;
            }

            try {
                localStorage.setItem("folk_admin_password", newPassword);
                toast.success("Senha alterada com sucesso!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } catch (error) {
                toast.error("Erro ao salvar nova senha.");
            }
            setPassLoading(false);
        }, 800);
    };

    if (loading) {
        return <div className="p-8 flex items-center gap-2"><Loader2 className="animate-spin" /> Carregando perfil...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Avatar & Summary */}
                <div className="col-span-1 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center">
                        <div className="relative mb-4 group">
                            <div className={`w-32 h-32 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md ${!avatar ? 'bg-indigo-100 text-indigo-600' : ''}`}>
                                {avatar ? (
                                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="h-16 w-16" />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg opacity-90 group-hover:opacity-100"
                                title="Alterar foto"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>

                        <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
                        <p className="text-sm text-gray-500 mb-6">Administrador Principal</p>

                        <div className="w-full pt-4 border-t border-gray-100 flex flex-col gap-2">
                            <div className="flex justify-between items-center text-sm text-gray-600 p-2 rounded hover:bg-gray-50">
                                <span>Status da Conta</span>
                                <span className="text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                                    <Shield className="h-3 w-3" /> Ativo
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-600 p-2 rounded hover:bg-gray-50">
                                <span>Acesso</span>
                                <span className="text-gray-900 font-medium text-xs bg-gray-100 px-2 py-0.5 rounded-full">SUPER ADMIN</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings Forms */}
                <div className="col-span-1 lg:col-span-2 space-y-6">

                    {/* General Info */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <h3 className="font-semibold text-gray-900">Informações Pessoais</h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nome de Exibição
                                    </label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Seu nome"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Visível para toda a equipe no sistema.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Usuário (Login)
                                    </label>
                                    <input
                                        type="text"
                                        value={username}
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                                        <Save className="h-4 w-4 mr-2" />
                                        Salvar Dados
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Lock className="h-4 w-4 text-gray-500" />
                            <h3 className="font-semibold text-gray-900">Segurança</h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Senha Atual
                                    </label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Digite sua senha atual"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Nova Senha
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Mínimo 6 caracteres"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirmar Nova Senha
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Repita a nova senha"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Button type="submit" variant="outline" disabled={passLoading} className="text-gray-700 hover:text-indigo-600 border-gray-200 hover:border-indigo-200 hover:bg-indigo-50">
                                        {passLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                                        Alterar Senha
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
