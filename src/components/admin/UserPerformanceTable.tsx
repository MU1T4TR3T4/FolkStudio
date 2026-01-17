import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Activity, Zap } from "lucide-react";
import { User } from "@/lib/auth";
import { UserActivityModal, ActivityLogItem } from "./UserActivityModal";

interface UserStat {
    userId: string;
    userName: string;
    role: string;
    email?: string;
    totalActivityCount: number;
    lastActive: string | null;
    isOnline: boolean;
    // Data for modal
    userObj?: User;
    recentActivities?: ActivityLogItem[];
}

interface UserPerformanceTableProps {
    users: UserStat[];
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

export function UserPerformanceTable({ users }: UserPerformanceTableProps) {
    const sortedUsers = [...users].sort((a, b) => b.totalActivityCount - a.totalActivityCount);
    const [selectedUser, setSelectedUser] = useState<UserStat | null>(null);

    return (
        <>
            <Card className="h-full shadow-sm">
                <CardHeader className="border-b bg-gray-50/50 pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Produtividade da Equipe
                            </CardTitle>
                            <p className="text-sm text-gray-500">Ranking por atividades realizadas</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[200px]">Membro</TableHead>
                                <TableHead className="text-center">Atividades</TableHead>
                                <TableHead className="text-right">Última Ação</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedUsers.map((user, index) => (
                                <TableRow
                                    key={user.userId}
                                    className="cursor-pointer hover:bg-gray-50"
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            {user.userObj?.avatar_url ? (
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                                                        <img
                                                            src={user.userObj.avatar_url}
                                                            alt={user.userName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className={`
                                                        absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white shadow-sm ring-2 ring-white
                                                        ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                                                index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-blue-500'}
                                                    `}>
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`
                                                    flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white shadow-sm relative
                                                    ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                                                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-blue-100 text-blue-600'}
                                                `}>
                                                    {user.userObj?.full_name ? (
                                                        <span>
                                                            {user.userObj.full_name.split(' ').map((n, i) => i < 2 ? n[0] : '').join('').toUpperCase()}
                                                        </span>
                                                    ) : (
                                                        <span>{index + 1}</span>
                                                    )}

                                                    <div className={`
                                                        absolute -bottom-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white shadow-sm ring-2 ring-white bg-gray-900/50
                                                    `}>
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {user.userName}
                                                </p>
                                                <p className="text-[10px] text-gray-500 uppercase font-medium">{user.role}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                            {user.totalActivityCount}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-xs text-gray-500">
                                            {user.lastActive
                                                ? formatTimeAgo(user.lastActive)
                                                : "-"
                                            }
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${user.isOnline ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                                            {user.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sortedUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                        Nenhuma atividade registrada.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <UserActivityModal
                isOpen={!!selectedUser}
                onClose={() => setSelectedUser(null)}
                user={selectedUser?.userObj || null}
                stats={{
                    totalActivities: selectedUser?.totalActivityCount || 0,
                    lastActive: selectedUser?.lastActive || null
                }}
                recentActivities={selectedUser?.recentActivities || []}
            />
        </>
    );
}
