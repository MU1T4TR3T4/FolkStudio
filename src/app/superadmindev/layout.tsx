"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ShieldAlert, LogOut, Database, Users, HardDrive } from "lucide-react";
import { Toaster, toast } from "sonner";
import Link from 'next/link';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Bypass check for login page
        if (pathname === "/superadmindev/login") {
            setLoading(false);
            return;
        }

        const auth = localStorage.getItem("folk_superadmin_auth");
        if (auth !== "true") {
            router.push("/superadmindev/login");
        } else {
            setLoading(false);
        }
    }, [pathname, router]);

    const handleLogout = () => {
        localStorage.removeItem("folk_superadmin_auth");
        localStorage.removeItem("folk_superadmin_user");
        toast.info("Logout realizado");
        router.push("/superadmindev/login");
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500 font-mono">LOADING SYSTEM...</div>;

    if (pathname === "/superadmindev/login") return <>{children}</>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-mono">
            <Toaster position="top-right" theme="dark" />

            {/* Header */}
            <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur fixed top-0 w-full z-50 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="h-6 w-6 text-red-500" />
                    <span className="font-bold text-lg tracking-wider">SUPER<span className="text-red-500">ADMIN</span>.DEV</span>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-xs text-slate-500">
                        <span className="text-green-500">●</span> SYSTEM ONLINE
                    </div>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Sidebar */}
            <aside className="w-64 fixed left-0 top-16 h-[calc(100vh-64px)] border-r border-slate-800 bg-slate-900/30 p-4">
                <nav className="space-y-2">
                    <Link href="/superadmindev" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === '/superadmindev' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'hover:bg-slate-900 text-slate-400'}`}>
                        <Database className="h-5 w-5" />
                        <span>System Control</span>
                    </Link>
                    <Link href="/superadmindev/admins" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname === '/superadmindev/admins' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'hover:bg-slate-900 text-slate-400'}`}>
                        <Users className="h-5 w-5" />
                        <span>Admins</span>
                    </Link>
                    {/* Add more links if needed */}
                </nav>
            </aside>

            {/* Main */}
            <main className="ml-64 pt-16 min-h-screen p-8">
                {children}
            </main>
        </div>
    );
}
