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
        <header className="flex h-14 items-center justify-between border-b border-[#d0d4e4] bg-white px-4 shadow-sm">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#676879]" />
                    <input
                        type="text"
                        placeholder="Pesquisar"
                        className="h-9 w-64 rounded-full border border-transparent bg-[#f5f6f8] pl-10 pr-4 text-sm text-[#323338] outline-none focus:border-[#0073ea] focus:bg-white focus:ring-2 focus:ring-[#0073ea]/20 transition-all placeholder-[#676879]"
                    />
                </div>

                <div className="flex items-center gap-4 border-l border-gray-200 pl-6">
                    <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                        <Bell className="h-5 w-5" />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-[#323338]">{user?.name || "Usuário"}</p>
                            <p className="text-xs text-[#676879]">{user?.email}</p>
                        </div>
                        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0073ea] text-white ring-2 ring-white hover:bg-[#0060b9]">
                            <User className="h-4 w-4" />
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
