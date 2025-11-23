"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Clock, CheckCircle, Archive, Search, Filter, Plus } from "lucide-react";
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
}

interface StatusLog {
    id: string;
    orderId: string;
    from: string;
    to: string;
    timestamp: string;
    user: string;
}

export default function AdminPedidosPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("todos");

    useEffect(() => {
        loadOrders();
    }, []);

    useEffect(() => {
        filterOrders();
    }, [searchTerm, statusFilter, orders]);

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

        // Filtro por busca (ID)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(order =>
                order.id.toLowerCase().includes(term)
            );
        }

        // Filtro por status (dropdown)
        if (statusFilter !== "todos") {
            result = result.filter(order =>
                (order.adminStatus || "novo") === statusFilter
            );
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

            // IMPORTANTE: Ao salvar no localStorage, manter apenas referências idb:
            // Não salvar as imagens Base64 completas que foram carregadas do IndexedDB
            const ordersToSave = updatedOrders.map(order => {
                const orderToSave: any = { ...order };

                // Se a URL da imagem é Base64 (começa com data:), não salvar
                // Isso significa que foi carregada do IDB e já tem referência salva
                if (orderToSave.imageUrl?.startsWith('data:')) {
                    // Buscar a referência original do localStorage
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

            // Se o modal estiver aberto, atualiza o status nele também (embora o handleUpdateOrder cuide disso se chamado, aqui atualizamos o estado local)
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

        // IMPORTANTE: Ao salvar no localStorage, manter apenas referências idb:
        // Não salvar as imagens Base64 completas que foram carregadas do IndexedDB
        const ordersToSave = updatedOrders.map(order => {
            const orderToSave: any = { ...order };

            // Se a URL da imagem é Base64 (começa com data:), buscar a referência original
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

        // Se o pedido atualizado for o selecionado, atualiza o modal também
        if (selectedOrder && selectedOrder.id === updatedOrder.id) {
            setSelectedOrder(updatedOrder);
        }
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Kanban de Pedidos</h1>
                        <p className="text-sm text-gray-500 mt-1">Gerencie o status dos pedidos</p>
                    </div>
                    <button
                        onClick={() => router.push("/admin/pedidos/novo")}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <Plus className="h-4 w-4" />
                        Novo Pedido
                    </button>
                </div>
            </div>

            {/* Barra de Ferramentas */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por ID do pedido..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                        <option value="todos">Todos os Status</option>
                        <option value="novo">Novos</option>
                        <option value="producao">Em Produção</option>
                        <option value="pronto">Prontos</option>
                        <option value="entregue">Entregues</option>
                    </select>
                </div>
            </div>

            {/* Kanban Board */}
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
