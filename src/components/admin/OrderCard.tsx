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
    };
    onClick: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
    const isReturned = order.kanban_stage === 'returned' || order.status === 'returned';

    const getSizesText = () => {
        const sizes = Object.entries(order.sizes || {})
            .filter(([_, qty]) => qty > 0)
            .map(([size, qty]) => `${size}(${qty})`)
            .join(", ");
        return sizes || "N/A";
    };

    const getColorName = (color: string) => {
        const names: Record<string, string> = {
            white: "Branco",
            black: "Preto",
            blue: "Azul"
        };
        return names[color] || color;
    };

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
                <img
                    src={order.imageUrl}
                    alt="Mockup"
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Informações */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-xs font-mono text-gray-500">
                        #{order.id.slice(0, 8)}
                    </span>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cor:</span>
                        <span className="font-medium">{getColorName(order.color)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Qtd:</span>
                        <span className="font-medium">{order.totalQty}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                        {getSizesText()}
                    </div>
                    {/* Adicionais */}
                    {(order.ad1 || order.ad2 || order.ad3 || order.ad4) ? (
                        <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-gray-50">
                            {order.ad1 ? <span className="text-[10px] px-1 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">AD1: R${order.ad1}</span> : null}
                            {order.ad2 ? <span className="text-[10px] px-1 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">AD2: R${order.ad2}</span> : null}
                            {order.ad3 ? <span className="text-[10px] px-1 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">AD3: R${order.ad3}</span> : null}
                            {order.ad4 ? <span className="text-[10px] px-1 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">AD4: R${order.ad4}</span> : null}
                        </div>
                    ) : null}
                </div>

                <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                </div>
            </div>
        </div>
    );
}
