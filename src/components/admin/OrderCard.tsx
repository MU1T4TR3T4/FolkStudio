import { Package, AlertCircle } from "lucide-react";

interface OrderCardProps {
    order: {
        id: string;
        imageUrl: string;
        color: string;
        totalQty: number;
        sizes: Record<string, number>;
        createdAt: string;
        ad1?: number;
        ad2?: number;
        ad3?: number;
        ad4?: number;
        kanban_stage?: string;
        status?: string;
        // DB snake_case mappings
        created_at?: string;
        updated_at?: string;
        customer_name?: string;
        image_url?: string; // Fallback for imageUrl
    };
    onClick: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
    const isReturned = order.kanban_stage === 'returned' || order.status === 'returned';

    // Image fallback (DB uses image_url, App uses imageUrl)
    const displayImage = order.imageUrl || (order as any).image_url;

    // Days in stage calculation
    // Ideally we would track "entered_stage_at", but for now we use updated_at as proxy for last movement
    const lastUpdate = new Date(order.updated_at || order.created_at || order.createdAt || new Date());
    const daysInStage = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

    // Date formatting (Handle DB ISO string or App Date string)
    const orderDate = new Date(order.created_at || order.createdAt || new Date()).toLocaleDateString("pt-BR");

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-all relative ${isReturned ? 'border-red-500 shadow-sm' : 'border-gray-200 hover:border-blue-300'
                }`}
        >
            {isReturned && (
                <div className="absolute top-2 right-2 bg-red-100 text-red-700 p-1 rounded-full z-10" title="Pedido Devolvido">
                    <AlertCircle className="h-4 w-4" />
                </div>
            )}

            {/* Imagem */}
            <div className={`aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden ${isReturned ? 'opacity-90' : ''}`}>
                {displayImage ? (
                    <img
                        src={displayImage}
                        alt="Mockup"
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package className="h-10 w-10" />
                    </div>
                )}
            </div>

            {/* Informações */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-400">
                        {orderDate}
                    </span>
                </div>

                <div>
                    <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {order.customer_name || (order as any).clientName || "Cliente"}
                    </p>
                    <p className="text-xs text-blue-600 font-medium">
                        {daysInStage === 0 ? "Hoje" : `${daysInStage} dia${daysInStage > 1 ? 's' : ''}`} na etapa
                    </p>
                </div>

                {/* Adicionais */}
                {(order.ad1 || order.ad2 || order.ad3 || order.ad4) ? (
                    <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-gray-50">
                        {order.ad1 ? <span className="text-[10px] px-1 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">AD1</span> : null}
                        {order.ad2 ? <span className="text-[10px] px-1 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">AD2</span> : null}
                        {order.ad3 ? <span className="text-[10px] px-1 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">AD3</span> : null}
                        {order.ad4 ? <span className="text-[10px] px-1 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">AD4</span> : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
