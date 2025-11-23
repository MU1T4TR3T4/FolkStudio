import { BarChart3, Clock, Users, CheckCircle } from "lucide-react";

interface ProductionStatsProps {
    stats: {
        producedToday: number;
        pendingTotal: number;
        avgProductionTime: string;
        topProducer: string;
    };
    dailyProduction: { date: string; count: number }[];
}

export default function ProductionStats({ stats, dailyProduction }: ProductionStatsProps) {
    return (
        <div className="space-y-6">
            {/* Cards de Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            Hoje
                        </span>
                    </div>
                    <p className="text-sm text-gray-600">Produzidos Hoje</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.producedToday}</h3>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">Total Pendente</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingTotal}</h3>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">Tempo Médio</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.avgProductionTime}</h3>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">Top Produtor</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.topProducer}</h3>
                </div>
            </div>

            {/* Gráfico Simples de Produção Diária */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Produção nos Últimos 7 Dias</h3>
                <div className="flex items-end justify-between h-48 gap-2">
                    {dailyProduction.map((day, index) => (
                        <div key={index} className="flex flex-col items-center gap-2 flex-1">
                            <div
                                className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                                style={{ height: `${Math.max(day.count * 10, 4)}px`, minHeight: '4px' }}
                            />
                            <span className="text-xs text-gray-500 font-medium">{day.date}</span>
                            <span className="text-xs font-bold text-gray-900">{day.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
