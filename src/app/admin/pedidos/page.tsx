"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Clock, CheckCircle, Archive, Search, Filter, Plus, LayoutGrid, List, Calendar } from "lucide-react";
import KanbanColumn from "@/components/admin/KanbanColumn";
import OrderCard from "@/components/admin/OrderCard";
import { toast, Toaster } from "sonner";
import OrderDetailsModal from "@/components/admin/OrderDetailsModal";
import { getImage } from "@/lib/storage";

interface Order {
    id: string;
    imageUrl: string;
    backImageUrl?: string | null;
    artImageUrl?: string | null;
    backArtImageUrl?: string | null;
    color: string;
    material: string;
    sizes: Record<string, number>;
    totalQty: number;
    observations: string | null;
    status: string;
    createdAt: string;
    adminStatus?: "novo" | "producao" | "pronto" | "entregue";
    checklist?: {
        conferirArte: boolean;
        separarCamiseta: boolean;
        impressao: boolean;
        prensar: boolean;
        empacotar: boolean;
    };
    clientName?: string;
    clientPhone?: string;
    responsible?: string; // NOVO: Responsável pela produção
}

interface StatusLog {
    id: string;
    orderId: string;
    from: string;
    to: string;
    timestamp: string;
    user: string;
}

type ViewMode = "kanban" | "table";

export default function AdminPedidosPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");
    const [viewMode, setViewMode] = useState<ViewMode>("kanban");

    // NOVOS FILTROS
    const [colorFilter, setColorFilter] = useState<string>("todas");
    const [sizeFilter, setSizeFilter] = useState<string>("todos");
    const [dateFilter, setDateFilter] = useState<string>("todos");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [searchTerm, statusFilter, colorFilter, sizeFilter, dateFilter, orders]);

    async function loadOrders() {
        try {
            const savedOrders = localStorage.getItem("folk_studio_orders");
            if (savedOrders) {
                const parsedOrders: Order[] = JSON.parse(savedOrders);

                // Carregar imagens do IDB se necessário
                const processedOrders = await Promise.all(parsedOrders.map(async (order) => {
                    const newOrder = { ...order };

                    if (newOrder.imageUrl?.startsWith('idb:')) {
                        const key = newOrder.imageUrl.replace('idb:', '');
                        const img = await getImage(key);
                        if (img) newOrder.imageUrl = img;
                    }
                    if (newOrder.backImageUrl?.startsWith('idb:')) {
                        const key = newOrder.backImageUrl.replace('idb:', '');
                        const img = await getImage(key);
                        if (img) newOrder.backImageUrl = img;
                    }
                    if (newOrder.artImageUrl?.startsWith('idb:')) {
                        const key = newOrder.artImageUrl.replace('idb:', '');
                        const img = await getImage(key);
                        if (img) newOrder.artImageUrl = img;
                    }
                    if (newOrder.backArtImageUrl?.startsWith('idb:')) {
                        const key = newOrder.backArtImageUrl.replace('idb:', '');
                        const img = await getImage(key);
                        if (img) newOrder.backArtImageUrl = img;
                    }

                    return newOrder;
                }));

                setOrders(processedOrders);
                setFilteredOrders(processedOrders);
            }
        } catch (error) {
            console.error("Erro ao carregar pedidos:", error);
            toast.error("Erro ao carregar pedidos");
        }
    }

    function filterOrders() {
        let result = [...orders];

        // Filtro por busca (ID ou cliente)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(order =>
                order.id.toLowerCase().includes(term) ||
                order.clientName?.toLowerCase().includes(term)
            );
        }

        // Filtro por status
        if (statusFilter !== "todos") {
            result = result.filter(order =>
                (order.adminStatus || "novo") === statusFilter
            );
        }

        // NOVO: Filtro por cor
        if (colorFilter !== "todas") {
            result = result.filter(order => order.color === colorFilter);
        }

        // NOVO: Filtro por tamanho
        if (sizeFilter !== "todos") {
            result = result.filter(order => {
                const sizes = Object.keys(order.sizes || {});
                return sizes.includes(sizeFilter);
            });
        }

        // NOVO: Filtro por data
        if (dateFilter !== "todos") {
            const now = new Date();
            result = result.filter(order => {
                const orderDate = new Date(order.createdAt);
                switch (dateFilter) {
                    case "hoje":
                        return orderDate.toDateString() === now.toDateString();
                    case "semana":
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return orderDate >= weekAgo;
                    case "mes":
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return orderDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        setFilteredOrders(result);
    }

    function updateOrderStatus(orderId: string, newStatus: "novo" | "producao" | "pronto" | "entregue") {
        try {
            const updatedOrders = orders.map(order =>
                order.id === orderId
                    ? { ...order, adminStatus: newStatus }
                    : order
            );

            setOrders(updatedOrders);

            // Salvar no localStorage (mantendo referências idb:)
            const ordersToSave = updatedOrders.map(order => {
                const orderToSave: any = { ...order };

                if (orderToSave.imageUrl?.startsWith('data:')) {
                    const originalOrder = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]")
                        .find((o: any) => o.id === order.id);
                    if (originalOrder?.imageUrl) {
                        orderToSave.imageUrl = originalOrder.imageUrl;
                    }
                }
                if (orderToSave.backImageUrl?.startsWith('data:')) {
                    const originalOrder = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]")
                        .find((o: any) => o.id === order.id);
                    if (originalOrder?.backImageUrl) {
                        orderToSave.backImageUrl = originalOrder.backImageUrl;
                    }
                }
                if (orderToSave.artImageUrl?.startsWith('data:')) {
                    const originalOrder = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]")
                        .find((o: any) => o.id === order.id);
                    if (originalOrder?.artImageUrl) {
                        orderToSave.artImageUrl = originalOrder.artImageUrl;
                    }
                }
                if (orderToSave.backArtImageUrl?.startsWith('data:')) {
                    const originalOrder = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]")
                        .find((o: any) => o.id === order.id);
                    if (originalOrder?.backArtImageUrl) {
                        orderToSave.backArtImageUrl = originalOrder.backArtImageUrl;
                    }
                }

                return orderToSave;
            });

            localStorage.setItem("folk_studio_orders", JSON.stringify(ordersToSave));

            // Registrar log de mudança de status
            const adminUser = localStorage.getItem("folk_admin_user") || "Admin";
            const oldStatus = orders.find(o => o.id === orderId)?.adminStatus || "novo";

            const newLog: StatusLog = {
                id: crypto.randomUUID(),
                orderId,
                from: oldStatus,
                to: newStatus,
                timestamp: new Date().toISOString(),
                user: adminUser
            };

            const savedLogs = localStorage.getItem("folk_admin_status_logs");
            const logs = savedLogs ? JSON.parse(savedLogs) : [];
            logs.push(newLog);
            localStorage.setItem("folk_admin_status_logs", JSON.stringify(logs));

            const statusNames = {
                novo: "Novo",
                producao: "Em Produção",
                pronto: "Pronto",
                entregue: "Entregue"
            };

            toast.success(`Pedido movido para ${statusNames[newStatus]}`);

            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, adminStatus: newStatus });
            }

        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Erro ao atualizar status");
        }
    }

    const getOrdersByStatus = (status: "novo" | "producao" | "pronto" | "entregue") => {
        return filteredOrders.filter(order => (order.adminStatus || "novo") === status);
    };

    const handleOrderClick = (order: Order) => {
        setSelectedOrder(order);
    };

    const handleUpdateOrder = (updatedOrder: Order) => {
        const updatedOrders = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        setOrders(updatedOrders);

        const ordersToSave = updatedOrders.map(order => {
            const orderToSave: any = { ...order };

            if (orderToSave.imageUrl?.startsWith('data:')) {
                const originalOrder = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]")
                    .find((o: any) => o.id === order.id);
                if (originalOrder?.imageUrl) {
                    orderToSave.imageUrl = originalOrder.imageUrl;
                }
            }
            if (orderToSave.backImageUrl?.startsWith('data:')) {
                const originalOrder = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]")
                    .find((o: any) => o.id === order.id);
                if (originalOrder?.backImageUrl) {
                    orderToSave.backImageUrl = originalOrder.backImageUrl;
                }
            }
            if (orderToSave.artImageUrl?.startsWith('data:')) {
                const originalOrder = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]")
                    .find((o: any) => o.id === order.id);
                if (originalOrder?.artImageUrl) {
                    orderToSave.artImageUrl = originalOrder.artImageUrl;
                }
            }
            if (orderToSave.backArtImageUrl?.startsWith('data:')) {
                const originalOrder = JSON.parse(localStorage.getItem("folk_studio_orders") || "[]")
                    .find((o: any) => o.id === order.id);
                if (originalOrder?.backArtImageUrl) {
                    orderToSave.backArtImageUrl = originalOrder.backArtImageUrl;
                }
            }

            return orderToSave;
        });

        localStorage.setItem("folk_studio_orders", JSON.stringify(ordersToSave));

        if (selectedOrder && selectedOrder.id === updatedOrder.id) {
            setSelectedOrder(updatedOrder);
        }
    };

    const getStatusBadge = (status?: string) => {
        const badges: Record<string, { label: string; class: string }> = {
            novo: { label: "Novo", class: "bg-blue-100 text-blue-700" },
            producao: { label: "Em Produção", class: "bg-yellow-100 text-yellow-700" },
            pronto: { label: "Pronto", class: "bg-green-100 text-green-700" },
            entregue: { label: "Entregue", class: "bg-gray-100 text-gray-700" }
        };
        const badge = badges[status || "novo"];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.class}`}>
                {badge.label}
            </span>
        );
    };

    // Obter cores únicas dos pedidos
    const uniqueColors = Array.from(new Set(orders.map(o => o.color).filter(Boolean)));
    const uniqueSizes = Array.from(new Set(orders.flatMap(o => Object.keys(o.sizes || {}))));

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gestão de Pedidos</h1>
                        <p className="text-sm text-gray-500 mt-1">Gerencie todos os pedidos do sistema</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Toggle de visualização */}
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode("kanban")}
                                className={`p-2 rounded ${viewMode === "kanban" ? "bg-white shadow-sm" : "text-gray-600"}`}
                                title="Visualização Kanban"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={`p-2 rounded ${viewMode === "table" ? "bg-white shadow-sm" : "text-gray-600"}`}
                                title="Visualização em Tabela"
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                        <button
                            onClick={() => router.push("/admin/pedidos/novo")}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            Novo Pedido
                        </button>
                    </div>
                </div>
            </div>

            {/* Barra de Ferramentas */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por ID ou cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                        >
                            <option value="todos">Todos os Status</option>
                            <option value="novo">Novos</option>
                            <option value="producao">Em Produção</option>
                            <option value="pronto">Prontos</option>
                            <option value="entregue">Entregues</option>
                        </select>
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`px-3 py-2 border rounded-lg transition-colors ${showAdvancedFilters ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            Filtros Avançados
                        </button>
                    </div>
                </div>

                {/* Filtros Avançados */}
                {showAdvancedFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                            <select
                                value={colorFilter}
                                onChange={(e) => setColorFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="todas">Todas as Cores</option>
                                {uniqueColors.map(color => (
                                    <option key={color} value={color}>{color}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tamanho</label>
                            <select
                                value={sizeFilter}
                                onChange={(e) => setSizeFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                            >
                                <option value="todos">Todos os Tamanhos</option>
                                {uniqueSizes.sort().map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
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

            {/* Visualização Kanban */}
            {viewMode === "kanban" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KanbanColumn
                        title="Novos"
                        count={getOrdersByStatus("novo").length}
                        icon={Package}
                        color="blue"
                    >
                        {getOrdersByStatus("novo").map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onClick={() => handleOrderClick(order)}
                            />
                        ))}
                    </KanbanColumn>

                    <KanbanColumn
                        title="Em Produção"
                        count={getOrdersByStatus("producao").length}
                        icon={Clock}
                        color="yellow"
                    >
                        {getOrdersByStatus("producao").map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onClick={() => handleOrderClick(order)}
                            />
                        ))}
                    </KanbanColumn>

                    <KanbanColumn
                        title="Prontos"
                        count={getOrdersByStatus("pronto").length}
                        icon={CheckCircle}
                        color="green"
                    >
                        {getOrdersByStatus("pronto").map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onClick={() => handleOrderClick(order)}
                            />
                        ))}
                    </KanbanColumn>

                    <KanbanColumn
                        title="Entregues"
                        count={getOrdersByStatus("entregue").length}
                        icon={Archive}
                        color="gray"
                    >
                        {getOrdersByStatus("entregue").map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onClick={() => handleOrderClick(order)}
                            />
                        ))}
                    </KanbanColumn>
                </div>
            )}

            {/* Visualização em Tabela */}
            {viewMode === "table" && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Pedido
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Qtd
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Data
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Responsável
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            Nenhum pedido encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{order.id.slice(0, 8)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{order.clientName || "-"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{order.color}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{order.totalQty}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(order.adminStatus)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{order.responsible || "-"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleOrderClick(order)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Ver Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal de Detalhes */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdateStatus={updateOrderStatus}
                    onUpdateOrder={handleUpdateOrder}
                />
            )}
        </div>
    );
}
