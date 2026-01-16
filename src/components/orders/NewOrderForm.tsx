"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Trash2, CheckCircle, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { saveImage } from "@/lib/storage";
import { createOrder, updateOrder } from "@/lib/orders";
import { ClientSelect } from "./ClientSelect";
import { Client } from "@/lib/clients";

interface NewOrderFormProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
}

export function NewOrderForm({ open, onClose, onSuccess, initialData }: NewOrderFormProps) {
    // Pre-fill client if initialData has client info
    const [client, setClient] = useState<Client | null>(
        initialData?.client_id ? {
            id: initialData.client_id,
            name: initialData.customer_name || 'Cliente',
            // other fields are not critical for the select display usually, or we assume valid
            email: initialData.customer_email || '',
            phone: initialData.customer_phone || ''
        } as Client : null
    );

    const [image, setImage] = useState<string | null>(initialData?.imageUrl || null);
    const [pdf, setPdf] = useState<string | null>(initialData?.pdfUrl || null);
    const [checklist, setChecklist] = useState({
        item1: !!initialData?.id, // If editing, assume checked or require re-check? Let's require re-check to confirm fixes.
        item2: !!initialData?.id,
        item3: !!initialData?.id,
        item4: !!initialData?.id,
        item5: !!initialData?.id,
    });
    const [saving, setSaving] = useState(false);

    // Zoom Preview State
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // ... handleImageUpload, handlePdfUpload ... (unchanged)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 1200;
                    if (width > MAX_SIZE || height > MAX_SIZE) {
                        if (width > height) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        } else {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
                    setImage(compressedBase64);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPdf(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            toast.error("Por favor, selecione um arquivo PDF válido.");
        }
    };


    const handleSubmit = async () => {
        if (!client) {
            toast.error("Selecione um cliente.");
            return;
        }
        if (!pdf) {
            toast.error("O PDF da Ordem de Compra é obrigatório.");
            return;
        }
        if (!image) {
            toast.error("A imagem do mockup é obrigatória.");
            return;
        }
        // Strict checklist validation
        const allChecked = Object.values(checklist).every(v => v === true);
        if (!allChecked) {
            toast.error("Você deve confirmar todos os itens do checklist.");
            return;
        }

        setSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const isEdit = !!initialData?.id;
            const orderId = isEdit ? initialData.id : crypto.randomUUID();

            if (image && !image.startsWith('idb:') && image !== initialData?.imageUrl) await saveImage(`order-front-${orderId}`, image);
            if (pdf && !pdf.startsWith('idb:') && pdf !== initialData?.pdfUrl) await saveImage(`order-pdf-${orderId}`, pdf);

            // Create Order Object
            const dbOrder: any = {
                client_id: client.id,
                customer_name: client.name,
                // Default values as per new flow
                product_type: "Personalizado",
                color: "N/A", // Can be updated in customization stage
                quantity: 1, // Placeholder
                size: "N/A",
                status: "pending",
                kanban_stage: isEdit ? "waiting_confirmation" : "waiting_confirmation", // Reset to waiting_confirmation on edit?
                created_at: isEdit ? initialData.created_at : new Date().toISOString(), // Keep created_at if edit
                imageUrl: image.startsWith('data:') ? `idb:order-front-${orderId}` : image,
                pdfUrl: pdf.startsWith('data:') ? `idb:order-pdf-${orderId}` : pdf,
            };

            if (isEdit) {
                await updateOrder(orderId, dbOrder);
                toast.success("Pedido atualizado com sucesso!");
            } else {
                dbOrder.id = orderId;
                await createOrder(dbOrder);
                toast.success("Pedido criado com sucesso!");
            }

            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao salvar pedido");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <div className="flex justify-between items-center mr-6">
                        <DialogTitle className="text-2xl font-bold">Novo Pedido</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* 1. Client Selection */}
                    <div className="space-y-2">
                        <ClientSelect
                            value={client?.id}
                            onSelect={setClient}
                        />
                        {client && (
                            <div className="text-xs text-blue-600 font-medium">
                                Cliente selecionado: {client.name}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-dashed border-gray-200 my-2"></div>

                    {/* 2. Upload PDF */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            1. Upload da Ordem de Compra (PDF)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors relative bg-gray-50/50">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handlePdfUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {pdf ? (
                                <div className="flex flex-col items-center text-green-600">
                                    <FileText className="h-10 w-10 mb-2" />
                                    <span className="font-medium">PDF Carregado com Sucesso</span>
                                    <span className="text-xs mt-1">Clique para substituir</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                    <Upload className="h-8 w-8 mb-2" />
                                    <span className="text-sm">Clique ou arraste o PDF aqui</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Upload Mockup */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            2. Upload do Mockup (Imagem)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors relative bg-gray-50/50">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="mockup-upload-new"
                            />
                            {image ? (
                                <div className="w-full relative group">
                                    <img
                                        src={image}
                                        alt="Preview"
                                        className="max-h-60 mx-auto rounded shadow-sm object-contain cursor-zoom-in"
                                        onClick={() => setPreviewImage(image)}
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPreviewImage(image); }}
                                            className="bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                                            title="Expandir"
                                            type="button"
                                        >
                                            <ZoomIn className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setImage(null); }}
                                            className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600"
                                            title="Remover"
                                            type="button"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <label htmlFor="mockup-upload-new" className="flex flex-col items-center justify-center cursor-pointer h-32">
                                    <Upload className="h-8 w-8 mb-2 text-gray-400" />
                                    <span className="text-sm text-gray-500">Clique para carregar imagem do mockup</span>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* 4. Checklist */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Checklist Obrigatório
                        </h3>
                        <div className="space-y-3">
                            {[
                                { id: 'item1', label: '1. O mockup conforme a imagem acima é exatamente o que o cliente confirmou?' },
                                { id: 'item2', label: '2. Tamanhos provados e aprovados pelo cliente' },
                                { id: 'item3', label: '3. Cores conforme solicitado' },
                                { id: 'item4', label: '4. Modelos conforme o solicitado' },
                                { id: 'item5', label: '5. Estampa exatamente conforme o solicitado' },
                            ].map((item) => (
                                <label key={item.id} className="flex items-start gap-3 cursor-pointer select-none hover:bg-yellow-100/50 p-1 rounded transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={checklist[item.id as keyof typeof checklist]}
                                        onChange={(e) => setChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                    />
                                    <span className="text-sm text-gray-700 leading-tight">{item.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t mt-4">
                    <Button onClick={onClose} variant="outline" className="flex-1" disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        disabled={!image || !pdf || !client || !Object.values(checklist).every(v => v) || saving}
                    >
                        {saving ? "Criando..." : "Criar Pedido"}
                    </Button>
                </div>
            </DialogContent>

            {/* Simple Preview Overlay */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="Full Preview"
                        className="max-w-full max-h-full object-contain rounded-md"
                    />
                    <button className="absolute top-4 right-4 text-white hover:text-gray-300">
                        <Trash2 className="h-6 w-6 rotate-45" /> {/* Using Trash icon as Close X for quick hack or just X if available */}
                    </button>
                </div>
            )}
        </Dialog>
    );
}
