import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const recentDesigns = [
    { id: 1, name: "Camiseta Logo Azul", type: "Estampa Frontal", image: "/imagens dashboard/camiseta-logo-azul.png" },
    { id: 2, name: "Camiseta Evento Tech", type: "Full Print", image: "/imagens dashboard/camiseta-evento-tech.png" },
    { id: 3, name: "Uniforme Staff", type: "Bordado", image: "/imagens dashboard/camiseta-staff.png" },
    { id: 4, name: "Camiseta Minimalista", type: "Estampa Costas", image: "/imagens dashboard/camiseta-minimalista.png" },
    { id: 5, name: "Edição Limitada", type: "Estampa Frontal", image: "/imagens dashboard/camiseta-edicao-limitada.png" },
    { id: 6, name: "Camiseta Básica", type: "Sem Estampa", image: "/imagens dashboard/camiseta-basica.png" },
];

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Cabeçalho da Página */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Coleções Recentes</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Veja algumas das últimas camisas personalizadas produzidas pela nossa equipe.
                    </p>
                </div>
                <Link href="/dashboard/studio">
                    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                        <Plus className="h-4 w-4" />
                        Criar Nova Arte
                    </Button>
                </Link>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {recentDesigns.map((design) => (
                    <div
                        key={design.id}
                        className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-blue-200"
                    >
                        <div className="aspect-square w-full overflow-hidden bg-gray-100 relative">
                            {/* Overlay no hover */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors z-10" />
                            <img
                                src={design.image}
                                alt={design.name}
                                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {design.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{design.type}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
