"use client";

import { Package, Clock, CheckCircle, Archive, ListTodo, FileText } from "lucide-react";
import KanbanColumn from "@/components/admin/KanbanColumn";
import OrderCard from "@/components/admin/OrderCard";

interface KanbanBoardProps {
    orders: any[];
    onOrderClick: (order: any) => void;
}

export function KanbanBoard({ orders, onOrderClick }: KanbanBoardProps) {
    const getOrdersByStatus = (status: string) => {
        return orders.filter(order => (order.kanban_stage || "waiting_confirmation") === status);
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)]">
            <KanbanColumn
                title="Devolvidos"
                count={getOrdersByStatus("returned").length}
                icon={Archive}
                color="red"
            >
                {getOrdersByStatus("returned").map(order => (
                    <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order)} />
                ))}
            </KanbanColumn>

            <KanbanColumn
                title="1. Aguardando Confirmação"
                count={getOrdersByStatus("waiting_confirmation").length}
                icon={Clock}
                color="blue"
            >
                {getOrdersByStatus("waiting_confirmation").map(order => (
                    <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order)} />
                ))}
            </KanbanColumn>

            <KanbanColumn
                title="2. Encomenda + Fotolito"
                count={getOrdersByStatus("photolith").length}
                icon={FileText}
                color="yellow"
            >
                {getOrdersByStatus("photolith").map(order => (
                    <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order)} />
                ))}
            </KanbanColumn>

            <KanbanColumn
                title="3. Aguardando Chegada"
                count={getOrdersByStatus("waiting_arrival").length}
                icon={Package}
                color="orange"
            >
                {getOrdersByStatus("waiting_arrival").map(order => (
                    <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order)} />
                ))}
            </KanbanColumn>

            <KanbanColumn
                title="4. Personalização"
                count={getOrdersByStatus("customization").length}
                icon={ListTodo}
                color="purple"
            >
                {getOrdersByStatus("customization").map(order => (
                    <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order)} />
                ))}
            </KanbanColumn>

            <KanbanColumn
                title="5. Entrega"
                count={getOrdersByStatus("delivery").length}
                icon={Archive}
                color="green"
            >
                {getOrdersByStatus("delivery").map(order => (
                    <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order)} />
                ))}
            </KanbanColumn>

            <KanbanColumn
                title="Finalizados"
                count={getOrdersByStatus("finalized").length}
                icon={CheckCircle}
                color="gray"
            >
                {getOrdersByStatus("finalized").map(order => (
                    <OrderCard key={order.id} order={order} onClick={() => onOrderClick(order)} />
                ))}
            </KanbanColumn>
        </div>
    );
}
