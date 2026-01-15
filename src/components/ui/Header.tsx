"use client";

import { User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "@/lib/auth";
import NotificationDropdown from "../NotificationDropdown";

export function Header() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    function loadUser() {
        const currentUser = getCurrentUser();
        setUser(currentUser);
    }

    useEffect(() => {
        loadUser();

        // Listen for avatar update events
        const handleAvatarUpdate = () => {
            loadUser();
        };

        window.addEventListener('avatarUpdated', handleAvatarUpdate);

        return () => {
            window.removeEventListener('avatarUpdated', handleAvatarUpdate);
        };
    }, []);

    const handleLogout = async () => {
        try {
            logout();
            toast.success("Logout realizado com sucesso.");
            router.push("/login");
        } catch (error) {
            toast.error("Erro ao sair.");
        }
    };

    const handleProfileClick = () => {
        router.push("/dashboard/perfil");
    };

    return (
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
            {/* Left side - Empty or Logo */}
            <div className="flex items-center gap-4">
                {/* Removido: Dashboard title */}
            </div>

            {/* Right side - Notifications, User, Logout */}
            <div className="flex items-center gap-4">
                {/* Notifications Dropdown */}
                <NotificationDropdown />

                {/* User Profile */}
                <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.name || "Usuário"}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    <button
                        onClick={handleProfileClick}
                        className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 text-white ring-2 ring-white hover:ring-blue-300 transition-all"
                        title="Ver Perfil"
                    >
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="h-5 w-5" />
                        )}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Sair"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </header>
    );
}
