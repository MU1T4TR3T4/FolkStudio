"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, ShoppingBag, Package, CheckCircle, Clock, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { saveImage, getImage } from "@/lib/storage";

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
    artImageUrl?: string | null;
    backArtImageUrl?: string | null;
}

export default function OrdersPage() {
    const router = useRouter();
    const [showNewOrderForm, setShowNewOrderForm] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [draftOrderData, setDraftOrderData] = useState<any>(null);

    useEffect(() => {
        loadOrders();
        checkDraftOrder();
    }, []);

    function checkDraftOrder() {
        const draft = localStorage.getItem("folk_studio_draft_order");
        if (draft) {
            try {
                const parsedDraft = JSON.parse(draft);
                setDraftOrderData(parsedDraft);
                setShowNewOrderForm(true);
                // Limpar o rascunho para não abrir novamente ao recarregar
                localStorage.removeItem("folk_studio_draft_order");
                toast.info("Continuando seu pedido...");
            } catch (e) {
                console.error("Erro ao carregar rascunho", e);
            }
        }
    }

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
                    // Não precisamos carregar as artes originais aqui para a lista, apenas para detalhes se necessário,
                    // mas para manter consistência, poderíamos. Por performance, vamos carregar só o necessário para renderizar a lista.
                    // A lista usa imageUrl.
                    return newOrder;
                }));

                setOrders(processedOrders);
            }
        } catch (error) {
            console.error("Erro ao carregar pedidos:", error);
        } finally {
            setLoading(false);
        }
    }

    function deleteOrder(id: string) {
        const updatedOrders = orders.filter(order => order.id !== id);
        setOrders(updatedOrders);
        localStorage.setItem("folk_studio_orders", JSON.stringify(updatedOrders));
        toast.success("Pedido removido");
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
                    onClick={() => {
                        setDraftOrderData(null);
                        setShowNewOrderForm(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Novo Pedido
                </Button>
            </div>

            {/* Modal de Novo Pedido */}
            {showNewOrderForm && (
                <NewOrderForm
                    initialData={draftOrderData}
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
                        <div key={order.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow relative group">
                            <button
                                onClick={() => deleteOrder(order.id)}
                                className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                                title="Excluir pedido"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>

                            <div className="aspect-square bg-gray-100 relative p-4">
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
                                    <p><span className="font-medium">Cor:</span> <span className="capitalize">{order.color}</span></p>
                                    <p><span className="font-medium">Material:</span> <span className="capitalize">{order.material}</span></p>
                                    <p><span className="font-medium">Tamanhos:</span> {Object.entries(order.sizes).filter(([_, qty]) => qty > 0).map(([size, qty]) => `${size}(${qty})`).join(", ")}</p>
                                    {order.observations && (
                                        <p className="mt-2 pt-2 border-t border-gray-100 italic text-gray-500 truncate">
                                            "{order.observations}"
                                        </p>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                                    >
                                        <Eye className="h-4 w-4" />
                                        Ver Detalhes e Chat
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function NewOrderForm({ onClose, onSuccess, initialData }: { onClose: () => void; onSuccess: () => void; initialData?: any }) {
    const [image, setImage] = useState<string | null>(initialData?.imageUrl || null);
    const [backImage, setBackImage] = useState<string | null>(initialData?.backImageUrl || null);
    const [color, setColor] = useState(initialData?.color || "white");
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

    // Novos estados para arte original
    const [artImage, setArtImage] = useState<string | null>(null);
    const [backArtImage, setBackArtImage] = useState<string | null>(null);

    const [showStampSelector, setShowStampSelector] = useState(false);
    const [savedStamps, setSavedStamps] = useState<any[]>([]);

    useEffect(() => {
        const stamps = localStorage.getItem("folk_studio_stamps");
        if (stamps) {
            setSavedStamps(JSON.parse(stamps));
        }
    }, []);


    // Carregar artes originais do initialData (quando vem de uma estampa)
    useEffect(() => {
        async function loadInitialArt() {
            // Carregar mockup da frente
            if (initialData?.imageUrl) {
                let front = initialData.imageUrl;
                if (front.startsWith('idb:')) {
                    const val = await getImage(front.replace('idb:', ''));
                    if (val) front = val;
                }
                setImage(front);
            }

            // Carregar arte original da frente
            if (initialData?.logoFrontUrl) {
                let logoFront = initialData.logoFrontUrl;
                if (logoFront.startsWith('idb:')) {
                    const val = await getImage(logoFront.replace('idb:', ''));
                    if (val) logoFront = val;
                }
                setArtImage(logoFront);
            }

            // Carregar arte original das costas
            if (initialData?.logoBackUrl) {
                let logoBack = initialData.logoBackUrl;
                if (logoBack.startsWith('idb:')) {
                    const val = await getImage(logoBack.replace('idb:', ''));
                    if (val) logoBack = val;
                }
                setBackArtImage(logoBack);
            }

            // Carregar mockup das costas
            if (initialData?.backImageUrl) {
                let back = initialData.backImageUrl;
                if (back.startsWith('idb:')) {
                    const val = await getImage(back.replace('idb:', ''));
                    if (val) back = val;
                }
                setBackImage(back);
            }
        }
        loadInitialArt();
    }, [initialData]);

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

                    // Redimensionar se for muito grande (max 800px para localStorage)
                    const MAX_SIZE = 800;
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

                    // Converter para Base64 com qualidade média (0.7)
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                    setImage(compressedBase64);
                    // Se for upload manual, a imagem É a arte
                    setArtImage(compressedBase64);
                    setBackArtImage(null);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelectStamp = async (stamp: any) => {
        let front = stamp.frontImageUrl;
        let back = stamp.backImageUrl;
        let logoFront = stamp.logoFrontUrl;
        let logoBack = stamp.logoBackUrl;

        // Resolver imagens do IDB se necessário
        if (front?.startsWith('idb:')) {
            const val = await getImage(front.replace('idb:', ''));
            if (val) front = val;
        }
        if (back?.startsWith('idb:')) {
            const val = await getImage(back.replace('idb:', ''));
            if (val) back = val;
        }
        if (logoFront?.startsWith('idb:')) {
            const val = await getImage(logoFront.replace('idb:', ''));
            if (val) logoFront = val;
        }
        if (logoBack?.startsWith('idb:')) {
            const val = await getImage(logoBack.replace('idb:', ''));
            if (val) logoBack = val;
        }

        setImage(front);
        setBackImage(back || null);
        if (stamp.color) setColor(stamp.color);

        // Capturar arte original se existir
        setArtImage(logoFront || null);
        setBackArtImage(logoBack || null);

        setShowStampSelector(false);
        toast.success("Estampa selecionada!");
    };

    const totalQuantity = Object.values(sizes).reduce((sum, qty) => sum + qty, 0);

    const handleSubmit = async () => {
        setSaving(true);
        try {
            // Simular delay de rede
            await new Promise(resolve => setTimeout(resolve, 800));

            const orderId = crypto.randomUUID();

            // Salvar imagens no IDB para não estourar localStorage
            if (image) await saveImage(`order-front-${orderId}`, image);
            if (backImage) await saveImage(`order-back-${orderId}`, backImage);
            if (artImage) await saveImage(`order-art-front-${orderId}`, artImage);
            if (backArtImage) await saveImage(`order-art-back-${orderId}`, backArtImage);

            const newOrder: Order = {
                id: orderId,
                imageUrl: `idb:order-front-${orderId}`,
                color,
                material,
                sizes,
                totalQty: totalQuantity,
                observations: observations.trim() || null,
                status: "Pendente",
                createdAt: new Date().toISOString(),
                backImageUrl: backImage ? `idb:order-back-${orderId}` : null,
                artImageUrl: artImage ? `idb:order-art-front-${orderId}` : null,
                backArtImageUrl: backArtImage ? `idb:order-art-back-${orderId}` : null,
            };

            // Salvar no localStorage
            const savedOrders = localStorage.getItem("folk_studio_orders");
            const orders = savedOrders ? JSON.parse(savedOrders) : [];
            orders.unshift(newOrder); // Adicionar no início
            localStorage.setItem("folk_studio_orders", JSON.stringify(orders));

            toast.success("Pedido criado com sucesso!");
            onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar pedido");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
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

                        <div className="flex gap-4 mb-4">
                            <Button
                                type="button"
                                onClick={() => setShowStampSelector(true)}
                                variant="outline"
                                className="w-full border-dashed border-2 h-auto py-4 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                            >
                                <ShoppingBag className="h-6 w-6" />
                                <span>Selecionar de Minhas Estampas</span>
                            </Button>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="order-image-upload"
                            />
                            <label htmlFor="order-image-upload" className="cursor-pointer block w-full h-full">
                                {image ? (
                                    backImage ? (
                                        // Mostrar frente e costas lado a lado
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 mb-2">Frente</p>
                                                <img src={image} alt="Frente" className="max-h-48 mx-auto rounded shadow-sm" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs text-gray-500 mb-2">Costas</p>
                                                <img src={backImage} alt="Costas" className="max-h-48 mx-auto rounded shadow-sm" />
                                            </div>
                                        </div>
                                    ) : (
                                        // Mostrar apenas frente
                                        <div className="relative group">
                                            <img src={image} alt="Preview" className="max-h-48 mx-auto rounded shadow-sm" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium rounded">
                                                Clique para alterar
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div>
                                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Ou faça upload de uma imagem</p>
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
                            {["white", "black", "blue"].map((c) => (
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

                {/* Modal de Seleção de Estampa */}
                {showStampSelector && (
                    <div className="absolute inset-0 bg-white z-10 flex flex-col rounded-xl">
                        <div className="p-4 border-b flex items-center justify-between bg-gray-50 rounded-t-xl">
                            <h3 className="font-bold text-lg">Selecionar Estampa</h3>
                            <Button onClick={() => setShowStampSelector(false)} variant="ghost" size="sm">
                                Fechar
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {savedStamps.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <p>Nenhuma estampa salva encontrada.</p>
                                    <p className="text-sm mt-2">Crie modelos no Studio primeiro.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {savedStamps.map((stamp) => (
                                        <button
                                            key={stamp.id}
                                            onClick={() => handleSelectStamp(stamp)}
                                            className="group relative border rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 focus:outline-none transition-all text-left"
                                        >
                                            <div className="aspect-square bg-gray-100 p-2">
                                                <img
                                                    src={stamp.frontImageUrl}
                                                    alt={stamp.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <div className="p-2 bg-white">
                                                <p className="text-xs font-medium truncate text-gray-900">{stamp.name}</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                    {new Date(stamp.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
