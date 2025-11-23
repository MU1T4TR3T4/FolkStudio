"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirecionar /admin para /admin/dashboard
        router.push("/admin/dashboard");
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-500">Redirecionando...</p>
        </div>
    );
}
