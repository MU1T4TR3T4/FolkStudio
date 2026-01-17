import { supabase } from "@/lib/supabase";
import { User, getAllUsers } from "@/lib/auth";
import { Order, getAllOrders } from "@/lib/orders";
import { getClients, Client } from "@/lib/clients";

export interface ActivityItem {
    id: string;
    type: 'order_status' | 'client_created' | 'design_created' | 'stamp_created' | 'order_created';
    description: string;
    timestamp: string;
    userId: string;
}

export interface UserAnalytics {
    userId: string;
    userName: string;
    role: string;
    email: string;
    totalActivities: number;
    lastActive: string | null;
    isOnline: boolean;
    activities: ActivityItem[];
    userObj: User;
}

export async function getAdminDashboardAnalytics() {
    // 1. Fetch Key Data Sources
    const [users, orders, clients] = await Promise.all([
        getAllUsers(),
        getAllOrders(),
        getClients()
    ]);

    // 2. Fetch Designs and Stamps (using Supabase directly as we don't have getAll helper exposed always)
    const { data: designs } = await supabase.from('designs').select('id, created_at, user_id, product_type');
    const { data: stamps } = await supabase.from('stamps').select('id, created_at, user_id, name');

    // 3. Fetch Status Logs (for "moved stage" activities)
    const { data: logs } = await supabase
        .from('status_logs')
        .select('*')
        .order('created_at', { ascending: false });

    // 4. Activity Aggregation Per User
    const userAnalytics: UserAnalytics[] = users.map(user => {
        let activities: ActivityItem[] = [];

        // A. Orders Created
        const myOrders = orders.filter(o => o.created_by === user.id);
        myOrders.forEach(o => activities.push({
            id: `order-create-${o.id}`,
            type: 'order_created',
            description: `Criou o pedido #${o.order_number?.split('-').pop() || o.id.slice(0, 6)}`,
            timestamp: o.created_at,
            userId: user.id
        }));

        // B. Clients Created
        // Note: Clients table 'user_id' is prioritized
        const myClients = clients.filter(c => c.user_id === user.id);
        myClients.forEach(c => activities.push({
            id: `client-create-${c.id}`,
            type: 'client_created',
            description: `Cadastrou o cliente ${c.name}`,
            timestamp: c.created_at || new Date().toISOString(),
            userId: user.id
        }));

        // C. Designs Created
        const myDesigns = designs?.filter(d => d.user_id === user.id) || [];
        myDesigns.forEach(d => activities.push({
            id: `design-create-${d.id}`,
            type: 'design_created',
            description: `Criou design de ${d.product_type}`,
            timestamp: d.created_at,
            userId: user.id
        }));

        // D. Stamps Created
        const myStamps = stamps?.filter(s => s.user_id === user.id) || [];
        myStamps.forEach(s => activities.push({
            id: `stamp-create-${s.id}`,
            type: 'stamp_created',
            description: `Criou modelo "${s.name}"`,
            timestamp: s.created_at,
            userId: user.id
        }));

        // E. Status Changes (Checklist completion proxy)
        // If changed_by matches user ID or Name
        const myLogs = logs?.filter(l => l.changed_by === user.id || l.changed_by === user.full_name) || [];
        myLogs.forEach(l => {
            // Fetch order details for description if possible, currently we might just have ID
            // Optimally we map order ID to number from 'orders' array
            const relatedOrder = orders.find(o => o.id === l.order_id);
            const orderNum = relatedOrder ? (relatedOrder.order_number?.split('-').pop() || relatedOrder.id.slice(0, 6)) : '???';

            activities.push({
                id: `log-${l.id}`,
                type: 'order_status',
                description: `Moveu pedido #${orderNum} para ${translateStage(l.new_status)}`,
                timestamp: l.created_at,
                userId: user.id
            });
        });

        // Sort activities desc
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Calculate Last Active
        const lastActive = activities.length > 0 ? activities[0].timestamp : null;

        // Calculate Online Status (Active < 20 mins ago)
        let isOnline = false;
        if (lastActive) {
            const diff = new Date().getTime() - new Date(lastActive).getTime();
            isOnline = diff < 20 * 60 * 1000; // 20 minutes
        }

        return {
            userId: user.id,
            userName: user.full_name,
            role: user.role,
            email: user.email,
            totalActivities: activities.length,
            lastActive,
            isOnline,
            activities,
            userObj: user
        };
    });

    return {
        users: userAnalytics,
        rawOrders: orders,
        rawClients: clients
    };
}

function translateStage(stage?: string) {
    const map: Record<string, string> = {
        'waiting_confirmation': 'Aguardando',
        'photolith': 'Fotolito',
        'waiting_arrival': 'Chegada',
        'customization': 'Personalização',
        'delivery': 'Entrega',
        'finalized': 'Finalizado',
        'returned': 'Devolvido',
        'pending': 'Pendente',
        'active': 'Ativo',
        'completed': 'Concluído'
    };
    return map[stage || ''] || stage || 'N/A';
}
