"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useUser } from "@/hooks/useUser";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { setUser } = useUser();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.status === "success") {
                toast.success(data.message);
                setUser(data.data.user);
                router.push("/dashboard");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Erro ao conectar com o servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div className="text-center">
                    <Image
                        src="/logo/folk-logo-sem-fundo1.png"
                        alt="Folk Logo"
                        width={120}
                        height={120}
                        className="mx-auto mb-6"
                    />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Bem-vindo de volta</h2>
                    <p className="mt-2 text-sm text-gray-600">Entre na sua conta para continuar</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-[#A8F0F8] placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A8F0F8] focus:border-[#A8F0F8] sm:text-sm"
                                placeholder="Endereço de email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-[#A8F0F8] placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#A8F0F8] focus:border-[#A8F0F8] sm:text-sm"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-[#7D4CDB] hover:bg-[#6b3bb5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7D4CDB]"
                        >
                            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Entrar"}
                        </Button>
                    </div>
                    <div className="text-sm text-center">
                        <Link href="/register" className="font-medium text-[#7D4CDB] hover:text-[#6b3bb5]">
                            Não tem uma conta? Crie agora
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
