"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import SignatureCanvas from 'react-signature-canvas';
import { Check, X, ZoomIn, ZoomOut, RotateCcw, PenTool, Loader2, Smartphone, QrCode } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getApprovalByToken, submitApproval, ClientStamp } from "@/lib/clients";
import { getImage } from "@/lib/storage";

export default function ApprovalPage() {
    const params = useParams();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ClientStamp | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Signature State
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [receivedSignature, setReceivedSignature] = useState<string | null>(null);
    const sigCanvas = useRef<any>(null);
    const [submitting, setSubmitting] = useState(false);

    // Load Data
    useEffect(() => {
        if (!token) return;
        loadData();
    }, [token]);

    async function loadData() {
        try {
            setLoading(true);
            const result = await getApprovalByToken(token);
            if (!result) {
                setError("Link inválido ou expirado.");
                return;
            }
            setData(result);

            // Resolve Image
            let img = result.type === 'stamp' ? result.stamp?.image_url : result.design?.final_image_url;
            if (img?.startsWith('idb:')) {
                const key = img.replace('idb:', '');
                const blobUrl = await getImage(key);
                if (blobUrl) img = blobUrl;
            }
            setImageUrl(img || null);

        } catch (err) {
            console.error(err);
            setError("Erro ao carregar dados.");
        } finally {
            setLoading(false);
        }
    }

    // Actions
    // Capture signature locally
    const handleConfirmSignature = () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            toast.error("Por favor, assine para confirmar.");
            return;
        }
        const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        setReceivedSignature(signatureData);
        setIsSignModalOpen(false);
        toast.success("Assinatura capturada! Clique em 'Confirmar Aprovação' para finalizar.");
    };

    // Submit to DB
    const handleApprove = async () => {
        if (!receivedSignature) {
            toast.error("É necessário assinar antes de aprovar.");
            return;
        }

        try {
            setSubmitting(true);
            const valid = await submitApproval(token, 'approved', receivedSignature);
            if (valid) {
                toast.success("Aprovação registrada com sucesso!");
                loadData();
            } else {
                toast.error("Erro ao registrar aprovação.");
            }
        } catch (e) {
            toast.error("Erro desconhecido.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!confirm("Tem certeza que deseja rejeitar esta arte?")) return;

        try {
            setSubmitting(true);
            // Rejection doesn't strictly need a signature in this scope, maybe just validation
            const valid = await submitApproval(token, 'rejected');
            if (valid) {
                toast.error("Arte rejeitada.");
                loadData();
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin mr-2" /> Carregando...
        </div>;
    }

    if (error || !data) {
        return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
                <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h1>
                <p className="text-gray-500">{error || "Não foi possível carregar o pedido."}</p>
            </div>
        </div>;
    }

    const title = data.type === 'stamp' ? data.stamp?.name : `${data.design?.product_type} - ${data.design?.color}`;

    if (data.approval_status === 'approved') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border-4 border-white ring-1 ring-gray-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Obrigado!</h1>
                    <p className="text-gray-500 mb-8">Sua aprovação foi registrada com sucesso. Agradecemos a preferência!</p>

                    {data.approval_signature && (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
                            <p className="text-xs text-gray-400 uppercase font-semibold mb-2 tracking-wider">Assinatura Confirmada</p>
                            <img src={data.approval_signature} alt="Signature" className="h-16 mx-auto opacity-80" />
                        </div>
                    )}

                    <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm">
                        O link agora é inválido para novas edições.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100 font-sans">
            <Toaster position="top-center" richColors />

            {/* Header */}
            <header className="bg-white px-6 py-4 border-b flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white font-bold p-1.5 rounded-lg text-lg">FK</div>
                    <div>
                        <h1 className="font-bold text-gray-900 leading-tight">Aprovação de Arte</h1>
                        <p className="text-xs text-gray-500">Por favor, revise os detalhes abaixo</p>
                    </div>
                </div>
                {/* Status Pending Badge */}
                <div className="hidden md:flex bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin md:animate-none" /> Aguardando Aprovação
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden">

                {/* Canvas Area (Zoomable) */}
                <div className="flex-1 bg-gray-200 relative overflow-hidden flex items-center justify-center pattern-grid-lg text-gray-300">
                    {imageUrl ? (
                        <TransformWrapper
                            initialScale={1}
                            initialPositionX={0}
                            initialPositionY={0}
                            minScale={0.5}
                            maxScale={4}
                        >
                            {({ zoomIn, zoomOut, resetTransform }) => (
                                <>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-white/90 backdrop-blur shadow-lg p-2 rounded-full border border-gray-200">
                                        <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="h-8 w-8 rounded-full"><ZoomOut className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => resetTransform()} className="h-8 w-8 rounded-full"><RotateCcw className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="h-8 w-8 rounded-full"><ZoomIn className="h-4 w-4" /></Button>
                                    </div>
                                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                                        <div className="bg-white shadow-2xl p-4 md:p-8 rounded-sm">
                                            <img src={imageUrl} alt="Artwork" className="max-h-[70vh] max-w-[90vw] object-contain" />
                                        </div>
                                    </TransformComponent>
                                </>
                            )}
                        </TransformWrapper>
                    ) : (
                        <div className="text-gray-400">Imagem não disponível</div>
                    )}
                </div>

                {/* Sidebar Controls */}
                <div className="bg-white w-full md:w-80 border-l border-gray-200 flex flex-col shadow-xl z-20">
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-1">{title || "Estampa sem nome"}</h3>
                            <p className="text-sm text-gray-500 capitalize">{data.type === 'stamp' ? 'Modelo de Catálogo' : 'Design Personalizado'}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                                <p className="font-semibold mb-1 flex items-center gap-2">
                                    <ZoomIn className="h-4 w-4" /> Instruções:
                                </p>
                                <ul className="list-disc pl-4 space-y-1 opacity-90">
                                    <li>Use o zoom para conferir detalhes.</li>
                                    <li>Verifique cores e textos.</li>
                                    <li>Se tudo estiver correto, clique em Aprovar e assine.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {receivedSignature && (
                        <div className="mt-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <p className="text-xs text-gray-400 uppercase font-semibold mb-2 tracking-wider">Sua Assinatura:</p>
                            <img src={receivedSignature} alt="Assinatura" className="h-16 mx-auto opacity-80 object-contain" />
                            <button
                                onClick={() => setReceivedSignature(null)}
                                className="text-xs text-red-500 underline mt-2 w-full text-center hover:text-red-600"
                            >
                                Remover / Re-assinar
                            </button>
                        </div>
                    )}
                    <div className="p-6 border-t bg-gray-50 space-y-3">
                        {!receivedSignature ? (
                            <Button
                                onClick={() => setIsSignModalOpen(true)}
                                className="w-full h-12 text-lg font-bold bg-[#7D4CDB] hover:bg-[#6b3bb5] shadow-lg relative justify-center text-white"
                            >
                                <PenTool className="absolute left-4 h-5 w-5" /> Assinar Arte
                            </Button>
                        ) : (
                            <Button
                                onClick={handleApprove}
                                disabled={submitting}
                                className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg relative justify-center text-white"
                            >
                                {submitting ? <Loader2 className="absolute left-4 h-5 w-5 animate-spin" /> : <Check className="absolute left-4 h-5 w-5" />}
                                Confirmar Aprovação
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            onClick={handleReject}
                            className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 relative justify-center"
                        >
                            <X className="absolute left-4 h-4 w-4" /> Rejeitar Arte
                        </Button>
                    </div>
                </div>
            </main>

            {/* Signature Modal */}
            < Dialog open={isSignModalOpen} onOpenChange={setIsSignModalOpen} >
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Confirmar Aprovação</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-gray-500 mb-2">Por favor, desenhe sua assinatura abaixo para confirmar a aprovação desta arte.</p>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden touch-none relative h-48">
                            <SignatureCanvas
                                ref={sigCanvas}
                                canvasProps={{
                                    className: "w-full h-full cursor-crosshair"
                                }}
                                backgroundColor="rgba(255,255,255,1)"
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-gray-300 pointer-events-none">Área de Assinatura</div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => sigCanvas.current.clear()}
                                className="absolute top-2 right-2 text-xs h-6 px-2 text-gray-400 hover:text-red-500"
                            >
                                Limpar
                            </Button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">Ao assinar, você concorda com a produção da arte conforme visualizada.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSignModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmSignature} className="bg-green-600 hover:bg-green-700 text-white">
                            <Check className="h-4 w-4 mr-2" />
                            Confirmar Assinatura
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >


        </div >
    );
}
