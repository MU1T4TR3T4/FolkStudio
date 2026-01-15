"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Mail, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { login } from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await login(formData.email, formData.password);

            if (!result.success) {
                toast.error(result.error || "Erro ao fazer login");
                setLoading(false);
                return;
            }

            if (!result.user) {
                toast.error("Erro ao processar login");
                setLoading(false);
                return;
            }

            toast.success(`Bem-vindo, ${result.user.full_name}!`);

            // Redirecionar baseado no role
            switch (result.user.role) {
                case 'admin':
                    router.push('/admin/dashboard');
                    break;
                case 'vendedor':
                    router.push('/dashboard');
                    break;
                case 'equipe':
                    router.push('/workspace');
                    break;
                default:
                    toast.error("Role de usuário inválido");
                    setLoading(false);
            }
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            toast.error("Erro ao processar login. Tente novamente.");
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
            <Toaster position="top-right" richColors />

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/logo/folk-logo-sem-fundo1.png"
                            alt="FOLK Logo"
                            width={180}
                            height={72}
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta!</h1>
                    <p className="text-gray-600 mt-2">Faça login para acessar sua conta</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="seu@email.com"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="••••••••"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    disabled={loading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Entrando...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <LogIn className="h-5 w-5" />
                                    Entrar
                                </span>
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Não tem acesso? Entre em contato com o administrador.</p>
                    </div>
                </div>

                {/* Info */}
                <div className="mt-6 text-center text-xs text-gray-500">
                    <p>© 2024 Folk Studio. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
}
