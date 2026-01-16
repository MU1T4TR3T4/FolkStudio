"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import SignatureCanvas from 'react-signature-canvas';
import { Check, ZoomIn, ZoomOut, RotateCcw, PenTool, Loader2, Home, Package } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getOrderByDeliveryToken, Order, updateOrderStatus, updateOrder } from "@/lib/orders";
import { getImage } from "@/lib/storage";

export default function DeliverySignaturePage() {
    const params = useParams();
    const token = params.token as string;

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState<Order | null>(null);
    const [productImage, setProductImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Signature State
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [receivedSignature, setReceivedSignature] = useState<string | null>(null);
    const sigCanvas = useRef<any>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (token) loadOrder();
    }, [token]);

    async function loadOrder() {
        try {
            setLoading(true);
            const data = await getOrderByDeliveryToken(token);

            if (!data) {
                setError("Pedido não encontrado ou link inválido.");
                return;
            }
            setOrder(data);

            // Resolve Product Image
            if (data.final_product_url) {
                let img = data.final_product_url;
                if (img.startsWith('idb:')) {
                    img = await getImage(img.replace('idb:', '')) || img;
                }
                setProductImage(img);
            }

            // If already signed, set signature
            if (data.client_signature_url) {
                let sig = data.client_signature_url;
                if (sig.startsWith('idb:')) {
                    sig = await getImage(sig.replace('idb:', '')) || sig;
                }
                setReceivedSignature(sig);
            }

        } catch (err) {
            console.error(err);
            setError("Erro ao carregar pedido.");
        } finally {
            setLoading(false);
        }
    }

    const handleConfirmSignature = () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
            toast.error("Por favor, assine para confirmar.");
            return;
        }
        const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        setReceivedSignature(signatureData);
        setIsSignModalOpen(false);
        toast.success("Assinatura capturada! Clique em 'Confirmar Recebimento' para finalizar.");
    };

    const handleSubmit = async () => {
        if (!receivedSignature || !order) return;

        try {
            setSubmitting(true);

            // Update order with signature and set status to delivery (or finalized? usually signature confirms delivery)
            // The flow says: "finalizar o pedido".
            // So we save signature and maybe update status?
            // Actually usually the internal user finalizes it after checking signature.
            // But the prompt says "ele sera para finalizar o pedido".
            // Let's save the signature and maybe mark a flag 'delivered_at'.

            await updateOrder(order.id, {
                client_signature_url: receivedSignature,
                delivered_at: new Date().toISOString(),
                // kanban_stage: 'finalized' // Optional: auto-finalize? Let's keep it in delivery but signed.
            });

            toast.success("Recebimento confirmado com sucesso!");
            loadOrder();

        } catch (err) {
            toast.error("Erro ao confirmar recebimento.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (error || !order) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

    if (order.client_signature_url) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4 animate-in fade-in">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border-4 border-white">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="h-10 w-10 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido Entregue!</h1>
                    <p className="text-gray-500 mb-6">Confirmação de recebimento registrada para o pedido #{order.id.slice(0, 8)}.</p>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
                        <p className="text-xs text-gray-400 uppercase font-semibold mb-2">Assinatura</p>
                        <img src={receivedSignature || ''} className="h-16 mx-auto opacity-80" />
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
                <div className="flex items-center gap-3">
                    <div className="bg-blue-600 text-white p-2 rounded-lg"><Package className="h-5 w-5" /></div>
                    <div>
                        <h1 className="font-bold text-gray-900">Confirmação de Entrega</h1>
                        <p className="text-xs text-gray-500">Pedido #{order.id.slice(0, 8)} - {order.customer_name}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden">

                {/* Image Section */}
                <div className="flex-1 bg-gray-200 relative overflow-hidden flex items-center justify-center pattern-grid-lg">
                    {productImage ? (
                        <TransformWrapper initialScale={1} minScale={0.5} maxScale={4}>
                            {({ zoomIn, zoomOut, resetTransform }) => (
                                <>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-white/90 backdrop-blur shadow-lg p-2 rounded-full">
                                        <Button variant="ghost" size="icon" onClick={() => zoomOut()} className="rounded-full"><ZoomOut className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => resetTransform()} className="rounded-full"><RotateCcw className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => zoomIn()} className="rounded-full"><ZoomIn className="h-4 w-4" /></Button>
                                    </div>
                                    <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full flex items-center justify-center">
                                        <div className="bg-white shadow-2xl p-4 rounded-sm">
                                            <img src={productImage} className="max-h-[70vh] max-w-[90vw] object-contain" />
                                        </div>
                                    </TransformComponent>
                                </>
                            )}
                        </TransformWrapper>
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center">
                            <Package className="h-12 w-12 mb-2 opacity-50" />
                            <span>Foto do produto não disponível</span>
                        </div>
                    )}
                </div>

                {/* Sidebar Controls */}
                <div className="bg-white w-full md:w-80 border-l border-gray-200 flex flex-col shadow-xl z-20">
                    <div className="p-6 flex-1">
                        <h3 className="font-bold text-gray-900 mb-4">Resumo do Pedido</h3>
                        <div className="space-y-3 text-sm text-gray-600 mb-6">
                            <p><span className="font-semibold">Cliente:</span> {order.customer_name}</p>
                            <p><span className="font-semibold">Produto:</span> {order.product_type}</p>
                            <p><span className="font-semibold">Qtd:</span> {order.quantity}</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                            <p className="font-semibold mb-1">Instruções:</p>
                            <ul className="list-disc pl-4 opacity-90 space-y-1">
                                <li>Confira a foto do produto final.</li>
                                <li>Verifique se está tudo conforme o pedido.</li>
                                <li>Assine abaixo para confirmar o recebimento.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="p-6 border-t bg-gray-50 space-y-3">
                        {receivedSignature ? (
                            <div className="space-y-3">
                                <div className="border rounded p-2 bg-white text-center">
                                    <img src={receivedSignature} className="h-12 mx-auto" />
                                    <button onClick={() => setReceivedSignature(null)} className="text-xs text-red-500 underline mt-1">Refazer Assinatura</button>
                                </div>
                                <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg">
                                    {submitting ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />} Confirmar Recebimento
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={() => setIsSignModalOpen(true)} className="w-full bg-[#7D4CDB] hover:bg-[#6b3bb5] text-white h-12 text-lg flex justify-center items-center">
                                <PenTool className="mr-2 h-5 w-5" /> Assinar Recebimento
                            </Button>
                        )}
                    </div>
                </div>

            </main>

            <Dialog open={isSignModalOpen} onOpenChange={setIsSignModalOpen}>
                <DialogContent className="bg-white">
                    <DialogHeader><DialogTitle>Sua Assinatura</DialogTitle></DialogHeader>
                    <div className="py-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white h-48 relative touch-none overflow-hidden">
                            <SignatureCanvas
                                ref={sigCanvas}
                                canvasProps={{ className: "w-full h-full cursor-crosshair" }}
                                backgroundColor="rgba(255,255,255,1)"
                            />
                            <Button variant="ghost" size="sm" onClick={() => sigCanvas.current.clear()} className="absolute top-2 right-2 text-xs h-6">Limpar</Button>
                        </div>
                        <p className="text-xs text-center text-gray-400 mt-2">Ao assinar, você confirma o recebimento dos produtos.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSignModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmSignature} className="bg-green-600 hover:bg-green-700 text-white">Confirmar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
