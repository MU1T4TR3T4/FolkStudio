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
    UserCog,
    BadgeDollarSign,
    Image as ImageIcon,
    ClipboardList,
    Settings,
    LogOut,
    Menu,
    X,
    FileText
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
    const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Listen for profile updates
    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        const checkProfile = () => {
            const display = localStorage.getItem("folk_admin_display_name");
            const avatar = localStorage.getItem("folk_admin_avatar");

            if (display) setAdminUser(display);
            if (avatar) setAdminAvatar(avatar);
        };

        window.addEventListener('storage', checkProfile);
        // Also check on mount
        checkProfile();

        return () => window.removeEventListener('storage', checkProfile);
    }, []);
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
            const avatar = localStorage.getItem("folk_admin_avatar");
            if (avatar) setAdminAvatar(avatar);
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
        { icon: Package, label: "Produção", href: "/admin/pedidos" },
        { icon: ClipboardList, label: "Pedidos", href: "/admin/lista-pedidos" },
        { icon: Users, label: "Clientes", href: "/admin/clientes" },
        { icon: UserCog, label: "Equipe", href: "/admin/funcionarios" },
        { icon: BadgeDollarSign, label: "Vendedores", href: "/admin/vendedores" },
        { icon: ImageIcon, label: "Estampas", href: "/admin/estampas" },
        { icon: FileText, label: "Ordens de Compra", href: "/admin/ordens-compra" },
        // { icon: Settings, label: "Configurações", href: "/admin/configuracoes" }, // Hidden as requested
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
        <div className="min-h-screen bg-[#f5f6f8] flex">
            <Toaster position="top-right" richColors />

            {/* Sidebar */}
            <aside className={`
                fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}>
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 border-b border-[#d0d4e4] bg-white flex justify-center">
                        <Image
                            src="/logo/folk-logo-sem-fundo1.png"
                            alt="FOLK Logo"
                            width={120}
                            height={48}
                            className="object-contain"
                        />
                    </div>

                    {/* Menu */}
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            // Check if active or if creating a sub-resource
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

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

                    {/* Logout in Sidebar (Optional, keeping as fallback or removing?) 
                        Let's keep typical sidebar footer or remove since we have header profile.
                        Refactoring to minimal sidebar.
                    */}
                </div>
            </aside>

            {/* Overlay para mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content Wrapper */}
            <div className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">

                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between shadow-sm">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 lg:hidden text-gray-600"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    {/* Spacer / Title (Optional) */}
                    <div className="hidden lg:block">
                        {/* Breadcrumbs or Page Title could go here */}
                    </div>

                    {/* Right Side: Profile */}
                    <div className="flex items-center gap-4 ml-auto">
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                            >
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-semibold text-gray-900 leading-none">{adminUser}</p>
                                    <p className="text-xs text-gray-500 mt-1">Administrador</p>
                                </div>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold shadow-sm overflow-hidden ${!adminAvatar ? 'bg-indigo-100 text-indigo-700' : ''}`}>
                                    {adminAvatar ? (
                                        <img src={adminAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        adminUser.substring(0, 2).toUpperCase()
                                    )}
                                </div>
                            </button>

                            {/* Dropdown */}
                            {isProfileOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-30 cursor-default"
                                        onClick={() => setIsProfileOpen(false)}
                                    />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-40 animate-in fade-in zoom-in-95 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                                            <p className="text-sm font-semibold text-gray-900">{adminUser}</p>
                                            <p className="text-xs text-gray-500">Administrador</p>
                                        </div>

                                        <Link
                                            href="/admin/perfil"
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                                        >
                                            <UserCog className="h-4 w-4" />
                                            Meu Perfil
                                        </Link>

                                        <div className="h-px bg-gray-50 my-1" />

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sair
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 lg:p-8 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
