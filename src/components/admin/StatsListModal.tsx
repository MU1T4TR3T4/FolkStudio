import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink, Package, User } from "lucide-react";
import { Order } from "@/lib/orders";
import { Client } from "@/lib/clients";

// Helper for time ago (duplicated for now to avoid dependency issues if utils not present)
function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "agora mesmo";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `há ${diffInHours} h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `há ${diffInDays} dias`;
    return date.toLocaleDateString('pt-BR');
}

interface StatsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    type: 'orders' | 'clients';
    data: (Order | Client)[];
    onItemClick: (item: Order | Client) => void;
}

export function StatsListModal({ isOpen, onClose, title, type, data, onItemClick }: StatsListModalProps) {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        {type === 'orders' ? <Package className="h-5 w-5 text-blue-500" /> : <User className="h-5 w-5 text-purple-500" />}
                        {title}
                        <Badge variant="secondary" className="ml-2 text-sm">
                            {data.length}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="h-[400px] mt-4 pr-4">
                    <div className="space-y-3">
                        {data.length === 0 ? (
                            <p className="text-center text-gray-500 py-10">Nenhum item encontrado nesta categoria.</p>
                        ) : (
                            data.map((item: any) => (
                                <div
                                    key={item.id}
                                    onClick={() => onItemClick(item)}
                                    className="p-4 rounded-lg border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer group flex items-center justify-between"
                                >
                                    <div>
                                        {type === 'orders' ? (
                                            <>
                                                <p className="font-semibold text-gray-800 flex items-center gap-2">
                                                    Pedido #{item.order_number || item.id.slice(0, 6)}
                                                    <span className="text-xs font-normal text-gray-500">
                                                        ({item.customer_name})
                                                    </span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    No estágio atual: <span className="font-medium text-blue-600">{formatTimeAgo(item.updated_at || item.created_at)}</span>
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-semibold text-gray-800">{item.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {item.email || "Sem email"} • {item.phone || "Sem telefone"}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
