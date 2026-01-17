import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/lib/orders";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProductionReportProps {
    orders: Order[];
}

export function ProductionReport({ orders }: ProductionReportProps) {
    // Aggregate by user
    const userStats: Record<string, { name: string, photolith: number, arrival: number, customization: number, total: number }> = {};

    orders.forEach(order => {
        // Helper
        const count = (check: any, type: 'photolith' | 'arrival' | 'customization') => {
            if (check && check.checked_by) {
                const name = check.checked_by;
                if (!userStats[name]) userStats[name] = { name, photolith: 0, arrival: 0, customization: 0, total: 0 };
                userStats[name][type]++;
                userStats[name].total++;
            }
        };

        count(order.checklist_photolith, 'photolith');
        count(order.checklist_arrival, 'arrival');
        count(order.checklist_customization, 'customization');
    });

    const sortedUsers = Object.values(userStats).sort((a, b) => b.total - a.total);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Produtividade da Equipe (Conclusão de Checklists)</CardTitle>
            </CardHeader>
            <CardContent>
                {sortedUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Sem dados de produtividade ainda.
                    </div>
                ) : (
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Colaborador</th>
                                    <th className="px-6 py-3 text-center">Fotolito</th>
                                    <th className="px-6 py-3 text-center">Chegada</th>
                                    <th className="px-6 py-3 text-center">Personalização</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedUsers.map((user) => (
                                    <tr key={user.name} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-3">
                                            <Avatar className="h-8 w-8">

                                                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600">{user.photolith}</td>
                                        <td className="px-6 py-4 text-center text-gray-600">{user.arrival}</td>
                                        <td className="px-6 py-4 text-center text-gray-600">{user.customization}</td>
                                        <td className="px-6 py-4 text-right font-bold text-blue-600">{user.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
