"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    LayoutDashboard,
    Package,
    BarChart3,
    LogOut,
    Menu,
    X,
    Palette,
    PenTool
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { getCurrentUser, logout as authLogout } from "@/lib/auth";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            router.push('/login');
            setLoading(false);
            return;
        }

        // Verificar se usuário tem permissão para acessar workspace (equipe ou admin)
        if (currentUser.role !== 'equipe' && currentUser.role !== 'admin') {
            router.push('/login');
            setLoading(false);
            return;
        }

        setIsAuthenticated(true);
        setUser(currentUser);
        setLoading(false);
    }, [pathname, router]);

    const handleLogout = () => {
        authLogout();
        toast.success("Logout realizado com sucesso!");
        router.push("/login");
    };

    const handleProfileClick = () => {
        router.push("/workspace/perfil");
    };

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/workspace/dashboard" },
        { icon: Package, label: "Produção", href: "/workspace/pedidos" },
        { icon: BarChart3, label: "Pedidos", href: "/workspace/producao" },
        { icon: Palette, label: "Estampas", href: "/workspace/estampas" },
        { icon: PenTool, label: "Criar Estampa", href: "/workspace/studio" },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-500">Carregando...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <Toaster position="top-right" richColors />

            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
                <h1 className="text-lg font-bold text-gray-900">Workspace</h1>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                >
                    {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 border-b border-gray-200 flex justify-center">
                        <Image
                            src="/logo/folk-logo-sem-fundo1.png"
                            alt="FOLK Logo"
                            width={140}
                            height={56}
                            className="object-contain"
                        />
                    </div>

                    {/* Menu */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            // Check exact match or starts with for sub-routes
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                        ${isActive
                                            ? 'bg-purple-100 text-purple-700 font-medium shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    <Icon className={`h-5 w-5 ${isActive ? 'text-purple-700' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                        <Button
                            onClick={handleLogout}
                            variant="ghost"
                            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <LogOut className="h-5 w-5" />
                            Sair do Sistema
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Overlay para mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="lg:ml-64 min-h-screen flex flex-col">
                {/* Desktop Header with Profile */}
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex justify-end items-center shadow-sm">
                    {/* Profile Section */}
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200 ml-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                                {user?.full_name || "Usuário"}
                            </p>
                            <p className="text-xs text-gray-500">
                                {user?.role === 'admin' ? 'Administrador' : 'Equipe'}
                            </p>
                        </div>

                        <button
                            onClick={handleProfileClick}
                            className="relative flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md ring-2 ring-transparent hover:ring-purple-200 transition-all active:scale-95"
                            title="Meu Perfil"
                        >
                            {user?.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-sm font-bold">
                                    {user?.full_name?.charAt(0).toUpperCase() || "U"}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
