"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TopItemsBarChartProps {
    data: Array<{
        name: string;
        count: number;
    }>;
    title: string;
    dataKey?: string;
}

export default function TopItemsBarChart({ data, title, dataKey = "count" }: TopItemsBarChartProps) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="name"
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
                    <Bar
                        dataKey={dataKey}
                        fill="#7D4CDB"
                        name="Quantidade"
                        radius={[8, 8, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
