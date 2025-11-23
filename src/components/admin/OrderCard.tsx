import { Package } from "lucide-react";

interface OrderCardProps {
    order: {
        id: string;
        imageUrl: string;
        color: string;
        totalQty: number;
        sizes: Record<string, number>;
        createdAt: string;
    };
    onClick: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
    const getSizesText = () => {
        const sizes = Object.entries(order.sizes)
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
            className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all hover:border-blue-300"
        >
            {/* Imagem */}
            <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
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
