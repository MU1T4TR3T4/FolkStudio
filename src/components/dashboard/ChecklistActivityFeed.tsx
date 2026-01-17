import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/lib/orders";
import { CheckCircle2, User, Clock } from "lucide-react";

interface ChecklistActivityFeedProps {
    orders: Order[];
    limit?: number;
}

export function ChecklistActivityFeed({ orders, limit = 10 }: ChecklistActivityFeedProps) {
    // Extract actions
    const actions: any[] = [];

    orders.forEach(order => {
        const orderId = order.order_number || order.id.slice(0, 8);

        // 1. Photolith Checklist
        if (order.checklist_photolith && order.checklist_photolith.checked_at) {
            actions.push({
                id: `${order.id}-photo`,
                type: 'checklist',
                checklist: 'Fotolito',
                user: order.checklist_photolith.checked_by || 'Sistema',
                at: new Date(order.checklist_photolith.checked_at),
                orderStr: orderId
            });
        }

        // 2. Arrival Checklist
        if (order.checklist_arrival && order.checklist_arrival.checked_at) {
            actions.push({
                id: `${order.id}-arrival`,
                type: 'checklist',
                checklist: 'Chegada',
                user: order.checklist_arrival.checked_by || 'Sistema',
                at: new Date(order.checklist_arrival.checked_at),
                orderStr: orderId
            });
        }

        // 3. Customization Checklist
        if (order.checklist_customization && order.checklist_customization.checked_at) {
            actions.push({
                id: `${order.id}-cust`,
                type: 'checklist',
                checklist: 'Personalização',
                user: order.checklist_customization.checked_by || 'Sistema',
                at: new Date(order.checklist_customization.checked_at),
                orderStr: orderId
            });
        }
    });

    // Sort by date desc
    const sortedActions = actions.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle className="text-sm font-medium">Últimas Atividades de Checklist</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {sortedActions.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center">Nenhuma atividade recente encontrada.</p>
                    ) : (
                        sortedActions.map((action, i) => (
                            <div key={i} className="flex gap-4 relative">
                                <span className="absolute left-0 top-2 w-[1px] h-full bg-gray-200 ml-[11px]" />
                                <div className="z-10 bg-green-50 rounded-full p-1 h-6 w-6 flex items-center justify-center shrink-0 border border-green-200">
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                </div>
                                <div className="space-y-1 pb-2">
                                    <p className="text-sm font-medium leading-none">
                                        Checklist de <span className="text-blue-600">{action.checklist}</span> concluído
                                    </p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                                        <span className="font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <User className="h-3 w-3" /> {action.user}
                                        </span>
                                        <span>•</span>
                                        <span>Pedido #{action.orderStr}</span>
                                    </p>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {action.at.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
