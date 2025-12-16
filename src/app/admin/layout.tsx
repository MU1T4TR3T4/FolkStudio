"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    LayoutDashboard,
    Package,
    BarChart3,
    Users,
    Image as ImageIcon,
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [adminUser, setAdminUser] = useState("");

    useEffect(() => {
        // Verificar autenticação
        const auth = localStorage.getItem("folk_admin_auth");
        const user = localStorage.getItem("folk_admin_user");

        if (pathname === "/admin/login") {
            setLoading(false);
            return;
        }

        if (auth === "true" && user) {
            setIsAuthenticated(true);
            setAdminUser(user);
        } else {
            router.push("/admin/login");
        }
        setLoading(false);
    }, [pathname, router]);

    const handleLogout = () => {
        localStorage.removeItem("folk_admin_auth");
        localStorage.removeItem("folk_admin_user");
        toast.success("Logout realizado com sucesso!");
        router.push("/admin/login");
    };

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
        { icon: Package, label: "Pedidos", href: "/admin/pedidos" },
        { icon: Users, label: "Clientes", href: "/admin/clientes" },
        { icon: Users, label: "Funcionários", href: "/admin/funcionarios" },
        { icon: ImageIcon, label: "Estampas", href: "/admin/estampas" },
        { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
        { icon: BarChart3, label: "Relatórios", href: "/admin/relatorios" },
    ];

    // Página de login não usa o layout
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

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
        <div className="min-h-screen bg-[#f5f6f8]">
            <Toaster position="top-right" richColors />

            {/* Mobile Header */}
            <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h1 className="text-lg font-bold text-gray-900">Admin</h1>
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
                    <div className="p-6 border-b border-[#d0d4e4] bg-white">
                        <Image
                            src="/logo/folk-logo-sem-fundo1.png"
                            alt="FOLK Logo"
                            width={120}
                            height={48}
                            className="object-contain mb-2"
                        />
                        <p className="text-sm text-gray-700 mt-1">Olá, <span className="font-semibold text-purple-900">{adminUser}</span></p>
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
                                        flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md transition-all text-sm
                                        ${isActive
                                            ? 'bg-[#e5f4ff] text-[#0073ea] font-medium border-l-4 border-[#0073ea]'
                                            : 'text-[#323338] hover:bg-[#f5f6f8] border-l-4 border-transparent'
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
