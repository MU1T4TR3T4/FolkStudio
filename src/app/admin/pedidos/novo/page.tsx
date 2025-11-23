"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { saveImage } from "@/lib/storage";

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
    adminStatus?: "novo" | "producao" | "pronto" | "entregue";
    clientName?: string;
    clientPhone?: string;
    backImageUrl?: string | null;
    artImageUrl?: string | null;
    backArtImageUrl?: string | null;
}

export default function AdminNewOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        clientName: "",
        clientPhone: "",
        color: "white",
        material: "algodao",
        observations: "",
        imageUrl: ""
    });

    const [sizes, setSizes] = useState({
        P: 0,
        M: 0,
        G: 0,
        GG: 0
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSizeChange = (size: string, value: string) => {
        const qty = parseInt(value) || 0;
        setSizes(prev => ({ ...prev, [size]: qty }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.clientName) {
            toast.error("Nome do cliente é obrigatório");
            return;
        }
        if (!formData.imageUrl) {
            toast.error("Imagem da estampa é obrigatória");
            return;
        }

        const totalQty = Object.values(sizes).reduce((a, b) => a + b, 0);
        if (totalQty === 0) {
            toast.error("Selecione pelo menos uma quantidade");
            return;
        }

        setLoading(true);

        try {
            const orderId = crypto.randomUUID();

            // Salvar imagem no IDB
            if (formData.imageUrl) {
                await saveImage(`order-manual-${orderId}`, formData.imageUrl);
            }

            const newOrder: Order = {
                id: orderId,
                imageUrl: `idb:order-manual-${orderId}`,
                color: formData.color,
                material: formData.material,
                sizes,
                totalQty,
                observations: formData.observations,
                status: "Aguardando Pagamento", // Status inicial padrão
                createdAt: new Date().toISOString(),
                adminStatus: "novo",
                clientName: formData.clientName,
                clientPhone: formData.clientPhone,
                artImageUrl: `idb:order-manual-${orderId}`, // No manual, a imagem É a arte
                backImageUrl: null, // Manual por enquanto só frente
                backArtImageUrl: null
            };

            const savedOrders = localStorage.getItem("folk_studio_orders");
            const orders = savedOrders ? JSON.parse(savedOrders) : [];
            orders.unshift(newOrder); // Adiciona no início
            localStorage.setItem("folk_studio_orders", JSON.stringify(orders));

            toast.success("Pedido criado com sucesso!");
            setTimeout(() => {
                router.push("/admin/pedidos");
            }, 1500);
        } catch (error) {
            console.error("Erro ao criar pedido:", error);
            toast.error("Erro ao criar pedido");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Toaster position="top-right" richColors />

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
                    <h1 className="text-2xl font-bold text-gray-900">Novo Pedido Manual</h1>
                    <p className="text-sm text-gray-500 mt-1">Crie um pedido para um cliente externo</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 max-w-3xl">
                <div className="space-y-6">
                    {/* Dados do Cliente */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Cliente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Cliente *
                                </label>
                                <input
                                    type="text"
                                    value={formData.clientName}
                                    onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Telefone / Contato
                                </label>
                                <input
                                    type="text"
                                    value={formData.clientPhone}
                                    onChange={e => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ex: (11) 99999-9999"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes do Produto</h3>

                        {/* Upload de Imagem */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Imagem da Estampa *
                            </label>
                            <div className="flex items-start gap-4">
                                <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative">
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                                    ) : (
                                        <Upload className="h-8 w-8 text-gray-400" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>
                                <div className="text-sm text-gray-500">
                                    <p>Clique para fazer upload da imagem da estampa.</p>
                                    <p>Formatos aceitos: JPG, PNG.</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Cor da Camiseta
                                </label>
                                <select
                                    value={formData.color}
                                    onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="white">Branca</option>
                                    <option value="black">Preta</option>
                                    <option value="blue">Azul</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Material
                                </label>
                                <select
                                    value={formData.material}
                                    onChange={e => setFormData(prev => ({ ...prev, material: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                >
                                    <option value="algodao">Algodão</option>
                                    <option value="poliester">Poliéster</option>
                                    <option value="dryfit">DryFit</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantidade por Tamanho
                            </label>
                            <div className="grid grid-cols-4 gap-4">
                                {Object.keys(sizes).map(size => (
                                    <div key={size}>
                                        <label className="block text-xs font-medium text-gray-500 mb-1 text-center">
                                            {size}
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={sizes[size as keyof typeof sizes]}
                                            onChange={e => handleSizeChange(size, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Observações
                            </label>
                            <textarea
                                value={formData.observations}
                                onChange={e => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={3}
                                placeholder="Detalhes adicionais sobre o pedido..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? "Criando..." : "Criar Pedido"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
