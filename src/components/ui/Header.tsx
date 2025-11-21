"use client";

import { Search, Bell, User, LogOut } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect } from "react";

export function Header() {
    const { user, clearUser, fetchUser } = useUser();
    const router = useRouter();

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            clearUser();
            toast.success("Logout realizado com sucesso.");
            router.push("/login");
        } catch (error) {
            toast.error("Erro ao sair.");
        }
    };

    return (
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="h-10 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
                    <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                        <Bell className="h-5 w-5" />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-gray-700">{user?.name || "Usuário"}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 ring-2 ring-white hover:bg-blue-200">
                            <User className="h-5 w-5" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="ml-2 p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Sair"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
