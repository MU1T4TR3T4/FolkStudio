import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/lib/orders";
import { AlertCircle, Clock } from "lucide-react";

interface OrderAgingListProps {
    orders: Order[];
}

export function OrderAgingList({ orders }: OrderAgingListProps) {
    // Filter logic: Not finalized/cancelled, diff > 3 days
    const agedOrders = orders.filter(o => {
        if (!o.kanban_stage || ['finalized', 'delivered', 'cancelled'].includes(o.kanban_stage)) return false;
        if (o.kanban_stage === 'returned') return false; // Handled separately

        const lastUpdate = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
        const diffAccess = new Date().getTime() - lastUpdate.getTime();
        const diffDays = diffAccess / (1000 * 3600 * 24);
        return diffDays > 3;
    }).map(o => {
        const lastUpdate = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
        const diffAccess = new Date().getTime() - lastUpdate.getTime();
        const diffDays = Math.floor(diffAccess / (1000 * 3600 * 24));
        return { ...o, daysStuck: diffDays };
    }).sort((a, b) => b.daysStuck - a.daysStuck);

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                    <Clock className="h-5 w-5" />
                    Pedidos Parados (Gargalos)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {agedOrders.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Nenhum pedido parado há mais de 3 dias.</p>
                    ) : (
                        agedOrders.map(order => (
                            <div key={order.id} className="flex items-start justify-between border-b pb-3 last:border-0 hover:bg-orange-50/50 p-2 rounded transition-colors">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-800">#{order.order_number?.split('-').pop() || order.id.slice(0, 8)}</span>
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border">
                                            {translateStage(order.kanban_stage)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{order.customer_name}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 text-orange-600 font-bold">
                                        <AlertCircle className="h-3 w-3" />
                                        {order.daysStuck} dias
                                    </div>
                                    <p className="text-xs text-gray-400">parado nesta etapa</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function translateStage(stage?: string) {
    const map: Record<string, string> = {
        'waiting_confirmation': 'Aguardando',
        'photolith': 'Fotolito',
        'waiting_arrival': 'Chegada',
        'customization': 'Personalização',
        'delivery': 'Entrega',
        'returned': 'Devolvido'
    };
    return map[stage || ''] || stage || 'N/A';
}
