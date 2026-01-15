"use client";

import { useState, useEffect } from "react";
import { X, Download, CheckCircle, AlertCircle, Package, Clock, Archive, ArrowRight, MessageSquare, Paperclip, ListTodo, History, Eye, Upload, FileText, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import OrderComments from "@/components/admin/OrderComments";
import OrderFiles from "@/components/admin/OrderFiles";
import OrderChat from "@/components/shared/OrderChat";
import { saveImage } from "@/lib/storage";

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
    adminStatus?: string;
    clientName?: string;
    responsible?: string;
    ad1?: number;
    ad2?: number;
    ad3?: number;
    ad4?: number;
    pdfUrl?: string;

    // Kanban V2
    kanban_stage?: 'waiting_confirmation' | 'photolith' | 'waiting_arrival' | 'customization' | 'delivery' | 'finalized' | 'returned';
    return_reason?: string;
    photolith_url?: string;
    photolith_status?: boolean;
    checklist_arrival?: any;
    checklist_customization?: any;
    final_product_url?: string;
    client_signature_url?: string;
    delivered_at?: string;
}

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    onUpdateStatus: (orderId: string, newStatus: string) => void;
    onUpdateOrder: (updatedOrder: Order) => void;
}

export default function OrderDetailsModal({ order, onClose, onUpdateStatus, onUpdateOrder }: OrderDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<"workflow" | "info" | "chat" | "internal">("workflow");
    const [comments, setComments] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [returnReason, setReturnReason] = useState("");
    const [showReturnInput, setShowReturnInput] = useState(false);
    const [photolithFile, setPhotolithFile] = useState<string | null>(order.photolith_url || null);
    const [finalProductFile, setFinalProductFile] = useState<string | null>(order.final_product_url || null);
    const [signatureFile, setSignatureFile] = useState<string | null>(order.client_signature_url || null);
    const [isSaving, setIsSaving] = useState(false);

    // Stages Config
    const stages = [
        { id: 'waiting_confirmation', label: '1. Aguardando', icon: Clock },
        { id: 'photolith', label: '2. Fotolito', icon: FileText },
        { id: 'waiting_arrival', label: '3. Chegada', icon: Package },
        { id: 'customization', label: '4. Personalização', icon: ListTodo },
        { id: 'delivery', label: '5. Entrega', icon: checkIcon(order.kanban_stage === 'finalized') },
    ];

    function checkIcon(isFinal: boolean) {
        return isFinal ? CheckCircle : Archive;
    }

    // Checklists State
    const [checklistPhotolith, setChecklistPhotolith] = useState({
        interpretation: false,
        order_match: false,
        photolith_ok: order.photolith_status || false,
    });

    const [checklistArrival, setChecklistArrival] = useState(order.checklist_arrival || {
        qty_check: false,
        quality_check: false,
        photolith_final_check: false,
    });

    const [checklistCustomization, setChecklistCustomization] = useState(order.checklist_customization || {
        qty_final_check: false,
        quality_mockup_check: false,
        packaging_check: false,
    });


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

    // Handlers
    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'photolith' | 'final' | 'signature') {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSaving(true);
        // Simulate upload (in real app, upload to storage and get URL)
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            const fileId = crypto.randomUUID();
            const key = `${type}-${order.id}-${fileId}`;
            await saveImage(key, base64);
            const url = `idb:${key}`;

            if (type === 'photolith') {
                setPhotolithFile(url);
                onUpdateOrder({ ...order, photolith_url: url });
            } else if (type === 'final') {
                setFinalProductFile(url);
                onUpdateOrder({ ...order, final_product_url: url });
            } else if (type === 'signature') {
                setSignatureFile(url);
                onUpdateOrder({ ...order, client_signature_url: url });
            }
            setIsSaving(false);
            toast.success("Arquivo carregado com sucesso!");
        };
        reader.readAsDataURL(file);
    }

    function canAdvanceFromPhotolith() {
        return checklistPhotolith.interpretation && checklistPhotolith.order_match && checklistPhotolith.photolith_ok && photolithFile;
    }

    function canAdvanceFromArrival() {
        return checklistArrival.qty_check && checklistArrival.quality_check && checklistArrival.photolith_final_check;
    }

    function canAdvanceFromCustomization() {
        return checklistCustomization.qty_final_check && checklistCustomization.quality_mockup_check && checklistCustomization.packaging_check;
    }

    function canFinalizeDelivery() {
        return finalProductFile && signatureFile;
    }

    function handleAdvanceStage() {
        const currentStage = order.kanban_stage || 'waiting_confirmation';
        let nextStage = '';

        if (currentStage === 'waiting_confirmation') nextStage = 'photolith';
        else if (currentStage === 'photolith') {
            if (!canAdvanceFromPhotolith()) return toast.error("Checklist incompleto ou fotolito faltando!");
            onUpdateOrder({ ...order, photolith_status: true }); // Save specific flag
            nextStage = 'waiting_arrival';
        }
        else if (currentStage === 'waiting_arrival') {
            if (!canAdvanceFromArrival()) return toast.error("Checklist de chegada incompleto!");
            onUpdateOrder({ ...order, checklist_arrival: checklistArrival });
            nextStage = 'customization';
        }
        else if (currentStage === 'customization') {
            if (!canAdvanceFromCustomization()) return toast.error("Checklist de personalização incompleto!");
            onUpdateOrder({ ...order, checklist_customization: checklistCustomization });
            nextStage = 'delivery';
        }
        else if (currentStage === 'delivery') {
            if (!canFinalizeDelivery()) return toast.error("Foto final ou assinatura faltando!");
            nextStage = 'finalized';
        }

        if (nextStage) {
            onUpdateStatus(order.id, nextStage);
        }
    }

    function handleReturnOrder() {
        if (!returnReason) return toast.error("Motivo é obrigatório para devolver!");
        onUpdateOrder({ ...order, return_reason: returnReason });
        onUpdateStatus(order.id, 'returned');
        setShowReturnInput(false);
    }

    function handleDownload(url: string, filename: string) {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const getStatusColor = (stage: string) => {
        if (stage === order.kanban_stage) return "bg-blue-600 text-white border-blue-600";
        if (stages.findIndex(s => s.id === stage) < stages.findIndex(s => s.id === (order.kanban_stage || 'waiting_confirmation'))) return "bg-green-500 text-white border-green-500";
        return "bg-white text-gray-400 border-gray-200";
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

                {/* Header with Stepper */}
                <div className="p-6 border-b border-gray-100 bg-white">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Pedido #{order.id.slice(0, 8)}</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-6 w-6" /></button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center justify-between relative px-2">
                        {/* Line Background */}
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-10" />

                        {stages.map((stage, index) => {
                            const Icon = stage.icon;
                            const isActive = stage.id === (order.kanban_stage || 'waiting_confirmation');
                            const isCompleted = stages.findIndex(s => s.id === (order.kanban_stage || 'waiting_confirmation')) > index || order.kanban_stage === 'finalized';

                            return (
                                <div key={stage.id} className="flex flex-col items-center gap-2 bg-white px-2">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'border-blue-600 bg-blue-50 text-blue-600' :
                                            isCompleted ? 'border-green-500 bg-green-50 text-green-600' :
                                                'border-gray-200 text-gray-300'
                                        }`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-xs font-medium ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                                        {stage.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-gray-50 border-r border-gray-100 p-4 flex flex-col gap-2">
                        <button onClick={() => setActiveTab("workflow")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "workflow" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
                            <ListTodo className="h-4 w-4" /> Workflow
                        </button>
                        <button onClick={() => setActiveTab("info")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === "info" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
                            <Package className="h-4 w-4" /> Detalhes
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">
                        {activeTab === "workflow" && (
                            <div className="max-w-2xl mx-auto space-y-8">

                                {/* STAGE 1 LOGIC */}
                                {(order.kanban_stage === 'waiting_confirmation' || !order.kanban_stage) && (
                                    <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">Aprovação do Pedido</h3>
                                        {showReturnInput ? (
                                            <div className="space-y-4">
                                                <label className="block text-sm font-medium text-gray-700">Motivo da Devolução *</label>
                                                <textarea
                                                    className="w-full p-3 border rounded-lg"
                                                    rows={3}
                                                    placeholder="Explique o motivo para o vendedor..."
                                                    value={returnReason}
                                                    onChange={e => setReturnReason(e.target.value)}
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="outline" onClick={() => setShowReturnInput(false)}>Cancelar</Button>
                                                    <Button variant="destructive" onClick={handleReturnOrder}>Confirmar Devolução</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-4">
                                                <Button size="lg" className="flex-1 bg-green-600 hover:bg-green-700 font-semibold" onClick={handleAdvanceStage}>
                                                    <CheckCircle className="mr-2 h-5 w-5" /> Aprovar Pedido
                                                </Button>
                                                <Button size="lg" variant="destructive" className="flex-1" onClick={() => setShowReturnInput(true)}>
                                                    <XCircle className="mr-2 h-5 w-5" /> Devolver ao Vendedor
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* STAGE 2 LOGIC */}
                                {order.kanban_stage === 'photolith' && (
                                    <div className="bg-white p-6 rounded-xl border border-yellow-100 shadow-sm space-y-6">
                                        <h3 className="text-lg font-bold text-gray-800">Checklist: Encomenda + Fotolito</h3>

                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                <input type="checkbox" checked={checklistPhotolith.interpretation} onChange={e => setChecklistPhotolith({ ...checklistPhotolith, interpretation: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                                                <span>Interpretação e compreensão total da venda</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                <input type="checkbox" checked={checklistPhotolith.order_match} onChange={e => setChecklistPhotolith({ ...checklistPhotolith, order_match: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                                                <span>Encomenda feita exatamente conforme pedido aprovado</span>
                                            </label>
                                        </div>

                                        <div className="border-t pt-4">
                                            <label className="block font-medium mb-2">Upload do Fotolito Final *</label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition relative">
                                                <input type="file" accept="image/*,.pdf" onChange={e => handleUpload(e, 'photolith')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                {photolithFile ? (
                                                    <div className="text-green-600 font-medium flex items-center justify-center gap-2">
                                                        <CheckCircle className="h-5 w-5" /> Arquivo Carregado
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500">Clique para fazer upload do Fotolito</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer">
                                                <input type="checkbox" checked={checklistPhotolith.photolith_ok} onChange={e => setChecklistPhotolith({ ...checklistPhotolith, photolith_ok: e.target.checked })} className="w-5 h-5 text-yellow-600 rounded" />
                                                <span className="font-semibold text-yellow-800">Confirmo que o fotolito está correto</span>
                                            </label>
                                        </div>

                                        <Button size="lg" className="w-full mt-4" disabled={!canAdvanceFromPhotolith()} onClick={handleAdvanceStage}>
                                            Avançar para Aguardando Chegada <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                )}

                                {/* STAGE 3 LOGIC */}
                                {order.kanban_stage === 'waiting_arrival' && (
                                    <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm space-y-6">
                                        <h3 className="text-lg font-bold text-gray-800">Conferência de Chegada</h3>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                <input type="checkbox" checked={checklistArrival.qty_check} onChange={e => setChecklistArrival({ ...checklistArrival, qty_check: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                                                <span>Quantidade por modelo, tamanho e cor conferidos</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                <input type="checkbox" checked={checklistArrival.quality_check} onChange={e => setChecklistArrival({ ...checklistArrival, quality_check: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                                                <span>Qualidade da confecção verificada</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                <input type="checkbox" checked={checklistArrival.photolith_final_check} onChange={e => setChecklistArrival({ ...checklistArrival, photolith_final_check: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                                                <span>Conferência final do fotolito antes de estampar</span>
                                            </label>
                                        </div>
                                        <Button size="lg" className="w-full mt-4" disabled={!canAdvanceFromArrival()} onClick={handleAdvanceStage}>
                                            Iniciar Personalização <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                )}

                                {/* STAGE 4 LOGIC */}
                                {order.kanban_stage === 'customization' && (
                                    <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm space-y-6">
                                        <h3 className="text-lg font-bold text-gray-800">Conferência Pós-Personalização</h3>
                                        <div className="space-y-3">
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                <input type="checkbox" checked={checklistCustomization.qty_final_check} onChange={e => setChecklistCustomization({ ...checklistCustomization, qty_final_check: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                                                <span>Quantidade final conferida (modelo, tamanho, cor)</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                <input type="checkbox" checked={checklistCustomization.quality_mockup_check} onChange={e => setChecklistCustomization({ ...checklistCustomization, quality_mockup_check: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                                                <span>Qualidade da personalização conforme mockup</span>
                                            </label>
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
                                                <input type="checkbox" checked={checklistCustomization.packaging_check} onChange={e => setChecklistCustomization({ ...checklistCustomization, packaging_check: e.target.checked })} className="w-5 h-5 text-blue-600 rounded" />
                                                <span>Embalagem final e identificação prontas</span>
                                            </label>
                                        </div>
                                        <Button size="lg" className="w-full mt-4" disabled={!canAdvanceFromCustomization()} onClick={handleAdvanceStage}>
                                            Mover para Entrega <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                )}

                                {/* STAGE 5 LOGIC */}
                                {order.kanban_stage === 'delivery' && (
                                    <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm space-y-6">
                                        <h3 className="text-lg font-bold text-gray-800">Finalização e Entrega</h3>

                                        <div>
                                            <label className="block font-medium mb-2">1. Upload da Foto do Produto Pronto *</label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                <input type="file" accept="image/*" onChange={e => handleUpload(e, 'final')} className="hidden" id="final-upload" />
                                                <label htmlFor="final-upload" className="cursor-pointer block">
                                                    {finalProductFile ? (
                                                        <img src={finalProductFile.startsWith('idb:') ? finalProductFile : finalProductFile} className="max-h-40 mx-auto rounded" />
                                                    ) : (
                                                        <div className="text-gray-500">Clique para carregar foto</div>
                                                    )}
                                                </label>
                                            </div>
                                        </div>

                                        {finalProductFile && (
                                            <Button variant="outline" className="w-full gap-2 border-green-200 text-green-700 bg-green-50" onClick={() => toast.success("Foto enviada para o cliente (simulado)")}>
                                                <MessageSquare className="h-4 w-4" /> Enviar Foto para Cliente
                                            </Button>
                                        )}

                                        <div>
                                            <label className="block font-medium mb-2">2. Assinatura do Cliente *</label>
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                <input type="file" accept="image/*" onChange={e => handleUpload(e, 'signature')} className="hidden" id="sig-upload" />
                                                <label htmlFor="sig-upload" className="cursor-pointer block">
                                                    {signatureFile ? (
                                                        <div className="text-green-600 font-medium"><CheckCircle className="inline mr-2" /> Assinatura Recebida</div>
                                                    ) : (
                                                        <div className="text-gray-500">Upload da assinatura (Foto ou Arquivo)</div>
                                                    )}
                                                </label>
                                            </div>
                                        </div>

                                        <Button size="lg" className="w-full mt-4 bg-green-600 hover:bg-green-700" disabled={!canFinalizeDelivery()} onClick={handleAdvanceStage}>
                                            Concluir Pedido <CheckCircle className="ml-2 h-5 w-5" />
                                        </Button>
                                    </div>
                                )}

                                {order.kanban_stage === 'finalized' && (
                                    <div className="bg-green-50 p-8 rounded-xl text-center border border-green-100">
                                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                        <h3 className="text-2xl font-bold text-green-800">Pedido Finalizado!</h3>
                                        <p className="text-green-600 mt-2">Este pedido completou todo o ciclo de produção.</p>
                                        <div className="mt-6 flex justify-center gap-4">
                                            {finalProductFile && <Button variant="outline" onClick={() => window.open(finalProductFile)}>Ver Produto Final</Button>}
                                            {signatureFile && <Button variant="outline" onClick={() => window.open(signatureFile)}>Ver Assinatura</Button>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "info" && (
                            <div className="text-center text-gray-500 py-12">
                                Detalhes técnicos do pedido (implementação simplificada para foco no workflow)
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
