"use client";

import { Suspense, useEffect, useState } from "react";
import { EstampasContent } from "@/app/dashboard/estampas/page";

function WorkspaceEstampasContent() {
    const [user, setUser] = useState<string | undefined>(undefined);

    useEffect(() => {
        const storedUser = localStorage.getItem("folk_employee_user");
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    // Wait for user to be loaded to ensure filtering works on initial load if critical, 
    // but here we render immediately. If user is null, it shows all (or we could wait).
    // According to request "apareça somente as estampas... desse usuário", we should probably wait or default to empty if not loaded?
    // But since it's client side, the effect runs quickly.

    // Better to pass the user only if it exists. 
    // If we want to STRICTLY show only the user's stamps, we should perhaps show nothing until we know the user.
    // However, for simplicity using the same component:

    if (!user) {
        return <div className="p-8 text-center text-gray-500">Carregando informações do usuário...</div>;
    }

    return <EstampasContent filterUser={user} />;
}

export default function WorkspaceEstampasPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Carregando...</div>}>
            <WorkspaceEstampasContent />
        </Suspense>
    );
}
