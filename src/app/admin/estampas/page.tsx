"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Download, Eye, Search, Filter, Calendar, User, Package } from "lucide-react";
import { toast, Toaster } from "sonner";
import { getImage } from "@/lib/storage";
import JSZip from "jszip";

interface Stamp {
    id: string;
    imageUrl: string;
    orderId: string;
    clientName: string;
    createdAt: string;
    type: "frontal" | "costas";
    color: string;
    material: string;
    idbKey: string;
}

interface Order {
    id: string;
    artImageUrl?: string | null;
    backArtImageUrl?: string | null;
    clientName?: string;
    createdAt: string;
    color: string;
    material: string;
}

export default function EstampasPage() {
    const [stamps, setStamps] = useState<Stamp[]>([]);
    const [filteredStamps, setFilteredStamps] = useState<Stamp[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStamp, setSelectedStamp] = useState<Stamp | null>(null);

    // Filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [clientFilter, setClientFilter] = useState("todos");
    const [typeFilter, setTypeFilter] = useState<"todos" | "frontal" | "costas">("todos");
    const [dateFilter, setDateFilter] = useState("todos");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    useEffect(() => {
        loadStamps();
    }, []);

    useEffect(() => {
        filterStamps();
    }, [searchTerm, clientFilter, typeFilter, dateFilter, stamps]);

    async function loadStamps() {
        try {
            setLoading(true);
            const savedOrders = localStorage.getItem("folk_studio_orders");
            if (!savedOrders) {
                setStamps([]);
                setFilteredStamps([]);
                setLoading(false);
                return;
            }

            const orders: Order[] = JSON.parse(savedOrders);
            const loadedStamps: Stamp[] = [];

            for (const order of orders) {
                // Arte frontal
                if (order.artImageUrl) {
                    const key = order.artImageUrl.replace("idb:", "");
                    const imageUrl = await getImage(key);
                    if (imageUrl) {
                        loadedStamps.push({
                            id: `${order.id}-front`,
                            imageUrl,
                            orderId: order.id,
                            clientName: order.clientName || "Cliente",
                            createdAt: order.createdAt,
                            type: "frontal",
                            color: order.color,
                            material: order.material,
                            idbKey: key,
                        });
                    }
                }

                // Arte costas
                if (order.backArtImageUrl) {
                    const key = order.backArtImageUrl.replace("idb:", "");
                    const imageUrl = await getImage(key);
                    if (imageUrl) {
                        loadedStamps.push({
                            id: `${order.id}-back`,
                            imageUrl,
                            orderId: order.id,
                            clientName: order.clientName || "Cliente",
                            createdAt: order.createdAt,
                            type: "costas",
                            color: order.color,
                            material: order.material,
                            idbKey: key,
                        });
                    }
                }
            }

            setStamps(loadedStamps);
            setFilteredStamps(loadedStamps);
        } catch (error) {
            console.error("Erro ao carregar estampas:", error);
            toast.error("Erro ao carregar estampas");
        } finally {
            setLoading(false);
        }
    }

    function filterStamps() {
        let result = [...stamps];

        // Busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (s) =>
                    s.clientName.toLowerCase().includes(term) ||
                    s.orderId.toLowerCase().includes(term)
            );
        }

        // Cliente
        if (clientFilter !== "todos") {
            result = result.filter((s) => s.clientName === clientFilter);
        }

        // Tipo
        if (typeFilter !== "todos") {
            result = result.filter((s) => s.type === typeFilter);
        }

        // Data
        if (dateFilter !== "todos") {
            const now = new Date();
            result = result.filter((s) => {
                const stampDate = new Date(s.createdAt);
                switch (dateFilter) {
                    case "hoje":
                        return stampDate.toDateString() === now.toDateString();
                    case "semana":
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return stampDate >= weekAgo;
                    case "mes":
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return stampDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        setFilteredStamps(result);
    }

    function downloadStamp(stamp: Stamp) {
        const link = document.createElement("a");
        link.href = stamp.imageUrl;
        link.download = `estampa-${stamp.clientName}-${stamp.orderId}-${stamp.type}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download iniciado!");
    }

    async function downloadAllStamps() {
        if (filteredStamps.length === 0) {
            toast.error("Nenhuma estampa para baixar");
            return;
        }

        try {
            toast.loading("Preparando download...");
            const zip = new JSZip();

            filteredStamps.forEach((stamp) => {
                const base64Data = stamp.imageUrl.split(",")[1];
                const filename = `${stamp.clientName}-${stamp.orderId}-${stamp.type}.png`;
                zip.file(filename, base64Data, { base64: true });
            });

            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `estampas-${new Date().toISOString().split("T")[0]}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.dismiss();
            toast.success(`${filteredStamps.length} estampas baixadas!`);
        } catch (error) {
            console.error("Erro ao criar ZIP:", error);
            toast.dismiss();
            toast.error("Erro ao criar arquivo ZIP");
        }
    }

    // Obter clientes únicos
    const uniqueClients = Array.from(new Set(stamps.map((s) => s.clientName)));

    // Stats
    const thisMonthStamps = stamps.filter((s) => {
        const stampDate = new Date(s.createdAt);
        const now = new Date();
        return (
            stampDate.getMonth() === now.getMonth() &&
            stampDate.getFullYear() === now.getFullYear()
        );
    }).length;

    const uniqueClientsCount = uniqueClients.length;

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Estampas</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Todas as artes criadas pelos clientes
                    </p>
                </div>
                <button
                    onClick={downloadAllStamps}
                    disabled={filteredStamps.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="h-4 w-4" />
                    Baixar Todas ({filteredStamps.length})
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <ImageIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total de Estampas</p>
                            <p className="text-2xl font-bold text-gray-900">{stamps.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Este Mês</p>
                            <p className="text-2xl font-bold text-gray-900">{thisMonthStamps}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <User className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Clientes</p>
                            <p className="text-2xl font-bold text-gray-900">{uniqueClientsCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou pedido..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`px-3 py-2 border rounded-lg transition-colors ${showAdvancedFilters
                                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        Filtros Avançados
                    </button>
                </div>

                {/* Filtros Avançados */}
                {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cliente
                            </label>
                            <select
                                value={clientFilter}
                                onChange={(e) => setClientFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="todos">Todos os Clientes</option>
                                {uniqueClients.map((client) => (
                                    <option key={client} value={client}>
                                        {client}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo
                            </label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as any)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="todos">Todos os Tipos</option>
                                <option value="frontal">Frontal</option>
                                <option value="costas">Costas</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Período
                            </label>
                            <select
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="todos">Todos os Períodos</option>
                                <option value="hoje">Hoje</option>
                                <option value="semana">Última Semana</option>
                                <option value="mes">Último Mês</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Grade de Estampas */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">Carregando estampas...</div>
                </div>
            ) : filteredStamps.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                        {stamps.length === 0
                            ? "Nenhuma estampa encontrada. As estampas aparecerão aqui quando os clientes criarem pedidos."
                            : "Nenhuma estampa encontrada com os filtros aplicados."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredStamps.map((stamp) => (
                        <div
                            key={stamp.id}
                            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Imagem */}
                            <div className="aspect-square bg-gray-50 relative group cursor-pointer"
                                onClick={() => setSelectedStamp(stamp)}
                            >
                                <img
                                    src={stamp.imageUrl}
                                    alt={`Estampa ${stamp.type}`}
                                    className="w-full h-full object-contain p-2"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="h-8 w-8 text-white" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-gray-900 truncate">
                                        {stamp.clientName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Package className="h-4 w-4" />
                                    <span className="truncate">#{stamp.orderId.slice(0, 8)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(stamp.createdAt).toLocaleDateString("pt-BR")}</span>
                                </div>
                                <div className="pt-2">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${stamp.type === "frontal"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-purple-100 text-purple-700"
                                            }`}
                                    >
                                        {stamp.type === "frontal" ? "Frontal" : "Costas"}
                                    </span>
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="px-4 pb-4 flex gap-2">
                                <button
                                    onClick={() => downloadStamp(stamp)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                                >
                                    <Download className="h-4 w-4" />
                                    Baixar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Visualização */}
            {selectedStamp && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedStamp(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {selectedStamp.clientName} - {selectedStamp.type === "frontal" ? "Frontal" : "Costas"}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Pedido #{selectedStamp.orderId.slice(0, 8)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedStamp(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 flex items-center justify-center bg-gray-50">
                            <img
                                src={selectedStamp.imageUrl}
                                alt="Estampa"
                                className="max-w-full max-h-[60vh] object-contain"
                            />
                        </div>
                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => downloadStamp(selectedStamp)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                            >
                                <Download className="h-4 w-4" />
                                Baixar Estampa
                            </button>
                            <button
                                onClick={() => setSelectedStamp(null)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
