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
    const [employeeUser, setEmployeeUser] = useState("");

    useEffect(() => {
        const user = getCurrentUser();

        if (!user) {
            router.push('/login');
            setLoading(false);
            return;
        }

        // Verificar se usuário tem permissão para acessar workspace (equipe ou admin)
        if (user.role !== 'equipe' && user.role !== 'admin') {
            router.push('/login');
            setLoading(false);
            return;
        }

        setIsAuthenticated(true);
        setEmployeeUser(user.full_name);
        setLoading(false);
    }, [pathname, router]);

    const handleLogout = () => {
        authLogout();
        toast.success("Logout realizado com sucesso!");
        router.push("/login");
    };

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/workspace/dashboard" },
        { icon: Package, label: "Pedidos", href: "/workspace/pedidos" },
        { icon: BarChart3, label: "Produção", href: "/workspace/producao" },
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
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" richColors />

            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
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
                    <div className="p-6 border-b border-gray-200">
                        <Image
                            src="/logo/folk-logo-sem-fundo1.png"
                            alt="FOLK Logo"
                            width={120}
                            height={48}
                            className="object-contain mb-2"
                        />
                        <p className="text-sm text-gray-500 mt-1">Olá, {employeeUser}</p>
                        <p className="text-xs text-gray-400">Funcionário</p>
                    </div>

                    {/* Menu */}
                    <nav className="flex-1 p-4 space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                        ${isActive
                                            ? 'bg-purple-100/30 text-purple-900 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-gray-200">
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="w-full justify-start gap-3"
                        >
                            <LogOut className="h-5 w-5" />
                            Sair
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

            {/* Main Content */}
            <main className="lg:ml-64 p-6">
                {children}
            </main>
        </div>
    );
}
