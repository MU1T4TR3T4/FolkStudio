import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, Clock, AlertCircle, CheckCircle, Package, TrendingUp } from "lucide-react";
import { Order } from "@/lib/orders";

interface StatsCardsProps {
    orders: Order[];
}

export function StatsCards({ orders }: StatsCardsProps) {
    // 1. Total Active (not delivered/finalized/cancelled)
    const activeOrders = orders.filter(o =>
        !['delivered', 'finalized', 'cancelled'].includes(o.kanban_stage || '') &&
        o.kanban_stage !== 'returned'
    );

    // 2. Completed Today (moved to finalized/delivered today)
    // Note: This approximates by checking updated_at if stage is finalized
    const today = new Date().toDateString();
    const completedToday = orders.filter(o =>
        ['finalized', 'delivered'].includes(o.kanban_stage || '') &&
        o.updated_at && new Date(o.updated_at).toDateString() === today
    ).length;

    // 3. Late Orders (> 3 days in current stage)
    const lateOrders = orders.filter(o => {
        if (!o.kanban_stage || ['finalized', 'delivered', 'cancelled'].includes(o.kanban_stage)) return false;
        const lastUpdate = o.updated_at ? new Date(o.updated_at) : new Date(o.created_at);
        const diffDays = (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);
        return diffDays > 3;
    }).length;

    // 4. Returned Orders (Action Required)
    const returnedOrders = orders.filter(o => o.kanban_stage === 'returned').length;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos Ativos</CardTitle>
                    <Package className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{activeOrders.length}</div>
                    <p className="text-xs text-muted-foreground">Em produção no momento</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Atrasados (+3 dias)</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{lateOrders}</div>
                    <p className="text-xs text-muted-foreground">Gargalos potenciais</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Devoluções / Erros</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{returnedOrders}</div>
                    <p className="text-xs text-muted-foreground">Requer atenção imediata</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Finalizados Hoje</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{completedToday}</div>
                    <p className="text-xs text-muted-foreground">Produtividade diária</p>
                </CardContent>
            </Card>
        </div>
    );
}
