import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/lib/orders";
import { AlertCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DeadlineListProps {
    orders: Order[];
}

export function DeadlineList({ orders }: DeadlineListProps) {
    // Filter logic: Not finalized/delivered/cancelled/returned, diff > 3 days
    // This identifies potential bottlenecks
    const agedOrders = orders.filter(o => {
        // Exclude finalized, delivered, cancelled, returned AND waiting_confirmation (unapproved)
        const ignoredStages = ['finalized', 'delivered', 'cancelled', 'returned', 'completed', 'waiting_confirmation'];
        if (!o.kanban_stage || ignoredStages.includes(o.kanban_stage)) return false;

        const lastUpdate = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
        const diffAccess = new Date().getTime() - lastUpdate.getTime();
        const diffDays = diffAccess / (1000 * 3600 * 24);
        return diffDays > 6; // Highlight orders stuck for more than 6 days
    }).map(o => {
        const lastUpdate = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
        const diffAccess = new Date().getTime() - lastUpdate.getTime();
        const diffDays = Math.floor(diffAccess / (1000 * 3600 * 24));
        return { ...o, daysStuck: diffDays };
    }).sort((a, b) => b.daysStuck - a.daysStuck);

    return (
        <Card className="h-full flex flex-col shadow-sm border-orange-100">
            <CardHeader className="bg-orange-50/50 pb-3">
                <CardTitle className="flex items-center gap-2 text-orange-800 text-lg">
                    <Clock className="h-5 w-5" />
                    Pedidos Atrasados / Parados
                </CardTitle>
                <p className="text-xs text-orange-600 font-normal">Pedidos sem movimentação há mais de 6 dias</p>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
                <div className="overflow-y-auto max-h-[400px] p-4 space-y-3">
                    {agedOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-200 mb-2" />
                            <p>Tudo em dia! Nenhum pedido atrasado.</p>
                        </div>
                    ) : (
                        agedOrders.map(order => (
                            <div key={order.id} className="flex items-start justify-between border border-orange-100 bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow group">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800">#{order.order_number?.split('-').pop() || order.id.slice(0, 6)}</span>
                                        <span className="text-[10px] uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                                            {translateStage(order.kanban_stage)}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-700">{order.customer_name}</p>
                                    <p className="text-xs text-gray-500">Atualizado em: {new Date(order.updated_at || order.created_at).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center justify-end gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md mb-2">
                                        <AlertCircle className="h-3 w-3" />
                                        {order.daysStuck} dias
                                    </div>
                                    <Link href={`/admin/pedidos/${order.id}`}>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
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
        'finalized': 'Finalizado',
        'returned': 'Devolvido'
    };
    return map[stage || ''] || stage || 'N/A';
}

function CheckCircleIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
