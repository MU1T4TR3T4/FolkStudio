"use client";
import { useEffect, useState } from "react";
import { getAllOrders, Order } from "@/lib/orders";
import { Download, Search, FileText, Calendar, Filter, User, ArrowLeft, Package } from "lucide-react";

interface GalleryItem {
    id: string;
    url: string;
    type: string; // 'mockup_frontal', 'art_original', 'pdf', etc.
    title: string;
    createdAt: string;
    orderId: string;
    clientName: string;
    user: string; // Who created/uploaded
    fileType: 'image' | 'pdf';
}

function resolveUrl(url: string): Promise<string | null> {
    if (!url) return Promise.resolve(null);
    return Promise.resolve(url);
}

export default function PurchaseOrdersPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [clientFilter, setClientFilter] = useState("todos");
    const [dateFilter, setDateFilter] = useState("todos");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    useEffect(() => {
        loadItems();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, clientFilter, dateFilter, items]);

    async function loadItems() {
        try {
            setLoading(true);
            const orders = await getAllOrders();
            const gallery: GalleryItem[] = [];

            for (const order of orders) {
                // Determine creator/user
                const creatorName = order.created_by || order.customer_name || "Sistema";

                const baseInfo = {
                    createdAt: (order as any).created_at || new Date().toISOString(),
                    orderId: order.id,
                    clientName: order.customer_name,
                    user: creatorName
                };

                // Only looking for PDFs
                if (order.pdf_url) {
                    gallery.push({
                        id: `${order.id}-pdf`,
                        url: order.pdf_url,
                        type: "pdf",
                        title: `Order PDF - #${order.id.slice(0, 6)}`,
                        fileType: "pdf",
                        ...baseInfo
                    });
                }
            }

            // Sort by date desc
            gallery.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setItems(gallery);

        } catch (error) {
            console.error("Error loading purchase orders:", error);
        } finally {
            setLoading(false);
        }
    }

    function applyFilters() {
        let result = items;

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(i =>
                i.clientName.toLowerCase().includes(lower) ||
                i.orderId.toLowerCase().includes(lower) ||
                i.user.toLowerCase().includes(lower)
            );
        }

        if (clientFilter !== "todos") {
            result = result.filter(i => i.clientName === clientFilter);
        }

        if (dateFilter !== "todos") {
            const now = new Date();
            const itemDate = (date: string) => new Date(date);

            if (dateFilter === "hoje") {
                result = result.filter(i => itemDate(i.createdAt).toDateString() === now.toDateString());
            } else if (dateFilter === "semana") {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                result = result.filter(i => itemDate(i.createdAt) >= weekAgo);
            } else if (dateFilter === "mes") {
                const monthAgo = new Date();
                monthAgo.setMonth(now.getMonth() - 1);
                result = result.filter(i => itemDate(i.createdAt) >= monthAgo);
            }
        }

        setFilteredItems(result);
    }

    const uniqueClients = Array.from(new Set(items.map(i => i.clientName))).sort();

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ordens de Compra</h1>
                <p className="text-gray-500 mt-2">Arquivo central de todas as ordens de compra (PDFs) geradas pelo sistema.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total de Arquivos</p>
                        <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, pedido, criador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${showAdvancedFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'hover:bg-gray-50'}`}
                    >
                        <Filter className="h-4 w-4" /> Filtros
                    </button>
                </div>

                {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Cliente</label>
                            <select
                                value={clientFilter}
                                onChange={e => setClientFilter(e.target.value)}
                                className="w-full mt-1 border rounded-md p-2 text-sm"
                            >
                                <option value="todos">Todos</option>
                                {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Data</label>
                            <select
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                className="w-full mt-1 border rounded-md p-2 text-sm"
                            >
                                <option value="todos">Qualquer data</option>
                                <option value="hoje">Hoje</option>
                                <option value="semana">Últimos 7 dias</option>
                                <option value="mes">Último Mês</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Gallery Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Carregando ordens de compra...</div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">Nenhuma ordem de compra encontrada.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filteredItems.map(item => (
                        <div key={item.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all hover:border-red-200">
                            {/* Preview */}
                            <div
                                className="aspect-[4/3] bg-red-50 relative cursor-pointer flex flex-col items-center justify-center p-4 group-hover:bg-red-100 transition-colors"
                                onClick={() => window.open(item.url, '_blank')}
                            >
                                <FileText className="h-16 w-16 text-red-500 mb-2 shadow-sm" />
                                <span className="text-xs font-medium text-red-700 bg-white/80 px-2 py-1 rounded-md">Abrir PDF</span>
                            </div>

                            {/* Info */}
                            <div className="p-3 bg-white border-t border-gray-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-red-100 text-red-700">
                                        ORDEM DE COMPRA
                                    </span>
                                </div>

                                <p className="font-semibold text-gray-900 text-sm truncate" title={item.clientName}>{item.clientName}</p>
                                <p className="text-xs text-gray-500 mb-1">Pedido #{item.orderId.split('-').pop() || item.orderId.slice(0, 8)}</p>

                                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50 text-[11px] text-gray-400">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
