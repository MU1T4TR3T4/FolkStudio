"use client";

import { useState, useEffect } from "react";
import { Plus, Upload, ShoppingBag, Package, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";

interface Order {
    id: string;
    imageUrl: string;
    color: string;
    material: string;
    sizes: Record<string, number>;
    totalQty: number;
    status: string;
    createdAt: string;
}

export default function OrdersPage() {
    const [showNewOrderForm, setShowNewOrderForm] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        try {
            const res = await fetch("/api/orders/list-all");
            const data = await res.json();
            if (data.status === "success") {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const getStatusBadge = (status: string) => {
        const badges = {
            "Pendente": { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
            "Em Produção": { bg: "bg-blue-100", text: "text-blue-800", icon: Package },
            "Concluído": { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
        };
        const badge = badges[status as keyof typeof badges] || badges["Pendente"];
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                <Icon className="h-3 w-3" />
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <Toaster position="top-right" richColors />

            {/* Cabeçalho */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Meus Pedidos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie seus pedidos de camisetas personalizadas
                    </p>
                </div>
                <Button
                    onClick={() => setShowNewOrderForm(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Novo Pedido
                </Button>
            </div>

            {/* Modal de Novo Pedido */}
            {showNewOrderForm && (
                <NewOrderForm
                    onClose={() => setShowNewOrderForm(false)}
                    onSuccess={() => {
                        setShowNewOrderForm(false);
                        loadOrders();
                    }}
                />
            )}

            {/* Lista de Pedidos */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">Carregando pedidos...</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Você ainda não tem pedidos</p>
                    <Button onClick={() => setShowNewOrderForm(true)}>
                        Criar Primeiro Pedido
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-square bg-gray-100 relative">
                                <img
                                    src={order.imageUrl}
                                    alt="Pedido"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {order.totalQty} unidades
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                                        </p>
                                    </div>
                                    {getStatusBadge(order.status)}
                                </div>
                                <div className="space-y-1 text-xs text-gray-600">
                                    <p><span className="font-medium">Cor:</span> {order.color}</p>
                                    <p><span className="font-medium">Material:</span> {order.material}</p>
                                    <p><span className="font-medium">Tamanhos:</span> {Object.entries(order.sizes).filter(([_, qty]) => qty > 0).map(([size, qty]) => `${size}(${qty})`).join(", ")}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function NewOrderForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [image, setImage] = useState<string | null>(null);
    const [color, setColor] = useState("white");
    const [sizes, setSizes] = useState<Record<string, number>>({
        P: 0,
        M: 0,
        G: 0,
        GG: 0,
        XG: 0,
    });
    const [material, setMaterial] = useState("algodao");
    const [observations, setObservations] = useState("");
    const [saving, setSaving] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const totalQuantity = Object.values(sizes).reduce((sum, qty) => sum + qty, 0);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/orders/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: image,
                    color,
                    material,
                    sizes,
                    totalQty: totalQuantity,
                    observations: observations.trim() || null,
                }),
            });

            const data = await res.json();
            if (data.status === "success") {
                toast.success("Pedido criado com sucesso!");
                onSuccess();
            } else {
                toast.error("Erro ao criar pedido: " + data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar pedido");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Novo Pedido</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
                        ✕
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Upload de Imagem */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Imagem da Camisa ou Logo
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="order-image-upload"
                            />
                            <label htmlFor="order-image-upload" className="cursor-pointer">
                                {image ? (
                                    <img src={image} alt="Preview" className="max-h-48 mx-auto rounded" />
                                ) : (
                                    <div>
                                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Clique para fazer upload</p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG (max. 5MB)</p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Cor da Camisa */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Cor da Camisa
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {["white", "black", "blue", "red", "green", "yellow"].map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`p-3 rounded-lg border-2 transition-all ${color === c ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
                                        }`}
                                >
                                    <div className="w-full h-8 rounded" style={{ backgroundColor: c === "white" ? "#f3f4f6" : c }} />
                                    <p className="text-xs mt-1 capitalize">{c}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tamanhos e Quantidades */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Tamanhos e Quantidades
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {Object.keys(sizes).map((size) => (
                                <div key={size}>
                                    <label className="block text-xs text-gray-600 mb-1">{size}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={sizes[size]}
                                        onChange={(e) => setSizes({ ...sizes, [size]: parseInt(e.target.value) || 0 })}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                                    />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Total: {totalQuantity} unidades</p>
                    </div>

                    {/* Material */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Material
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "algodao", label: "Algodão" },
                                { value: "poliester", label: "Poliéster" },
                                { value: "dryfit", label: "Dryfit" },
                            ].map((mat) => (
                                <button
                                    key={mat.value}
                                    onClick={() => setMaterial(mat.value)}
                                    className={`p-3 rounded-lg border-2 transition-all ${material === mat.value ? "border-blue-500 bg-blue-50" : "border-gray-200"
                                        }`}
                                >
                                    <p className="text-sm font-medium">{mat.label}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Observações (Opcional)
                        </label>
                        <textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Adicione observações sobre o pedido..."
                            className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={500}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {observations.length}/500 caracteres
                        </p>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3 pt-4">
                        <Button onClick={onClose} variant="outline" className="flex-1">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={!image || totalQuantity === 0 || saving}
                        >
                            {saving ? "Criando..." : "Criar Pedido"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
