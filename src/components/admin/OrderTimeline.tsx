interface TimelineEvent {
    id: string;
    type: "created" | "status_change" | "comment" | "file_upload";
    title: string;
    description: string;
    timestamp: string;
    user?: string;
}

interface OrderTimelineProps {
    events: TimelineEvent[];
}

export default function OrderTimeline({ events }: OrderTimelineProps) {
    const getIconColor = (type: string) => {
        const colors = {
            created: "bg-blue-100 text-blue-600",
            status_change: "bg-yellow-100 text-yellow-600",
            comment: "bg-purple-100 text-purple-600",
            file_upload: "bg-green-100 text-green-600"
        };
        return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-600";
    };

    return (
        <div className="space-y-4">
            {events.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                    {/* Linha vertical */}
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full ${getIconColor(event.type)} flex items-center justify-center`}>
                            <div className="w-2 h-2 bg-current rounded-full" />
                        </div>
                        {index < events.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2" />
                        )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 pb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{event.title}</h4>
                                <span className="text-xs text-gray-500">
                                    {new Date(event.timestamp).toLocaleString("pt-BR")}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">{event.description}</p>
                            {event.user && (
                                <p className="text-xs text-gray-400 mt-2">Por: {event.user}</p>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
