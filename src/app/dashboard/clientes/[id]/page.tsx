"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, User, Mail, Phone, MapPin, FileText,
    ShoppingBag, Calendar, CheckCircle, Clock, Package,
    Plus, Stamp, ExternalLink, Link as LinkIcon, Eye, Check, Copy, X, PenTool, Trash2, Download
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getClientById, Client, getClientStamps, ClientStamp, removeClientStamp } from "@/lib/clients";
import { getAllOrders, Order } from "@/lib/orders";
import { getImage } from "@/lib/storage";
import { toast, Toaster } from "sonner";
import { ClientModal } from "@/components/dashboard/ClientModal";

export default function ClientDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;

    const [client, setClient] = useState<Client | null>(null);
    const [clientOrders, setClientOrders] = useState<Order[]>([]);
    const [clientStamps, setClientStamps] = useState<ClientStamp[]>([]);
    const [loading, setLoading] = useState(true);

    // Image View Modal
    const [viewImage_url, setViewImage_url] = useState<string | null>(null);
    const [viewImage_designId, setViewImage_designId] = useState<string | null>(null);

    // Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [selectedSignatureUrl, setSelectedSignatureUrl] = useState<string | null>(null);
    const [stampToRemove, setStampToRemove] = useState<ClientStamp | null>(null); // State for deletion confirmation

    // Mock for stamp assignment (in real app, would open a modal to select stamp)
    // We will reuse the logic from Orders page but perhaps simpler, or just redirect to Studio/Orders with pre-selected client

    useEffect(() => {
        if (clientId) {
            loadClientData();
        }
    }, [clientId]);

    async function loadClientData() {
        setLoading(true);
        try {
            const clientData = await getClientById(clientId);
            if (!clientData) {
                toast.error("Cliente não encontrado");
                router.push("/dashboard/clientes");
                return;
            }
            setClient(clientData);

            // Load assigned stamps and process images
            const loadedStamps = await getClientStamps(clientId);
            const processedStamps = await Promise.all(loadedStamps.map(async (s) => {
                let imgUrl = s.type === 'stamp' ? s.stamp?.image_url : s.design?.final_image_url;
                if (imgUrl?.startsWith('idb:')) {
                    const key = imgUrl.replace('idb:', '');
                    const blobUrl = await getImage(key);
                    if (blobUrl) {
                        if (s.type === 'stamp' && s.stamp) s.stamp.image_url = blobUrl;
                        if (s.type === 'design' && s.design) s.design.final_image_url = blobUrl;
                    }
                }
                return s;
            }));
            setClientStamps(processedStamps);


            // Load orders contextually
            // Note: Our order system currently doesn't strictly have client_id in the interface in orders.ts
            // We need to fetch all orders and filter, or update orders.ts to support filtering by client_id
            // For now, let's fetch all and filter client-side or assume we implement a fetchByClientId

            // TODO: Update orders.ts to properly support client_id filtering on backend
            // Quick hack: Fetch all and match by name or email? 
            // Ideally we need to link them. 
            // Let's assume for this step we only show what we can, or just mock Empty for now if no orders linked.
            // Since we just added client_id to DB, existing orders won't have it.
            // New orders created FROM THIS SCREEN should have it.

            const allOrders = await getAllOrders();
            // Filter orders that belong to this client (by client_id if we added it to TS interface, or strictly by matching email/name as fallback)
            const filtered = allOrders.filter(o =>
                o.client_id === clientId ||
                (clientData.email && o.customer_email === clientData.email) ||
                (o.customer_name === clientData.name) // Fallback match
            );

            // Process images for display
            const processedOrders = await Promise.all(filtered.map(async (order) => {
                const newOrder = { ...order };
                if (newOrder.imageUrl?.startsWith('idb:')) {
                    const key = newOrder.imageUrl.replace('idb:', '');
                    const img = await getImage(key);
                    if (img) newOrder.imageUrl = img;
                }
                return newOrder;
            }));

            setClientOrders(processedOrders);

        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados");
        } finally {
            setLoading(false);
        }
    }

    const handleStartOrder = () => {
        // Redirect to New Order modal logic? 
        // Or redirect to Orders page with query param?
        // Since Orders page has the modal logic inside, passing state might be tricky via URL.
        // Best approach: Redirect to /dashboard/orders?new=true&clientId=XYZ
        router.push(`/dashboard/orders?new=true&client_id=${clientId}&client_name=${encodeURIComponent(client?.name || '')}`);
    };

    const handleAssignStamp = () => {
        // Redirect to "Minhas Estampas" with a mode to "Select for Client"?
        // Or simply open a modal here to select a stamp -> then go to Create Order with that Stamp + Client.
        // Let's go to Estampas page.
        router.push(`/dashboard/estampas?select_for_client=${clientId}&client_name=${encodeURIComponent(client?.name || '')}`);
    };

    const handleOrderFromStamp = (stamp: ClientStamp) => {
        let url = "/dashboard/orders";
        url += `?client_id=${clientId}&client_name=${encodeURIComponent(client?.name || '')}`;

        // Construct the draft order similar to EstampasPage
        const draftOrder: any = {
            source: "client_page_stamp",
            color: "white" // default
        };

        if (stamp.type === 'stamp' && stamp.stamp) {
            draftOrder.imageUrl = stamp.stamp.image_url;
            draftOrder.backImageUrl = null;
        } else if (stamp.type === 'design' && stamp.design) {
            draftOrder.imageUrl = stamp.design.final_image_url;
            draftOrder.mockupImage = stamp.design.mockup_image;
            draftOrder.productType = stamp.design.product_type;
            draftOrder.color = stamp.design.color;
            draftOrder.elements = stamp.design.elements;
        }

        localStorage.setItem("folk_studio_draft_order", JSON.stringify(draftOrder));
        router.push(url);
    };

    const handleCopyApprovalLink = (token?: string) => {
        if (!token) return;
        const url = `${window.location.origin}/approval/${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Link de aprovação copiado!");
    };

    const handleEditDesign = () => {
        if (!viewImage_designId) return;
        router.push(`/dashboard/studio?edit_design_id=${viewImage_designId}&client_id=${clientId}`);
    };

    const handleDownloadImage = async () => {
        if (!viewImage_url) return;
        try {
            const response = await fetch(viewImage_url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            // Extract filename or default
            const filename = viewImage_url.split('/').pop() || 'estampa-folkstudio.png';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Download iniciado!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao baixar imagem");
        }
    };

    const handleRemoveStamp = async () => {
        if (!stampToRemove) return;

        const loadingToast = toast.loading("Removendo estampa...");
        const success = await removeClientStamp(stampToRemove.id);

        toast.dismiss(loadingToast);

        if (success) {
            toast.success("Estampa removida do cliente!");
            // Update local state immediately for better UX
            setClientStamps(prev => prev.filter(s => s.id !== stampToRemove.id));
        } else {
            toast.error("Erro ao remover estampa.");
        }
        setStampToRemove(null);
    };



    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando dados do cliente...</div>;
    }

    if (!client) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Toaster position="top-right" richColors />

            {/* Header / Back */}
            <div>
                <Button
                    variant="ghost"
                    className="mb-4 pl-0 hover:pl-2 transition-all gap-2 text-gray-500 hover:text-gray-900"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4" /> Voltar para Clientes
                </Button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-blue-200 shadow-lg">
                            {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                            {client.company_name && (
                                <p className="text-gray-500 text-lg">{client.company_name}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                            Editar Dados
                        </Button>
                        <Button onClick={handleStartOrder} className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200">
                            <Plus className="h-4 w-4 mr-2" /> Novo Pedido
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2 border-b pb-3">
                            <User className="h-4 w-4" /> Dados de Contato
                        </h3>

                        <div className="space-y-4">
                            {client.email && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                                        <p className="text-sm text-gray-900 break-all">{client.email}</p>
                                    </div>
                                </div>
                            )}

                            {client.phone && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Telefone</p>
                                        <p className="text-sm text-gray-900">{client.phone}</p>
                                    </div>
                                </div>
                            )}

                            {(client.address_street || client.address_city) && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Endereço</p>
                                        <p className="text-sm text-gray-900">
                                            {client.address_street}, {client.address_number}
                                            {client.address_complement && ` - ${client.address_complement}`}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {client.address_neighborhood}
                                            {client.address_neighborhood && client.address_city && ", "}
                                            {client.address_city} - {client.address_state}
                                        </p>
                                        <p className="text-sm text-gray-500">{client.address_zip}</p>
                                    </div>
                                </div>
                            )}

                            {client.cpf_cnpj && (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Documento</p>
                                        <p className="text-sm text-gray-900">{client.cpf_cnpj}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {client.notes && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4" /> Observações
                            </h3>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                "{client.notes}"
                            </p>
                        </div>
                    )}

                    {/* Quick Actions Card */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-1">Ações Rapidas</h3>
                            <p className="text-indigo-100 text-sm mb-4">Gerencie as artes deste cliente</p>

                            <Button
                                onClick={handleAssignStamp}
                                variant="secondary"
                                className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-0"
                            >
                                <Stamp className="h-4 w-4 mr-2" /> Atribuir Estampa
                            </Button>
                        </div>

                        {/* Decorative background icons */}
                        <Stamp className="absolute -bottom-4 -right-4 h-24 w-24 text-white opacity-10 transform rotate-12 group-hover:scale-110 transition-transform" />
                    </div>
                </div>

                {/* Right Column: Orders & History */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Assigned Stamps Section */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5" /> Histórico de Pedidos
                        </h2>
                        {clientOrders.length > 0 && (
                            <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                                {clientOrders.length} pedidos
                            </span>
                        )}
                    </div>

                    {clientOrders.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 border-dashed p-12 text-center">
                            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Package className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Sem pedidos registrados</h3>
                            <p className="text-gray-500 mt-1 mb-6">Inicie o primeiro pedido para este cliente agora mesmo.</p>
                            <Button onClick={handleStartOrder}>
                                Iniciar Pedido
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {clientOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer flex gap-4"
                                    onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                                >
                                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 p-2">
                                        {order.imageUrl ? (
                                            <img src={order.imageUrl} alt="Order" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Package className="h-8 w-8 text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {order.quantity}x {order.product_type} - {order.color}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <StatusBadge status={order.status} />
                                        </div>

                                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {/* Size summary */}
                                                {/* Note: order interface inside client details page might need casting or fixing if strictly typed from imported lib */}
                                            </div>
                                            {order.total_price && (
                                                <span className="font-bold text-green-600">
                                                    R$ {order.total_price.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center text-gray-400">
                                        <ExternalLink className="h-5 w-5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}


                    {/* Assigned Stamps Section (Moved) */}
                    {clientStamps.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Stamp className="h-5 w-5" /> Estampas Selecionadas
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {clientStamps.map(item => {
                                    const imgUrl = item.type === 'stamp' ? item.stamp?.image_url : item.design?.final_image_url;
                                    // Prefer final_image_with_design (if available) for visualization
                                    const viewUrl = item.type === 'stamp'
                                        ? item.stamp?.image_url
                                        : (item.design?.final_image_url || item.design?.mockup_image);
                                    const title = item.type === 'stamp' ? item.stamp?.name : `${item.design?.product_type} - ${item.design?.color}`;

                                    const isApproved = item.approval_status === "approved";

                                    return (
                                        <div key={item.id} className={`bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow flex flex-col group ${isApproved ? "border-green-500 ring-1 ring-green-100" : "border-gray-200"}`}>
                                            <div className="aspect-square bg-gray-50 p-2 relative">
                                                <img src={imgUrl || '/placeholder.png'} alt="Stamp" className="w-full h-full object-contain" />

                                                {/* Status Indicator */}
                                                {isApproved && (
                                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-sm">
                                                        <Check className="h-3 w-3 mr-1" /> APROVADO
                                                    </div>
                                                )}

                                                {/* Hover actions */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center p-3">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => {
                                                            setViewImage_url(viewUrl || null);
                                                            if (item.type === 'design') {
                                                                setViewImage_designId(item.design_id || null);
                                                            } else {
                                                                setViewImage_designId(null);
                                                            }
                                                        }}
                                                        className="w-full bg-white/90 hover:bg-white text-gray-900 border-0 h-8 relative justify-center"
                                                    >
                                                        <Eye className="absolute left-3 h-4 w-4" /> Visualizar
                                                    </Button>

                                                    {item.approval_token && !isApproved && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleCopyApprovalLink(item.approval_token)}
                                                            data-test-token={item.approval_token}
                                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0 h-8 relative justify-center"
                                                        >
                                                            <LinkIcon className="absolute left-3 h-4 w-4" /> Copiar Link
                                                        </Button>
                                                    )}

                                                    {isApproved && item.approval_signature && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => {
                                                                setSelectedSignatureUrl(item.approval_signature || null);
                                                                setIsSignatureModalOpen(true);
                                                            }}
                                                            className="w-full bg-white/90 hover:bg-white text-green-700 border-0 h-8 relative justify-center"
                                                            title="Ver Assinatura"
                                                        >
                                                            <PenTool className="absolute left-3 h-4 w-4" /> Ver Assinatura
                                                        </Button>
                                                    )}

                                                    <Button size="sm" onClick={() => handleOrderFromStamp(item)} className="w-full bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg font-medium tracking-wide h-8 relative justify-center">
                                                        <Package className="absolute left-3 h-4 w-4" /> Pedir
                                                    </Button>

                                                    <Button size="sm" variant="destructive" onClick={() => setStampToRemove(item)} className="w-full bg-red-500 hover:bg-red-600 text-white border-0 h-8 relative justify-center">
                                                        <Trash2 className="absolute left-3 h-4 w-4" /> Remover
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <p className="font-medium text-sm text-gray-900 truncate" title={title || ''}>{title || 'Estampa'}</p>
                                                <p className="text-xs text-gray-500 capitalize">{item.type === 'stamp' ? 'Modelo' : 'Design'}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Preview Window */}
            <Dialog open={!!viewImage_url} onOpenChange={(open) => !open && setViewImage_url(null)}>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
                    <DialogHeader className="px-6 py-4 border-b border-gray-100 flex flex-row items-center justify-between bg-gray-50/50">
                        <DialogTitle className="text-xl font-semibold text-gray-800">Visualização da Estampa</DialogTitle>
                        <div className="flex items-center gap-2 mr-8">
                            <Button variant="outline" size="sm" onClick={handleDownloadImage}>
                                <Download className="h-4 w-4 mr-2" />
                                Baixar
                            </Button>
                            {viewImage_designId && (
                                <Button variant="outline" size="sm" onClick={handleEditDesign}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Editar Estampa
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="p-6 bg-gray-50/30 flex justify-center items-center flex-1 overflow-auto min-h-[300px]">
                        {viewImage_url ? (
                            <img
                                src={viewImage_url}
                                alt="Visualização Final"
                                className="max-h-[70vh] w-auto object-contain rounded-md shadow-sm border border-gray-100"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-400">
                                <p>Imagem indisponível</p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Signature View Modal */}
            <Dialog open={isSignatureModalOpen} onOpenChange={setIsSignatureModalOpen}>
                <DialogContent className="sm:max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle>Assinatura do Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center p-4">
                        {selectedSignatureUrl ? (
                            <img src={selectedSignatureUrl} alt="Assinatura" className="max-h-64 object-contain border rounded-lg bg-white p-2" />
                        ) : (
                            <p className="text-gray-500">Assinatura não disponível</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Remove Confirmation Dialog */}
            <Dialog open={!!stampToRemove} onOpenChange={(open) => !open && setStampToRemove(null)}>
                <DialogContent className="sm:max-w-[425px] bg-white text-gray-900">
                    <DialogHeader>
                        <DialogTitle>Remover estampa do cliente?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600">
                            Tem certeza que deseja remover esta estampa deste cliente?
                            A estampa original não será apagada, apenas a associação com este cliente.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setStampToRemove(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleRemoveStamp}>Remover</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ClientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    loadClientData();
                    setIsEditModalOpen(false);
                }}
                client={client}
            />
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: "bg-yellow-100 text-yellow-800",
        confirmed: "bg-blue-100 text-blue-800",
        delivered: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800"
    };

    // Simple mapping fallback
    const style = styles[status as keyof typeof styles] || styles.pending;

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
            {status === 'pending' ? 'Pendente' :
                status === 'confirmed' ? 'Confirmado' :
                    status === 'delivered' ? 'Entregue' : status}
        </span>
    );
}
