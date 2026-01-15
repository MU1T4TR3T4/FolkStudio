"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { StudioContent } from "@/app/dashboard/studio/page";
import MockupSelector from "@/components/dashboard/MockupSelector";

function WorkspaceStudioContent() {
    const searchParams = useSearchParams();
    const hasMockup = searchParams.has("mockup") || searchParams.has("edit_design_id");

    if (hasMockup) {
        return <StudioContent />;
    }

    return <MockupSelector basePath="/workspace/studio" />;
}

export default function WorkspaceStudioPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-50"><div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#7D4CDB] mb-4"></div><p className="text-lg text-gray-600">Carregando...</p></div></div>}>
            <WorkspaceStudioContent />
        </Suspense>
    );
}
