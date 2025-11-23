"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, CheckCircle, AlertCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import OrderTimeline from "@/components/admin/OrderTimeline";
import OrderChecklist from "@/components/admin/OrderChecklist";
import OrderComments from "@/components/admin/OrderComments";
import OrderFiles from "@/components/admin/OrderFiles";
import OrderChat from "@/components/shared/OrderChat";

interface Order {
    id: string;
    imageUrl: string;
    color: string;
    material: string;
    sizes: Record<string, number>;
    totalQty: number;
    observations: string | null;
    status: string;
    createdAt: string;
    backImageUrl?: string | null;
    adminStatus?: "novo" | "producao" | "pronto" | "entregue";
    checklist?: {
        conferirArte: boolean;
        separarCamiseta: boolean;
        impressao: boolean;
        prensar: boolean;
        empacotar: boolean;
    };
}

interface Comment {
    id: string;
    orderId: string;
    user: string;
    text: string;
    timestamp: string;
}

interface OrderFile {
    id: string;
    orderId: string;
    name: string;
    type: string;
    size: number;
    content: string;
    uploadedAt: string;
    uploadedBy: string;
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [order, setOrder] = useState<Order | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [files, setFiles] = useState<OrderFile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrder();
        loadComments();
        loadFiles();
    }, [params.id]);

    function loadOrder() {
        try {
            const savedOrders = localStorage.getItem("folk_studio_orders");
            if (savedOrders) {
                const orders: Order[] = JSON.parse(savedOrders);
                const found = orders.find(o => o.id === params.id);

                if (found) {
                    // Inicializar checklist se não existir
                    if (!found.checklist) {
                        found.checklist = {
                            conferirArte: false,
                            separarCamiseta: false,
                            impressao: false,
                            prensar: false,
                            empacotar: false
                        };
                    }
                    setOrder(found);
                } else {
                    toast.error("Pedido não encontrado");
                    router.push("/admin/pedidos");
                }
            }
        } catch (error) {
            console.error("Erro ao carregar pedido:", error);
            toast.error("Erro ao carregar pedido");
        } finally {
            setLoading(false);
        }
    }

    function handleDownload(imageUrl: string, filename: string) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download iniciado!");
    }

    function handleChecklistToggle(itemId: string) {
        if (!order) return;

        const updatedOrder = {
            ...order,
            checklist: {
                ...order.checklist!,
                [itemId]: !order.checklist![itemId as keyof typeof order.checklist]
            }
        };

        setOrder(updatedOrder);

        // Atualizar no localStorage
        const savedOrders = localStorage.getItem("folk_studio_orders");
        if (savedOrders) {
            const orders: Order[] = JSON.parse(savedOrders);
            const updated = orders.map(o => o.id === order.id ? updatedOrder : o);
            localStorage.setItem("folk_studio_orders", JSON.stringify(updated));
        }
    }

    function handleMarkAsOk() {
        toast.success("Impressão marcada como OK!");
    }

    function handleReportProblem() {
        toast.warning("Problema reportado ao cliente");
    }

    function loadComments() {
        try {
            const savedComments = localStorage.getItem("folk_admin_comments");
            if (savedComments) {
                setComments(JSON.parse(savedComments));
            }
        } catch (error) {
            console.error("Erro ao carregar comentários:", error);
        }
    }

    function handleAddComment(text: string) {
        const adminUser = localStorage.getItem("folk_admin_user") || "Admin";

        const newComment: Comment = {
            id: crypto.randomUUID(),
            orderId: params.id,
            user: adminUser,
            text,
            timestamp: new Date().toISOString()
        };

        const updatedComments = [...comments, newComment];
        setComments(updatedComments);
        localStorage.setItem("folk_admin_comments", JSON.stringify(updatedComments));
        toast.success("Comentário adicionado!");
    }

    function loadFiles() {
        try {
            const savedFiles = localStorage.getItem("folk_admin_files");
            if (savedFiles) {
                setFiles(JSON.parse(savedFiles));
            }
        } catch (error) {
            console.error("Erro ao carregar arquivos:", error);
        }
    }

    function handleUploadFile(file: OrderFile) {
        const updatedFiles = [...files, file];
        setFiles(updatedFiles);
        localStorage.setItem("folk_admin_files", JSON.stringify(updatedFiles));
    }

    function handleDeleteFile(fileId: string) {
        if (confirm("Tem certeza que deseja excluir este arquivo?")) {
            const updatedFiles = files.filter(f => f.id !== fileId);
            setFiles(updatedFiles);
            localStorage.setItem("folk_admin_files", JSON.stringify(updatedFiles));
            toast.success("Arquivo excluído!");
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Carregando...</p>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    const getColorName = (color: string) => {
        const names: Record<string, string> = {
            white: "Branco",
            black: "Preto",
            blue: "Azul"
        };
        return names[color] || color;
    };

    const getStatusBadge = () => {
        const status = order.adminStatus || "novo";
        const badges = {
            novo: { label: "Novo", class: "bg-blue-100 text-blue-700" },
            producao: { label: "Em Produção", class: "bg-yellow-100 text-yellow-700" },
            pronto: { label: "Pronto", class: "bg-green-100 text-green-700" },
            entregue: { label: "Entregue", class: "bg-gray-100 text-gray-700" }
        };
        const badge = badges[status];
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.class}`}>
                {badge.label}
            </span>
        );
    };

    const checklistItems = [
        { id: "conferirArte", label: "Conferir arte", completed: order.checklist?.conferirArte || false },
        { id: "separarCamiseta", label: "Separar camiseta", completed: order.checklist?.separarCamiseta || false },
        { id: "impressao", label: "Fazer impressão", completed: order.checklist?.impressao || false },
        { id: "prensar", label: "Prensar", completed: order.checklist?.prensar || false },
        { id: "empacotar", label: "Empacotar", completed: order.checklist?.empacotar || false }
    ];

    const timelineEvents = [
        {
            id: "1",
            type: "created" as const,
            title: "Pedido Criado",
            description: "Pedido criado pelo cliente",
            timestamp: order.createdAt
        }
    ];

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/admin/pedidos")}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Pedido #{order.id.slice(0, 8)}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Criado em {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                    </div>
                </div>
                {getStatusBadge()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Esquerda - Informações */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Arte Final */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Arte Final</h2>
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Tamanhos</p>
                                <p className="text-sm">
                                    {Object.entries(order.sizes)
                                        .filter(([_, qty]) => qty > 0)
                                        .map(([size, qty]) => `${size}: ${qty}`)
                                        .join(", ")}
                                </p>
                            </div>
                        </div>
                        {order.observations && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Observações</p>
                                <p className="text-sm">{order.observations}</p>
                            </div>
                        )}
                    </div>

                    {/* Ações */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                onClick={handleMarkAsOk}
                                className="gap-2 bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Impressão OK
                            </Button>
                            <Button
                                onClick={handleReportProblem}
                                variant="outline"
                                className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                            >
                                <AlertCircle className="h-4 w-4" />
                                Problema na Arte
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Coluna Direita - Checklist e Timeline */}
                <div className="space-y-6">
                    {/* Checklist de Produção */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Checklist de Produção</h2>
                        <OrderChecklist
                            items={checklistItems}
                            onToggle={handleChecklistToggle}
                        />
                    </div>

                    {/* Linha do Tempo */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico</h2>
                        <OrderTimeline events={timelineEvents} />
                    </div>

                    {/* Comentários Internos */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Comentários Internos</h2>
                        <OrderComments
                            orderId={params.id}
                            comments={comments}
                            onAddComment={handleAddComment}
                        />
                    </div>

                    {/* Chat com Cliente */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <OrderChat
                            orderId={params.id}
                            currentUserType="admin"
                        />
                    </div>

                    {/* Arquivos Anexados */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Arquivos Anexados</h2>
                        <OrderFiles
                            orderId={params.id}
                            files={files}
                            onUpload={handleUploadFile}
                            onDelete={handleDeleteFile}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
