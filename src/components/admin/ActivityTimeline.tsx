"use client";

import { Clock } from "lucide-react";

interface Activity {
    id: string;
    type: 'status_change' | 'new_order' | 'order_completed';
    message: string;
    timestamp: string;
    user?: string;
}

interface ActivityTimelineProps {
    activities: Activity[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
    const getRelativeTime = (timestamp: string) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Agora mesmo';
        if (diffInSeconds < 3600) return `Há ${Math.floor(diffInSeconds / 60)} minutos`;
        if (diffInSeconds < 86400) return `Há ${Math.floor(diffInSeconds / 3600)} horas`;
        return `Há ${Math.floor(diffInSeconds / 86400)} dias`;
    };

    const getActivityIcon = (type: Activity['type']) => {
        switch (type) {
            case 'status_change':
                return '🔄';
            case 'new_order':
                return '📦';
            case 'order_completed':
                return '✅';
            default:
                return '📝';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
            </div>

            <div className="space-y-4">
                {activities.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Nenhuma atividade recente</p>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                            <div className="flex-shrink-0 text-2xl">
                                {getActivityIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{activity.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {getRelativeTime(activity.timestamp)}
                                    {activity.user && ` • ${activity.user}`}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
