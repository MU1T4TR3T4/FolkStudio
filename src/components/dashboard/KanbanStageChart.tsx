"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/lib/orders";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface KanbanStageChartProps {
    orders: Order[];
}

export function KanbanStageChart({ orders }: KanbanStageChartProps) {
    const stages = [
        { id: 'waiting_confirmation', label: 'Aguardando', color: '#94a3b8' },
        { id: 'photolith', label: 'Fotolito', color: '#3b82f6' },
        { id: 'waiting_arrival', label: 'Chegada', color: '#f59e0b' },
        { id: 'customization', label: 'Personalização', color: '#8b5cf6' },
        { id: 'delivery', label: 'Entrega', color: '#10b981' },
    ];

    const data = stages.map(stage => {
        return {
            name: stage.label,
            count: orders.filter(o => o.kanban_stage === stage.id).length,
            color: stage.color
        };
    });

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Volume por Etapa</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
