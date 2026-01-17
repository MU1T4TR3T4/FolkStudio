import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { User } from "@/lib/auth";
import { CheckCircle, Paintbrush, UserPlus, Clock, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ActivityLogItem {
    id: string;
    type: 'order_status' | 'client_created' | 'design_created' | 'stamp_created' | 'order_created';
    description: string;
    timestamp: string;
    targetId?: string; // ID of the order/client/design
}

interface UserActivityModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    recentActivities: ActivityLogItem[];
    stats: {
        totalActivities: number;
        lastActive: string | null;
    };
}

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "agora mesmo";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `há ${diffInHours} horas`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `há ${diffInDays} dias`;
    return date.toLocaleDateString('pt-BR');
}

export function UserActivityModal({ user, isOpen, onClose, recentActivities, stats }: UserActivityModalProps) {
    if (!user) return null;

    function getActivityIcon(type: ActivityLogItem['type']) {
        switch (type) {
            case 'order_status': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'client_created': return <UserPlus className="h-4 w-4 text-blue-500" />;
            case 'design_created':
            case 'stamp_created': return <Paintbrush className="h-4 w-4 text-purple-500" />;
            case 'order_created': return <Clock className="h-4 w-4 text-orange-500" />;
            default: return <Clock className="h-4 w-4 text-gray-500" />;
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                                <img
                                    src={user.avatar_url}
                                    alt={user.full_name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {user.full_name?.charAt(0) || user.email?.charAt(0) || "U"}
                            </div>
                        )}
                        <div>
                            <DialogTitle className="text-xl">{user.full_name}</DialogTitle>
                            <DialogDescription className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                                {user.role} | {user.email}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 my-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                        <p className="text-xs text-gray-500 mb-1">Total de Atividades</p>
                        <p className="text-2xl font-bold text-gray-800">{stats.totalActivities}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
                        <p className="text-xs text-gray-500 mb-1">Última Atividade</p>
                        <p className="text-sm font-semibold text-gray-800">
                            {stats.lastActive
                                ? formatTimeAgo(stats.lastActive)
                                : "N/A"
                            }
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Histórico Recente
                    </h3>
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                            {recentActivities.length === 0 ? (
                                <p className="text-sm text-center text-gray-400 py-8">Nenhuma atividade recente registrada.</p>
                            ) : (
                                recentActivities.map((activity) => (
                                    <div key={activity.id} className="relative pl-6 pb-2 border-l border-gray-200 last:border-0">
                                        <div className="absolute left-[-5px] top-1 bg-white">
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-800">{activity.description}</p>
                                            <p className="text-xs text-gray-500">
                                                {formatTimeAgo(activity.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
