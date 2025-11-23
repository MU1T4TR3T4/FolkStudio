"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface OrdersLineChartProps {
    data: Array<{
        date: string;
        orders: number;
    }>;
}

export default function OrdersLineChart({ data }: OrdersLineChartProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pedidos por Dia (Último Mês)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="orders"
                        stroke="#7D4CDB"
                        strokeWidth={2}
                        name="Pedidos"
                        dot={{ fill: '#7D4CDB', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
