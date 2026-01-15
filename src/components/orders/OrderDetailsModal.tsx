"use client";

import { useState, useEffect } from "react";
import { X, Download, CheckCircle, AlertCircle, Package, Clock, Archive, ArrowRight, MessageSquare, Paperclip, ListTodo, History, Eye, Upload, FileText, XCircle, User, Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { saveImage, getImage } from "@/lib/storage";
import { Order } from "@/lib/orders";

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    onUpdateStatus?: (orderId: string, newStatus: string) => void;
    onUpdateOrder?: (updatedOrder: Order) => void;
    onEditOrder?: (order: Order) => void;
    readOnly?: boolean;
}

export function OrderDetailsModal({ order, onClose, onUpdateStatus, onUpdateOrder, onEditOrder, readOnly = false }: OrderDetailsModalProps) {
    const [returnReason, setReturnReason] = useState("");
    const [showReturnInput, setShowReturnInput] = useState(false);

    // File States (resolved URLs)
    const [files, setFiles] = useState<{
        photolith: string | null;
        final: string | null;
        signature: string | null;
        pdf: string | null;
        mockup: string | null;
    }>({
        photolith: null,
        final: null,
        signature: null,
        pdf: null,
        mockup: null,
    });

    const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null);

    // Initial Load & User
    useEffect(() => {
        const loadUser = () => {
            try {
                const u = localStorage.getItem('folk_user');
                if (u) setCurrentUser(JSON.parse(u));
                else setCurrentUser({ name: 'Usuário' });
            } catch { setCurrentUser({ name: 'Usuário' }); }
        };
        loadUser();
        resolveImages();
    }, [order]);

    async function resolveImages() {
        const resolve = async (url?: string | null) => {
            if (!url) return null;
            if (url.startsWith('idb:')) {
                return await getImage(url.replace('idb:', '')) || null;
            }
            return url;
        };

        const [photo, final, sig, pdf, mock] = await Promise.all([
            resolve(order.photolith_url),
            resolve(order.final_product_url),
            resolve(order.client_signature_url),
            resolve(order.pdfUrl),
            resolve(order.imageUrl),
        ]);

        setFiles({
            photolith: photo,
            final: final,
            signature: sig,
            pdf: pdf,
            mockup: mock
        });
    }

    // Checklists State
    const [checklistPhotolith, setChecklistPhotolith] = useState({
        interpretation: false,
        order_match: false,
        photolith_ok: order.photolith_status || false,
    });

    const [checklistArrival, setChecklistArrival] = useState(order.checklist_arrival?.items || {
        qty_check: false,
        quality_check: false,
        photolith_final_check: false,
    });

    const [checklistCustomization, setChecklistCustomization] = useState(order.checklist_customization?.items || {
        qty_final_check: false,
        quality_mockup_check: false,
        packaging_check: false,
    });


    // STAGES CONFIG
    const stages = [
        { id: 'waiting_confirmation', label: '1. Aguardando', icon: Clock },
        { id: 'photolith', label: '2. Fotolito', icon: FileText },
        { id: 'waiting_arrival', label: '3. Chegada', icon: Package },
        { id: 'customization', label: '4. Personalização', icon: ListTodo },
        { id: 'delivery', label: '5. Entrega', icon: checkIcon(order.kanban_stage === 'finalized') },
    ];
    function checkIcon(isFinal: boolean) { return isFinal ? CheckCircle : Archive; }

    const isEditableByVendor = readOnly && (order.kanban_stage === 'waiting_confirmation' || order.kanban_stage === 'returned');


    // HANDLERS
    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'photolith' | 'final' | 'signature') {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = event.target?.result as string;
            const fileId = crypto.randomUUID();
            const key = `${type}-${order.id}-${fileId}`;
            await saveImage(key, base64);
            const url = `idb:${key}`;

            if (onUpdateOrder) {
                if (type === 'photolith') onUpdateOrder({ ...order, photolith_url: url });
                else if (type === 'final') onUpdateOrder({ ...order, final_product_url: url });
                else if (type === 'signature') onUpdateOrder({ ...order, client_signature_url: url });
            }
            // Update local resolved state
            setFiles(prev => ({ ...prev, [type]: base64 }));
            toast.success("Arquivo carregado com sucesso!");
        };
        reader.readAsDataURL(file);
    }

    // Logic to Check Advance
    function canAdvanceFromPhotolith() {
        return checklistPhotolith.interpretation && checklistPhotolith.order_match && checklistPhotolith.photolith_ok && files.photolith;
    }
    function canAdvanceFromArrival() {
        return checklistArrival.qty_check && checklistArrival.quality_check && checklistArrival.photolith_final_check;
    }
    function canAdvanceFromCustomization() {
        return checklistCustomization.qty_final_check && checklistCustomization.quality_mockup_check && checklistCustomization.packaging_check;
    }
    function canFinalizeDelivery() {
        return files.final && files.signature;
    }

    function handleAdvanceStage() {
        if (!onUpdateStatus || !onUpdateOrder) return;
        const currentStage = order.kanban_stage || 'waiting_confirmation';
        let nextStage = '';
        const userMeta = {
            checked_by: currentUser?.name || 'Sistema',
            checked_at: new Date().toISOString()
        };

        if (currentStage === 'waiting_confirmation') {
            nextStage = 'photolith';
            // Auto-close on approval as requested
            setTimeout(() => onClose(), 800);
            toast.success("Pedido aprovado! Movendo para produção...");
        }
        else if (currentStage === 'photolith') {
            if (!canAdvanceFromPhotolith()) return toast.error("Checklist incompleto ou fotolito faltando!");
            onUpdateOrder({
                ...order,
                photolith_status: true,
                checklist_photolith: { items: checklistPhotolith, ...userMeta }
            });
            nextStage = 'waiting_arrival';
        }
        else if (currentStage === 'waiting_arrival') {
            if (!canAdvanceFromArrival()) return toast.error("Checklist de chegada incompleto!");
            onUpdateOrder({ ...order, checklist_arrival: { items: checklistArrival, ...userMeta } });
            nextStage = 'customization';
        }
        else if (currentStage === 'customization') {
            if (!canAdvanceFromCustomization()) return toast.error("Checklist de personalização incompleto!");
            onUpdateOrder({ ...order, checklist_customization: { items: checklistCustomization, ...userMeta } });
            nextStage = 'delivery';
        }
        else if (currentStage === 'delivery') {
            if (!canFinalizeDelivery()) return toast.error("Foto final ou assinatura faltando!");
            onUpdateOrder({ ...order, delivered_at: new Date().toISOString() });
            nextStage = 'finalized';
        }

        if (nextStage) onUpdateStatus(order.id, nextStage);
    }

    function handleReturnOrder() {
        if (!onUpdateStatus || !onUpdateOrder) return;
        if (!returnReason) return toast.error("Motivo é obrigatório para devolver!");
        onUpdateOrder({ ...order, return_reason: returnReason });
        onUpdateStatus(order.id, 'returned');
        setShowReturnInput(false);
    }

    function handleDownload(url: string | null, filename: string) {
        if (!url) return;
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const renderStage1Approval = () => (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" /> Aprovação do Pedido
            </h3>

            {showReturnInput ? (
                <div className="space-y-4 bg-red-50 p-4 rounded-lg border border-red-100">
                    <h4 className="font-semibold text-red-800">Motivo da Devolução</h4>
                    <textarea
                        className="w-full p-3 border rounded-lg focus:ring-red-200"
                        rows={3}
                        placeholder="Descreva o motivo para devolver ao vendedor..."
                        value={returnReason}
                        onChange={e => setReturnReason(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setShowReturnInput(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleReturnOrder}>Confirmar Devolução</Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-4">
                    <Button
                        size="lg"
                        className="flex-1 bg-green-600 hover:bg-green-700 h-16 text-lg shadow-md transition-all hover:-translate-y-0.5"
                        onClick={handleAdvanceStage}
                    >
                        <CheckCircle className="mr-2 h-6 w-6" /> Aprovar Pedido
                    </Button>
                    <Button
                        size="lg"
                        variant="destructive"
                        className="flex-1 h-16 text-lg shadow-md transition-all hover:-translate-y-0.5"
                        onClick={() => setShowReturnInput(true)}
                    >
                        <XCircle className="mr-2 h-6 w-6" /> Devolver ao Vendedor
                    </Button>
                </div>
            )}
        </div>
    );


    // COMPONENTS FOR UI REUSE

    const FileCard = ({ label, fileUrl, type }: { label: string, fileUrl: string | null, type: 'image' | 'pdf' }) => (
        <div className="bg-white border rounded-lg p-3 flex items-start gap-4 hover:bg-gray-50 transition-colors">
            <div className="h-16 w-16 bg-gray-100 rounded-md flex items-center justify-center shrink-0 overflow-hidden border">
                {fileUrl ? (
                    type === 'image' ? (
                        <img src={fileUrl} className="w-full h-full object-cover" />
                    ) : <FileText className="text-red-500 h-8 w-8" />
                ) : <Upload className="text-gray-300 h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{label}</p>
                <div className="mt-2 flex gap-2">
                    {fileUrl ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleDownload(fileUrl, `${label}.png`)}>
                            <Download className="h-3 w-3" /> Baixar
                        </Button>
                    ) : (
                        <span className="text-xs text-gray-400 italic">Pendente</span>
                    )}
                </div>
            </div>
        </div>
    );

    const ChecklistHistoryItem = ({ title, data }: { title: string, data: any }) => {
        if (!data || !data.items) return null;
        return (
            <div className="border rounded-lg p-4 bg-gray-50/50">
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-700">{title}</h4>
                    <div className="text-xs text-right text-gray-500">
                        <div className="flex items-center gap-1 justify-end"><User className="h-3 w-3" /> {data.checked_by}</div>
                        <div className="flex items-center gap-1 justify-end"><Clock className="h-3 w-3" /> {new Date(data.checked_at).toLocaleString()}</div>
                    </div>
                </div>
                <ul className="space-y-1">
                    {Object.entries(data.items).map(([key, value]) => (
                        <li key={key} className="flex items-center gap-2 text-sm text-gray-600">
                            {value ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-red-300" />}
                            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const CreationChecklist = () => (
        <div className="bg-white border border-green-100 rounded-lg p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Checklist Inicial
                </h3>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Aprovado na Criação</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> Mockup confirmado</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> Tamanhos aprovados</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> Cores solicitadas</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> Modelos solicitados</div>
                <div className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> Estampa conforme solicitação</div>
            </div>
        </div>
    );


    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-2xl font-bold text-gray-900">Pedido #{order.id.slice(0, 8)}</h2>
                                {order.status === 'returned' && (
                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" /> DEVOLVIDO
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 ml-0.5">{order.customer_name || 'Sem cliente'} - {order.product_type} {order.quantity}un</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-6 w-6" /></button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center justify-between relative px-2 overflow-x-auto pb-2">
                        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-10 min-w-[600px]" />
                        {stages.map((stage, index) => {
                            const Icon = stage.icon;
                            // Logic: Active if current matches ID. Completed if index is lower OR if finalized.
                            const currentStageIndex = stages.findIndex(s => s.id === (order.kanban_stage || 'waiting_confirmation'));
                            const myIndex = stages.findIndex(s => s.id === stage.id);

                            const isActive = stage.id === (order.kanban_stage || 'waiting_confirmation');
                            const isCompleted = myIndex < currentStageIndex || order.kanban_stage === 'finalized';

                            return (
                                <div key={stage.id} className="flex flex-col items-center gap-2 bg-white px-2 min-w-[80px]">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'border-blue-600 bg-blue-50 text-blue-600' : isCompleted ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 text-gray-300'}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className={`text-xs font-medium whitespace-nowrap ${isActive ? 'text-blue-700' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>{stage.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Content - Single Scrollable Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
                    <div className="max-w-4xl mx-auto space-y-8">

                        {/* SPECIAL CASE: STAGE 1 APPROVAL (If not readOnly) */}
                        {!readOnly && (order.kanban_stage === 'waiting_confirmation' || !order.kanban_stage) && (
                            renderStage1Approval()
                        )}

                        {/* 1. Status & Actions */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <ListTodo className="h-5 w-5 text-blue-600" />
                                {order.kanban_stage === 'waiting_confirmation' ? 'Detalhes do Pedido' : `Etapa Atual: ${stages.find(s => s.id === order.kanban_stage)?.label}`}
                            </h3>

                            {/* Vendor/ReadOnly Logic */}
                            {readOnly ? (
                                <div>
                                    {isEditableByVendor ? (
                                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                                            <div>
                                                <p className="font-medium text-blue-800">Este pedido ainda não foi aprovado.</p>
                                                <p className="text-sm text-blue-600">Você pode editá-lo para corrigir informações.</p>
                                            </div>
                                            {onEditOrder && (
                                                <Button onClick={() => onEditOrder(order)} className="whitespace-nowrap gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                                                    <Edit className="h-4 w-4" /> Editar Pedido
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 border border-gray-200 text-gray-600 p-4 rounded-lg flex items-center gap-2">
                                            <Eye className="h-5 w-5" />
                                            <span>Modo Visualização: O pedido já está em produção e não pode ser alterado.</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Admin Logic - Action Forms */
                                <>
                                    {/* Stage 1 Actions are now displayed above via renderStage1Approval */}

                                    {order.kanban_stage === 'photolith' && (
                                        <div className="space-y-6">
                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Checklist da Encomenda</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer border hover:border-blue-300 shadow-sm"><input type="checkbox" checked={checklistPhotolith.interpretation} onChange={e => setChecklistPhotolith({ ...checklistPhotolith, interpretation: e.target.checked })} className="w-5 h-5 rounded text-blue-600" /><span className="text-gray-700">Interpretação da Arte</span></label>
                                                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer border hover:border-blue-300 shadow-sm"><input type="checkbox" checked={checklistPhotolith.order_match} onChange={e => setChecklistPhotolith({ ...checklistPhotolith, order_match: e.target.checked })} className="w-5 h-5 rounded text-blue-600" /><span className="text-gray-700">Encomenda das Camisas (Tamanhos/Cores)</span></label>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Upload className="h-4 w-4" /> Fotolito</h4>
                                                <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 hover:bg-gray-100 transition-colors text-center cursor-pointer relative">
                                                    <input type="file" onChange={e => handleUpload(e, 'photolith')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Upload className="h-8 w-8 text-gray-400" />
                                                        <span className="text-sm font-medium text-gray-600">Clique para fazer upload do Fotolito</span>
                                                    </div>
                                                </div>
                                                {files.photolith && (
                                                    <div className="mt-3 bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 border border-green-200">
                                                        <CheckCircle className="h-5 w-5" /> Arquivo de Fotolito Anexado
                                                    </div>
                                                )}
                                            </div>

                                            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={checklistPhotolith.photolith_ok} onChange={e => setChecklistPhotolith({ ...checklistPhotolith, photolith_ok: e.target.checked })} className="w-5 h-5 rounded text-yellow-600 focus:ring-yellow-500" /><span className="font-semibold text-yellow-800">Confirmo que o fotolito conferido está correto</span></label>
                                            </div>
                                            <Button size="lg" className="w-full mt-4 h-12 text-lg" disabled={!canAdvanceFromPhotolith()} onClick={handleAdvanceStage}>
                                                <ArrowRight className="mr-2 h-5 w-5" /> Concluir Etapa Fotolito e Avançar
                                            </Button>
                                        </div>
                                    )}
                                    {order.kanban_stage === 'waiting_arrival' && (
                                        <div className="space-y-4">
                                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-4 text-sm text-orange-800">
                                                Verifique os itens recebidos antes de prosseguir.
                                            </div>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border"><input type="checkbox" checked={checklistArrival.qty_check} onChange={e => setChecklistArrival({ ...checklistArrival, qty_check: e.target.checked })} className="w-5 h-5 rounded" /><span>Qtd/Modelo/Cor conferidos</span></label>
                                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border"><input type="checkbox" checked={checklistArrival.quality_check} onChange={e => setChecklistArrival({ ...checklistArrival, quality_check: e.target.checked })} className="w-5 h-5 rounded" /><span>Qualidade confecção</span></label>
                                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border"><input type="checkbox" checked={checklistArrival.photolith_final_check} onChange={e => setChecklistArrival({ ...checklistArrival, photolith_final_check: e.target.checked })} className="w-5 h-5 rounded" /><span>Conferência final fotolito</span></label>
                                            </div>
                                            <Button size="lg" className="w-full mt-4" disabled={!canAdvanceFromArrival()} onClick={handleAdvanceStage}>Avançar para Personalização</Button>
                                        </div>
                                    )}

                                    {order.kanban_stage === 'customization' && (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border"><input type="checkbox" checked={checklistCustomization.qty_final_check} onChange={e => setChecklistCustomization({ ...checklistCustomization, qty_final_check: e.target.checked })} className="w-5 h-5 rounded" /><span>Qtd Final OK</span></label>
                                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border"><input type="checkbox" checked={checklistCustomization.quality_mockup_check} onChange={e => setChecklistCustomization({ ...checklistCustomization, quality_mockup_check: e.target.checked })} className="w-5 h-5 rounded" /><span>Qualidade vs Mockup</span></label>
                                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer border"><input type="checkbox" checked={checklistCustomization.packaging_check} onChange={e => setChecklistCustomization({ ...checklistCustomization, packaging_check: e.target.checked })} className="w-5 h-5 rounded" /><span>Embalagem OK</span></label>
                                            </div>
                                            <Button size="lg" className="w-full mt-4" disabled={!canAdvanceFromCustomization()} onClick={handleAdvanceStage}>Avançar para Entrega</Button>
                                        </div>
                                    )}

                                    {order.kanban_stage === 'delivery' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block font-medium mb-2">Foto do Produto *</label>
                                                    <input type="file" onChange={e => handleUpload(e, 'final')} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                                                    {files.final && <img src={files.final} className="mt-2 h-32 rounded object-cover" />}
                                                </div>
                                                <div>
                                                    <label className="block font-medium mb-2">Assinatura Cliente *</label>
                                                    <input type="file" onChange={e => handleUpload(e, 'signature')} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
                                                    {files.signature && <img src={files.signature} className="mt-2 h-20 rounded border object-contain bg-white" />}
                                                </div>
                                            </div>
                                            <Button size="lg" className="w-full mt-4 bg-green-600 hover:bg-green-700" disabled={!canFinalizeDelivery()} onClick={handleAdvanceStage}>
                                                <CheckCircle className="mr-2 h-5 w-5" /> Concluir Pedido
                                            </Button>
                                        </div>
                                    )}

                                    {order.kanban_stage === 'finalized' && (
                                        <div className="bg-green-50 p-8 rounded-xl text-center border border-green-100">
                                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                            <h3 className="text-2xl font-bold text-green-800">Pedido Finalizado!</h3>
                                            <p className="text-green-600 mt-2">Ciclo de produção completo.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* 2. Creation Checklist & Files */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Left: Creation Report */}
                            <div>
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-400" /> Informações
                                </h3>
                                <CreationChecklist />
                                {order.observations && (
                                    <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-600 italic">
                                        "{order.observations}"
                                    </div>
                                )}
                            </div>

                            {/* Right: Files Gallery */}
                            <div>
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Paperclip className="h-5 w-5 text-gray-400" /> Arquivos
                                </h3>
                                <div className="space-y-3">
                                    <FileCard label="Ordem de Compra (PDF)" fileUrl={files.pdf} type="pdf" />
                                    <FileCard label="Mockup do Pedido" fileUrl={files.mockup} type="image" />
                                    <FileCard label="Fotolito" fileUrl={files.photolith} type="image" />
                                    <FileCard label="Foto Produto Final" fileUrl={files.final} type="image" />
                                    <FileCard label="Assinatura Cliente" fileUrl={files.signature} type="image" />
                                </div>
                            </div>
                        </div>

                        {/* 3. History Log */}
                        <div className="pt-6 border-t border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <History className="h-5 w-5 text-gray-400" /> Histórico de Processo
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {order.checklist_photolith && <ChecklistHistoryItem title="1. Fotolito & Arte" data={order.checklist_photolith} />}
                                {order.checklist_arrival && <ChecklistHistoryItem title="2. Conferência de Chegada" data={order.checklist_arrival} />}
                                {order.checklist_customization && <ChecklistHistoryItem title="3. Conferência de Personalização" data={order.checklist_customization} />}
                                {!order.checklist_photolith && !order.checklist_arrival && !order.checklist_customization && (
                                    <div className="text-gray-400 italic">Nenhuma atividade registrada.</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
