"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { Lock, User, Shield } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Autenticação exclusiva para administradores
        setTimeout(() => {
            if (username === "admin" && password === "admin123") {
                localStorage.setItem("folk_admin_auth", "true");
                localStorage.setItem("folk_admin_user", username);
                toast.success("Login realizado com sucesso!");
                router.push("/admin/dashboard");
            } else {
                toast.error("Usuário ou senha incorretos");
            }
            setLoading(false);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center p-4">
            <Toaster position="top-right" richColors />

            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                        <Shield className="h-8 w-8 text-indigo-600" />
                    </div>
                    <Image
                        src="/logo/folk-logo-sem-fundo1.png"
                        alt="FOLK Logo"
                        width={100}
                        height={40}
                        className="mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold text-gray-900">Área do Administrador</h1>
                    <p className="text-sm text-gray-500 mt-2">Acesso restrito - Controle total do sistema</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Usuário
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Digite seu usuário"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="Digite sua senha"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                    >
                        {loading ? "Entrando..." : "Entrar"}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        Demo: admin / admin123
                    </p>
                </div>
            </div>
        </div>
    );
}
