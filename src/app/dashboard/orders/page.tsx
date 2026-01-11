"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Upload, ShoppingBag, Package, CheckCircle, Clock, Trash2, Eye, User, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast, Toaster } from "sonner";
import { saveImage, getImage } from "@/lib/storage";
import { getAllOrders, createOrder, deleteOrder as deleteOrderFromDB } from "@/lib/orders";

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
    client_id?: string;
    customer_name?: string;
}

function OrdersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check URL params for auto-opening new order modal
    const isNewOrderRequested = searchParams.get('new') === 'true';
    const preselectedClientId = searchParams.get('client_id');
    const preselectedClientName = searchParams.get('client_name');

    const [showNewOrderForm, setShowNewOrderForm] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [draftOrderData, setDraftOrderData] = useState<any>(null);

    useEffect(() => {
        loadOrders();
        checkDraftOrder();

        // Handle URL params
        if (isNewOrderRequested) {
            setShowNewOrderForm(true);
        }
    }, [isNewOrderRequested]); // Re-run if params change

    function checkDraftOrder() {
        // Skip draft check if we are explicitly requested to start a new fresh order via URL
        if (isNewOrderRequested) return;

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
            let loadedOrders: Order[] = [];

            // Try loading from Supabase first
            const supabaseOrders = await getAllOrders();

            if (supabaseOrders && supabaseOrders.length > 0) {
                // Convert Supabase format to local format
                loadedOrders = supabaseOrders.map(order => {
                    // Tentar parsear tamanhos se estiver no formato "Tamanho:Qtd"
                    let parsedSizes: Record<string, number> = {};
                    if (order.size && order.size.includes(':')) {
                        order.size.split(',').forEach(p => {
                            const [s, q] = p.split(':');
                            if (s && q) parsedSizes[s.trim()] = parseInt(q.trim()) || 0;
                        });
                    } else if (order.size) {
                        parsedSizes = { [order.size]: order.quantity };
                    }

                    return {
                        id: order.id,
                        imageUrl: order.imageUrl || '',
                        color: order.color,
                        material: order.product_type || 'algodao',
                        sizes: parsedSizes,
                        totalQty: order.quantity,
                        observations: order.notes || null,
                        status: order.status === 'pending' ? 'Pendente' :
                            order.status === 'in_production' ? 'Em Produção' : 'Concluído',
                        createdAt: order.created_at,
                        backImageUrl: order.backImageUrl,
                        client_id: order.client_id,
                        customer_name: order.customer_name
                    };
                });
            } else {
                // Fallback to localStorage
                const savedOrders = localStorage.getItem("folk_studio_orders");
                if (savedOrders) {
                    loadedOrders = JSON.parse(savedOrders);
                }
            }

            // Hydrate Images from IDB (Crucial for images saved as idb:...)
            const processedOrders = await Promise.all(loadedOrders.map(async (order) => {
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
                return newOrder;
            }));

            setOrders(processedOrders);

        } catch (error) {
            console.error("Erro ao carregar pedidos:", error);
            toast.error("Erro ao carregar pedidos");
        } finally {
            setLoading(false);
        }
    }

    async function deleteOrder(id: string) {
        try {
            // Try deleting from Supabase
            await deleteOrderFromDB(id);

            // Update local state
            const updatedOrders = orders.filter(order => order.id !== id);
            setOrders(updatedOrders);

            // Also update localStorage as fallback
            localStorage.setItem("folk_studio_orders", JSON.stringify(updatedOrders));
            toast.success("Pedido removido");
        } catch (error) {
            console.error("Erro ao deletar pedido:", error);
            toast.error("Erro ao remover pedido");
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

    // Determine props for new order form
    const preselectedClient = (preselectedClientId && preselectedClientName)
        ? { id: preselectedClientId, name: preselectedClientName }
        : undefined;

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
                    preselectedClient={preselectedClient}
                    onClose={() => {
                        setShowNewOrderForm(false);
                        // Clear URL params if present
                        if (isNewOrderRequested) {
                            router.replace('/dashboard/orders');
                        }
                    }}
                    onSuccess={() => {
                        setShowNewOrderForm(false);
                        loadOrders();
                        // Clear URL params if present
                        if (isNewOrderRequested) {
                            router.replace('/dashboard/orders');
                        }
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
                                    {order.customer_name && (
                                        <p><span className="font-medium">Cliente:</span> {order.customer_name}</p>
                                    )}
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

function NewOrderForm({ onClose, onSuccess, initialData, preselectedClient }: { onClose: () => void; onSuccess: () => void; initialData?: any; preselectedClient?: { id: string, name: string } }) {
    const [image, setImage] = useState<string | null>(initialData?.imageUrl || null);
    const [backImage, setBackImage] = useState<string | null>(initialData?.backImageUrl || null);
    const [color, setColor] = useState(initialData?.color || "white");
    const [sizes, setSizes] = useState<Record<string, number>>({
        "M-P": 0, "M-M": 0, "M-G": 0, "M-GG": 0, "M-XG": 0,
        "F-P": 0, "F-M": 0, "F-G": 0, "F-GG": 0, "F-XG": 0,
    });
    const [material, setMaterial] = useState("PV");
    const [observations, setObservations] = useState("");

    const [saving, setSaving] = useState(false);

    // Novos estados para arte original
    const [artImage, setArtImage] = useState<string | null>(null);
    const [backArtImage, setBackArtImage] = useState<string | null>(null);

    const [showStampSelector, setShowStampSelector] = useState(false);
    const [savedStamps, setSavedStamps] = useState<any[]>([]);

    // Preview Modal State
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Zoom Panning logic
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);
    const startPosRef = useRef({ x: 0, y: 0 });
    const scrollPosRef = useRef({ left: 0, top: 0 });
    const hasMovedRef = useRef(false);

    // Zoom Focus Logic
    // Store relative mouse position (0-1) before zoom to restore it after
    const lastZoomPointerRef = useRef({ x: 0.5, y: 0.5 });
    const needsScrollCorrectionRef = useRef(false);

    useEffect(() => {
        const container = previewContainerRef.current;
        if (!container) return;

        const onWheel = (e: WheelEvent) => {
            if (!previewImage) return;
            e.preventDefault();

            // Calculate pointer relative position (0-1) in container viewport
            const rect = container.getBoundingClientRect();

            // "Point under mouse" in scrollable space
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const absoluteX = container.scrollLeft + mouseX;
            const absoluteY = container.scrollTop + mouseY;

            lastZoomPointerRef.current = {
                x: absoluteX / zoomLevel, // unscaled units
                y: absoluteY / zoomLevel, // unscaled units
            };

            // Target mouse position on screen (to restore to)
            startPosRef.current = { x: mouseX, y: mouseY }; // reusing startPosRef for temporary storage of screen target

            needsScrollCorrectionRef.current = true;

            const delta = -Math.sign(e.deltaY) * 0.5; // Faster zoom
            setZoomLevel(prev => {
                const newZoom = Math.max(1, Math.min(prev + delta, 5));
                return newZoom;
            });
        };

        container.addEventListener('wheel', onWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', onWheel);
        };
    }, [previewImage, zoomLevel]); // Dependencies need to include zoomLevel to calculate absolute position correctly

    // Apply scroll correction after zoom change
    useEffect(() => {
        if (needsScrollCorrectionRef.current && previewContainerRef.current) {
            const container = previewContainerRef.current;
            const targetUnscaled = lastZoomPointerRef.current;
            const screenTarget = startPosRef.current; // The mouse position on screen should stay here

            const newAbsoluteX = targetUnscaled.x * zoomLevel;
            const newAbsoluteY = targetUnscaled.y * zoomLevel;

            container.scrollLeft = newAbsoluteX - screenTarget.x;
            container.scrollTop = newAbsoluteY - screenTarget.y;

            needsScrollCorrectionRef.current = false;
        }
    }, [zoomLevel]); // Runs after zoom update

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel <= 1 || !previewContainerRef.current) return;
        isDraggingRef.current = true;
        hasMovedRef.current = false;
        startPosRef.current = { x: e.pageX, y: e.pageY };
        scrollPosRef.current = {
            left: previewContainerRef.current.scrollLeft,
            top: previewContainerRef.current.scrollTop
        };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingRef.current || zoomLevel <= 1 || !previewContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - startPosRef.current.x;
        const y = e.pageY - startPosRef.current.y;

        if (Math.abs(x) > 5 || Math.abs(y) > 5) {
            hasMovedRef.current = true;
        }

        previewContainerRef.current.scrollLeft = scrollPosRef.current.left - x;
        previewContainerRef.current.scrollTop = scrollPosRef.current.top - y;
    };

    const handleMouseUp = () => {
        isDraggingRef.current = false;
    };

    const handlePreviewClick = (e: React.MouseEvent) => {
        if (!hasMovedRef.current && previewContainerRef.current) {
            const container = previewContainerRef.current;
            const rect = container.getBoundingClientRect();

            // Prepare for zoom toggle (similar logic to wheel)
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const absoluteX = container.scrollLeft + mouseX;
            const absoluteY = container.scrollTop + mouseY;

            lastZoomPointerRef.current = {
                x: absoluteX / zoomLevel,
                y: absoluteY / zoomLevel,
            };
            startPosRef.current = { x: mouseX, y: mouseY };
            needsScrollCorrectionRef.current = true;

            // Toggle between 1x and 2x if clicked without dragging
            setZoomLevel(prev => prev > 1.1 ? 1 : 2); // 1.1 tolerant threshold
        }
    };

    // Reset zoom when opening new image
    useEffect(() => {
        setZoomLevel(1);
    }, [previewImage]);

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

            // Construct payload for createOrder (matches lib/orders.ts interface)
            const dbOrder: any = {
                id: orderId,
                client_id: preselectedClient?.id,
                customer_name: preselectedClient?.name || 'Cliente',

                product_type: material,
                color: color,
                quantity: totalQuantity,
                size: Object.entries(sizes).filter(([_, v]) => v > 0).map(([s, v]) => `${s}:${v}`).join(', '),
                notes: observations.trim() || undefined,
                status: "pending",
                created_at: new Date().toISOString(),

                // Images
                imageUrl: `idb:order-front-${orderId}`,
                backImageUrl: backImage ? `idb:order-back-${orderId}` : undefined,
                logoFrontUrl: artImage ? `idb:order-art-front-${orderId}` : undefined,
                logoBackUrl: backArtImage ? `idb:order-art-back-${orderId}` : undefined,
            };

            // Call Supabase/Lib create function
            await createOrder(dbOrder);

            // Also update local state for immediate UI feedback if needed (but onSuccess triggers reload usually)
            // Ideally we rely on onSuccess -> loadOrders, but purely local app might need local update?
            // loadOrders fetches from storage/DB so it should be fine.

            // Legacy local update for immediate feel if offline? 
            // The lib creates it in localStorage so loadOrders will see it.

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
                    {/* Client Indicator */}
                    {preselectedClient && (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-blue-700">
                            <User className="h-4 w-4" />
                            <span className="text-sm font-medium">Pedido para: <strong>{preselectedClient.name}</strong></span>
                        </div>
                    )}

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

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="order-image-upload"
                            />
                            {image ? (
                                <div className="w-full">
                                    {backImage ? (
                                        // Mostrar frente e costas lado a lado
                                        <div className="grid grid-cols-2 gap-4 cursor-pointer" onClick={() => setPreviewImage(image)}>
                                            <div className="text-center group relative">
                                                <p className="text-xs text-gray-500 mb-2">Frente</p>
                                                <img src={image} alt="Frente" className="max-h-48 mx-auto rounded shadow-sm" />
                                                <div className="absolute inset-0 top-6 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium rounded">
                                                    <Eye className="h-4 w-4 mr-2" /> Visualizar
                                                </div>
                                            </div>
                                            <div className="text-center group relative" onClick={(e) => { e.stopPropagation(); setPreviewImage(backImage); }}>
                                                <p className="text-xs text-gray-500 mb-2">Costas</p>
                                                <img src={backImage} alt="Costas" className="max-h-48 mx-auto rounded shadow-sm" />
                                                <div className="absolute inset-0 top-6 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium rounded">
                                                    <Eye className="h-4 w-4 mr-2" /> Visualizar
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // Mostrar apenas frente
                                        <div className="relative group cursor-pointer" onClick={() => setPreviewImage(image)}>
                                            <img src={image} alt="Preview" className="max-h-48 mx-auto rounded shadow-sm" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium rounded">
                                                <Eye className="h-4 w-4 mr-2" /> Visualizar
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 flex justify-center">
                                        <label htmlFor="order-image-upload" className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center">
                                            <Upload className="h-3 w-3 mr-1" /> Alterar imagem (Upload)
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <label htmlFor="order-image-upload" className="cursor-pointer block w-full h-full">
                                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Ou faça upload de uma imagem</p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG (max. 5MB)</p>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Tamanhos e Quantidades */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-4">
                            Tamanhos e Quantidades
                        </label>

                        {/* Masculino */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-gray-500 mb-2 uppercase bg-gray-50 p-1 rounded inline-block">Masculino</p>
                            <div className="grid grid-cols-5 gap-2">
                                {["P", "M", "G", "GG", "XG"].map((s) => (
                                    <div key={`M-${s}`}>
                                        <label className="block text-[10px] text-gray-400 mb-1 text-center">{s}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={sizes[`M-${s}`] || 0}
                                            onChange={(e) => setSizes({ ...sizes, [`M-${s}`]: parseInt(e.target.value) || 0 })}
                                            className="w-full px-1 py-2 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Feminino */}
                        <div className="mb-2">
                            <p className="text-xs font-bold text-gray-500 mb-2 uppercase bg-gray-50 p-1 rounded inline-block">Feminino</p>
                            <div className="grid grid-cols-5 gap-2">
                                {["P", "M", "G", "GG", "XG"].map((s) => (
                                    <div key={`F-${s}`}>
                                        <label className="block text-[10px] text-gray-400 mb-1 text-center">{s}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={sizes[`F-${s}`] || 0}
                                            onChange={(e) => setSizes({ ...sizes, [`F-${s}`]: parseInt(e.target.value) || 0 })}
                                            className="w-full px-1 py-2 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                            <span className="text-xs font-medium text-blue-800">Total de Peças</span>
                            <span className="text-lg font-bold text-blue-700">{totalQuantity}</span>
                        </div>
                    </div>

                    {/* Material */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            Material (Tecido)
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {["PV", "AL", "DRY", "PA"].map((mat) => (
                                <button
                                    key={mat}
                                    onClick={() => setMaterial(mat)}
                                    className={`p-3 rounded-xl border-2 transition-all ${material === mat ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-100 bg-white text-gray-500 hover:border-gray-300"
                                        }`}
                                >
                                    <p className="text-sm font-bold">{mat}</p>
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

                {/* Preview Dialog */}
                <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                    <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-white rounded-lg shadow-2xl border-0 flex flex-col max-h-[90vh]">
                        <DialogHeader className="px-6 py-4 border-b border-gray-100 flex flex-row items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-xl font-semibold text-gray-800">Visualização da Estampa</DialogTitle>
                                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{zoomLevel.toFixed(1)}x</span>
                            </div>
                            <div className="flex items-center gap-2 mr-8">
                                {/* Download removido a pedido */}
                            </div>
                        </DialogHeader>

                        <div
                            ref={previewContainerRef}
                            className={`p-6 bg-gray-50/30 flex justify-center items-center flex-1 overflow-auto min-h-[300px] transition-all select-none ${zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing items-start justify-start' : 'cursor-zoom-in'}`}
                            onClick={handlePreviewClick}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {previewImage && (
                                <img
                                    src={previewImage}
                                    style={zoomLevel === 1 ? {
                                        pointerEvents: 'none',
                                        maxHeight: '70vh',
                                        maxWidth: '100%',
                                        width: 'auto',
                                        height: 'auto'
                                    } : {
                                        pointerEvents: 'none',
                                        height: `${70 * zoomLevel}vh`,
                                        maxWidth: 'none',
                                        width: 'auto'
                                    }}
                                    alt="Visualização"
                                    className={`object-contain rounded-md shadow-sm border border-gray-100 transition-all duration-75 ease-linear`}
                                />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500">Carregando...</div>}>
            <OrdersContent />
        </Suspense>
    );
}
