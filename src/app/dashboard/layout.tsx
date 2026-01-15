"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from "@/components/ui/Sidebar";
import { Header } from "@/components/ui/Header";
import { Toaster } from "sonner";
import { getCurrentUser } from '@/lib/auth';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = getCurrentUser();

        if (!user) {
            router.push('/login');
            return;
        }

        // Verificar se usuário tem permissão para acessar dashboard (vendedor ou admin)
        if (user.role !== 'vendedor' && user.role !== 'admin') {
            router.push('/login');
            return;
        }

        setIsAuthenticated(true);
        setLoading(false);
    }, [router]);

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
        <div className="flex h-screen bg-gray-50">
            <Toaster position="top-right" richColors />
            {/* Sidebar - Oculta em mobile (hidden), visível em desktop (md:block) */}
            <div className="hidden md:block h-full">
                <Sidebar />
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
