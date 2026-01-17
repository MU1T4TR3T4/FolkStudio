"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Download, Eye, Search, Filter, Calendar, User, Package, FileText, Palette } from "lucide-react";
import { toast, Toaster } from "sonner";
import { getAllOrders, Order } from "@/lib/orders"; // Use real data source
import { getImage } from "@/lib/storage";
import JSZip from "jszip";

interface GalleryItem {
    id: string;
    url: string;
    thumbnailUrl?: string; // For PDFs or generic files
    type: "estampa_frontal" | "estampa_costas" | "mockup_frontal" | "mockup_costas" | "arte_original" | "pdf" | "fotolito" | "logo";
    title: string;
    orderId: string;
    clientName: string;
    createdAt: string;
    user: string; // Who uploaded/created
    fileType: "image" | "pdf" | "other";
}

export default function EstampasPage() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [clientFilter, setClientFilter] = useState("todos");
    const [typeFilter, setTypeFilter] = useState("todos");
    const [dateFilter, setDateFilter] = useState("todos");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    useEffect(() => {
        loadGallery();
    }, []);

    useEffect(() => {
        filterGallery();
    }, [searchTerm, clientFilter, typeFilter, dateFilter, items]);

    async function loadGallery() {
        try {
            setLoading(true);
            const orders = await getAllOrders();
            const gallery: GalleryItem[] = [];

            for (const order of orders) {
                const baseInfo = {
                    orderId: order.id,
                    clientName: order.customer_name || "Cliente Desconhecido",
                    createdAt: order.created_at,
                    user: (order as any).created_by || order.customer_name || "Desconhecido", // Fallback for creator
                };

                // Helper to resolve URL
                const resolveUrl = async (url?: string) => {
                    if (!url) return null;
                    if (url.startsWith("idb:")) return await getImage(url.replace("idb:", ""));
                    return url;
                };

                // 1. Mockup Frontal / Estampa Frontal
                if (order.image_url) {
                    const url = await resolveUrl(order.image_url);
                    if (url) {
                        gallery.push({
                            id: `${order.id}-front`,
                            url,
                            type: "mockup_frontal",
                            title: `Frontal - #${order.id.slice(0, 6)}`,
                            fileType: "image",
                            ...baseInfo
                        });
                    }
                }

                // 2. Mockup Costas / Estampa Costas
                if (order.back_image_url || (order as any).backImageUrl) {
                    const url = await resolveUrl(order.back_image_url || (order as any).backImageUrl);
                    if (url) {
                        gallery.push({
                            id: `${order.id}-back`,
                            url,
                            type: "mockup_costas",
                            title: `Costas - #${order.id.slice(0, 6)}`,
                            fileType: "image",
                            ...baseInfo
                        });
                    }
                }

                // 3. PDF
                if (order.pdf_url) {
                    // PDF URLs usually direct links, no idb resolution typically needed for Supabase storage unless private
                    // Assuming public or signed urls for simplicity here, or just storing the link
                    gallery.push({
                        id: `${order.id}-pdf`,
                        url: order.pdf_url,
                        type: "pdf",
                        title: `PDF - #${order.id.slice(0, 6)}`,
                        fileType: "pdf",
                        ...baseInfo
                    });
                }

                // 4. Logos
                if (order.logo_front_url) {
                    const url = await resolveUrl(order.logo_front_url);
                    if (url) {
                        gallery.push({
                            id: `${order.id}-logo-front`,
                            url,
                            type: "logo",
                            title: `Logo Frontal - #${order.id.slice(0, 6)}`,
                            fileType: "image",
                            ...baseInfo
                        });
                    }
                }

                if (order.logo_back_url) {
                    const url = await resolveUrl(order.logo_back_url);
                    if (url) {
                        gallery.push({
                            id: `${order.id}-logo-back`,
                            url,
                            type: "logo",
                            title: `Logo Costas - #${order.id.slice(0, 6)}`,
                            fileType: "image",
                            ...baseInfo
                        });
                    }
                }
            }

            // Sort by date desc
            gallery.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setItems(gallery);
            setFilteredItems(gallery);
        } catch (error) {
            console.error("Erro ao carregar galeria:", error);
            toast.error("Erro ao carregar biblioteca de estampas");
        } finally {
            setLoading(false);
        }
    }

    function filterGallery() {
        let result = [...items];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (item) =>
                    item.clientName.toLowerCase().includes(term) ||
                    item.orderId.toLowerCase().includes(term) ||
                    item.title.toLowerCase().includes(term) ||
                    item.user.toLowerCase().includes(term)
            );
        }

        if (clientFilter !== "todos") {
            result = result.filter((item) => item.clientName === clientFilter);
        }

        if (typeFilter !== "todos") {
            result = result.filter((item) => item.type === typeFilter); // Strict type check or group check
        }

        if (dateFilter !== "todos") {
            const now = new Date();
            result = result.filter((item) => {
                const itemDate = new Date(item.createdAt);
                switch (dateFilter) {
                    case "hoje": return itemDate.toDateString() === now.toDateString();
                    case "semana": return itemDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    case "mes": return itemDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    default: return true;
                }
            });
        }

        setFilteredItems(result);
    }

    async function downloadAll() {
        if (filteredItems.length === 0) return;

        try {
            toast.loading("Preparando download...");
            const zip = new JSZip();

            // Limit for performance if too many
            const downloadList = filteredItems.slice(0, 50); // Safe limit for browser

            for (const item of downloadList) {
                if (item.fileType === 'pdf') continue; // Skip PDFs for zip generation in browser for now to avoid cors/complexity issues or handle separately

                try {
                    // Handle Base64 vs URL
                    let data: any = item.url;
                    if (item.url.startsWith('http')) {
                        const response = await fetch(item.url);
                        data = await response.blob();
                    } else if (item.url.startsWith('data:')) {
                        data = item.url.split(",")[1];
                    }

                    const ext = item.fileType === 'image' ? 'png' : 'txt'; // Default
                    const filename = `${item.title.replace(/[^a-z0-9]/gi, '_')}.${ext}`;

                    zip.file(filename, data, item.url.startsWith('data:') ? { base64: true } : {});
                } catch (e) {
                    console.error("Falha ao baixar item", item, e);
                }
            }

            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `estampas_selecao_${new Date().toISOString().split("T")[0]}.zip`;
            link.click();

            toast.dismiss();
            toast.success("Download concluído!");
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error("Erro ao gerar ZIP");
        }
    }

    // Unique values for filters
    const uniqueClients = Array.from(new Set(items.map(i => i.clientName)));

    // Stats
    const totalItems = items.length;
    const thisMonth = items.filter(i => {
        const d = new Date(i.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Estampas e Arquivos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Repositório central de todos os mockups, artes e arquivos anexados aos pedidos
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                        <ImageIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Total de Arquivos</p>
                        <p className="text-2xl font-bold text-gray-900">{items.filter(i => i.fileType !== 'pdf').length}</p>
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
                            <label className="text-xs font-semibold text-gray-500 uppercase">Tipo de Arquivo</label>
                            <select
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                className="w-full mt-1 border rounded-md p-2 text-sm"
                            >
                                <option value="todos">Todos</option>
                                <option value="mockup_frontal">Mockup Frontal</option>
                                <option value="mockup_costas">Mockup Costas</option>
                                <option value="art_original">Arte Original</option>
                                <option value="pdf">PDF</option>
                                <option value="logo">Logo</option>
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

            {loading ? (
                <div className="text-center py-20 text-gray-500">Carregando biblioteca...</div>
            ) : filteredItems.filter(i => i.fileType !== 'pdf').length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">Nenhuma estampa ou mockup encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filteredItems.filter(i => i.fileType !== 'pdf').map(item => (
                        <div key={item.id} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                            {/* Preview */}
                            <div
                                className="aspect-square bg-gray-100 relative cursor-pointer flex items-center justify-center p-4"
                                onClick={() => setSelectedItem(item)}
                            >
                                <img
                                    src={item.url}
                                    alt={item.title}
                                    className="w-full h-full object-contain"
                                />

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button className="p-2 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform">
                                        <Eye className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-3 bg-white border-t border-gray-100">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider
                                        ${item.type.includes('mockup') ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}
                                     `}>
                                        {item.type.replace(/_/g, ' ').replace('mockup', 'MKP').replace('frontal', 'FRENTE').replace('costas', 'COSTAS')}
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

            {/* Lightbox Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedItem(null)}>
                    <div className="relative max-w-5xl w-full max-h-[90vh] bg-white rounded-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b">
                            <div>
                                <h3 className="font-bold text-lg">{selectedItem.title}</h3>
                                <p className="text-sm text-gray-500">Enviado por {selectedItem.user} em {new Date(selectedItem.createdAt).toLocaleString()}</p>
                            </div>
                            <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-100 rounded-full">✕</button>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-50 p-4 flex items-center justify-center">
                            <img src={selectedItem.url} alt={selectedItem.title} className="max-w-full max-h-[70vh] object-contain shadow-lg" />
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <a
                                href={selectedItem.url}
                                download
                                target="_blank"
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                <Download className="h-4 w-4" /> Baixar Arquivo
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

