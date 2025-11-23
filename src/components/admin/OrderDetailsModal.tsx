"use client";

import { useState, useEffect } from "react";
import { X, Download, CheckCircle, AlertCircle, Package, Clock, Archive, ArrowRight, MessageSquare, Paperclip, ListTodo, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import OrderTimeline from "@/components/admin/OrderTimeline";
import OrderChecklist from "@/components/admin/OrderChecklist";
import OrderComments from "@/components/admin/OrderComments";
import OrderFiles from "@/components/admin/OrderFiles";
import OrderChat from "@/components/shared/OrderChat";

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

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    onUpdateStatus: (orderId: string, newStatus: "novo" | "producao" | "pronto" | "entregue") => void;
    onUpdateOrder: (updatedOrder: Order) => void; // Para atualizar checklist/dados locais
}

export default function OrderDetailsModal({ order, onClose, onUpdateStatus, onUpdateOrder }: OrderDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<"info" | "chat" | "internal">("info");
    const [comments, setComments] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);

    useEffect(() => {
        loadComments();
        loadFiles();
    }, [order.id]);

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

    function handleDownload(url: string, filename: string) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download iniciado!");
    }

    function handleChecklistToggle(itemId: string) {
        const updatedOrder = {
            ...order,
            checklist: {
                ...(order.checklist || {
                    conferirArte: false,
                    separarCamiseta: false,
                    impressao: false,
                    prensar: false,
                    empacotar: false
                }),
                [itemId]: !order.checklist?.[itemId as keyof typeof order.checklist]
            }
        };
        onUpdateOrder(updatedOrder);
    }

    function handleAddComment(text: string) {
        const adminUser = localStorage.getItem("folk_admin_user") || "Admin";
        const newComment = {
            id: crypto.randomUUID(),
            orderId: order.id,
            user: adminUser,
            text,
            timestamp: new Date().toISOString()
        };
        const updatedComments = [...comments, newComment];
        setComments(updatedComments);
        localStorage.setItem("folk_admin_comments", JSON.stringify(updatedComments));
        toast.success("Nota interna adicionada!");
    }

    function handleUploadFile(file: any) {
        const updatedFiles = [...files, file];
        setFiles(updatedFiles);
        localStorage.setItem("folk_admin_files", JSON.stringify(updatedFiles));
    }

    function handleDeleteFile(fileId: string) {
        if (confirm("Excluir arquivo?")) {
            const updatedFiles = files.filter(f => f.id !== fileId);
            setFiles(updatedFiles);
            localStorage.setItem("folk_admin_files", JSON.stringify(updatedFiles));
            toast.success("Arquivo excluído!");
        }
    }

    const checklistItems = [
        { id: "conferirArte", label: "Conferir arte", completed: order.checklist?.conferirArte || false },
        { id: "separarCamiseta", label: "Separar camiseta", completed: order.checklist?.separarCamiseta || false },
        { id: "impressao", label: "Fazer impressão", completed: order.checklist?.impressao || false },
        { id: "prensar", label: "Prensar", completed: order.checklist?.prensar || false },
        { id: "empacotar", label: "Empacotar", completed: order.checklist?.empacotar || false }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "novo": return "bg-blue-100 text-blue-800";
            case "producao": return "bg-yellow-100 text-yellow-800";
            case "pronto": return "bg-green-100 text-green-800";
            case "entregue": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                Pedido #{order.id.slice(0, 8)}
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.adminStatus || "novo")}`}>
                                    {(order.adminStatus || "novo").toUpperCase()}
                                </span>
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {order.clientName ? `${order.clientName} • ` : ""}
                                {new Date(order.createdAt).toLocaleDateString("pt-BR")} às {new Date(order.createdAt).toLocaleTimeString("pt-BR")}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Botões de Mudança de Status Rápida */}
                        <div className="flex bg-gray-100 rounded-lg p-1 mr-4">
                            {(["novo", "producao", "pronto", "entregue"] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => onUpdateStatus(order.id, status)}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${(order.adminStatus || "novo") === status
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                        }`}
                                >
                                    {status === "novo" ? "Novo" :
                                        status === "producao" ? "Produção" :
                                            status === "pronto" ? "Pronto" : "Entregue"}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Conteúdo com Tabs */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar de Tabs */}
                    <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 flex flex-col gap-2">
                        <button
                            onClick={() => setActiveTab("info")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "info" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <Package className="h-4 w-4" />
                            Detalhes & Produção
                        </button>
                        <button
                            onClick={() => setActiveTab("chat")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "chat" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <MessageSquare className="h-4 w-4" />
                            Chat com Cliente
                        </button>
                        <button
                            onClick={() => setActiveTab("internal")}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "internal" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <ListTodo className="h-4 w-4" />
                            Notas & Arquivos
                        </button>
                    </div>

                    {/* Área Principal */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">

                        {activeTab === "info" && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Visualização das Artes */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Package className="h-4 w-4 text-blue-500" />
                                            Mockups & Artes
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            {/* FRENTE */}
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-gray-500 text-center uppercase tracking-wider">Frente</p>
                                                <div className="aspect-square bg-gray-50 rounded-xl border border-gray-100 p-2 flex items-center justify-center relative group">
                                                    {order.imageUrl ? (
                                                        <img src={order.imageUrl} className="max-w-full max-h-full object-contain" />
                                                    ) : (
                                                        <div className="text-gray-300 flex flex-col items-center">
                                                            <Package className="h-8 w-8 mb-2 opacity-50" />
                                                            <span className="text-xs">Sem imagem</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {order.imageUrl && (
                                                        <Button variant="outline" size="sm" onClick={() => handleDownload(order.imageUrl, `mockup-frente-${order.id}.png`)} className="w-full text-xs">
                                                            <Download className="h-3 w-3 mr-2" /> Mockup
                                                        </Button>
                                                    )}
                                                    {order.artImageUrl && (
                                                        <Button variant="secondary" size="sm" onClick={() => handleDownload(order.artImageUrl!, `arte-frente-${order.id}.png`)} className="w-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">
                                                            <Download className="h-3 w-3 mr-2" /> Arte Original
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* COSTAS */}
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-gray-500 text-center uppercase tracking-wider">Costas</p>
                                                <div className="aspect-square bg-gray-50 rounded-xl border border-gray-100 p-2 flex items-center justify-center relative">
                                                    {order.backImageUrl ? (
                                                        <img src={order.backImageUrl} className="max-w-full max-h-full object-contain" />
                                                    ) : (
                                                        <div className="text-gray-300 flex flex-col items-center">
                                                            <div className="h-8 w-8 mb-2 border-2 border-dashed border-gray-300 rounded-lg"></div>
                                                            <span className="text-xs">Sem verso</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {order.backImageUrl && (
                                                        <Button variant="outline" size="sm" onClick={() => handleDownload(order.backImageUrl!, `mockup-costas-${order.id}.png`)} className="w-full text-xs">
                                                            <Download className="h-3 w-3 mr-2" /> Mockup
                                                        </Button>
                                                    )}
                                                    {order.backArtImageUrl && (
                                                        <Button variant="secondary" size="sm" onClick={() => handleDownload(order.backArtImageUrl!, `arte-costas-${order.id}.png`)} className="w-full text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">
                                                            <Download className="h-3 w-3 mr-2" /> Arte Original
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Info e Checklist */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="font-semibold text-gray-900 mb-4">Especificações</h3>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Cor</p>
                                                <p className="font-medium capitalize">{order.color === "white" ? "Branca" : order.color === "black" ? "Preta" : "Azul"}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Material</p>
                                                <p className="font-medium capitalize">{order.material}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Total</p>
                                                <p className="font-medium">{order.totalQty} unidades</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Tamanhos</p>
                                                <p className="font-medium">
                                                    {Object.entries(order.sizes).filter(([_, q]) => q > 0).map(([s, q]) => `${s}: ${q}`).join(", ")}
                                                </p>
                                            </div>
                                        </div>

                                        {/* NOVO: Responsável pela Produção */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-gray-500 text-xs mb-2">Responsável pela Produção</p>
                                            <select
                                                value={order.responsible || ""}
                                                onChange={(e) => {
                                                    const updatedOrder = { ...order, responsible: e.target.value };
                                                    onUpdateOrder(updatedOrder);
                                                    toast.success("Responsável atualizado!");
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-sm"
                                            >
                                                <option value="">Não atribuído</option>
                                                <option value="João Silva">João Silva</option>
                                                <option value="Maria Santos">Maria Santos</option>
                                                <option value="Pedro Costa">Pedro Costa</option>
                                                <option value="Ana Oliveira">Ana Oliveira</option>
                                            </select>
                                        </div>

                                        {order.observations && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <p className="text-gray-500 text-xs mb-1">Observações</p>
                                                <p className="text-sm bg-yellow-50 p-3 rounded-lg text-yellow-800 border border-yellow-100">
                                                    {order.observations}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <ListTodo className="h-4 w-4 text-green-500" />
                                            Checklist de Produção
                                        </h3>
                                        <OrderChecklist items={checklistItems} onToggle={handleChecklistToggle} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "chat" && (
                            <div className="h-full flex flex-col">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
                                    <OrderChat orderId={order.id} currentUserType="admin" />
                                </div>
                            </div>
                        )}

                        {activeTab === "internal" && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                                    <h3 className="font-semibold text-gray-900 mb-4">Notas Internas</h3>
                                    <div className="flex-1 overflow-y-auto">
                                        <OrderComments orderId={order.id} comments={comments} onAddComment={handleAddComment} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                                    <h3 className="font-semibold text-gray-900 mb-4">Arquivos Anexados</h3>
                                    <div className="flex-1 overflow-y-auto">
                                        <OrderFiles orderId={order.id} files={files} onUpload={handleUploadFile} onDelete={handleDeleteFile} />
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
