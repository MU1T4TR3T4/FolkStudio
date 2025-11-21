import React from 'react';
import { Sidebar } from "@/components/ui/Sidebar";
import { Header } from "@/components/ui/Header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-50">
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
