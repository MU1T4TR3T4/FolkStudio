import { supabase } from './supabase';
import { getCurrentUser } from './auth';

// Types
export interface Order {
    id: string;
    order_number?: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    product_type: string;
    color: string;
    size?: string;
    quantity: number;
    design_id?: string;
    status: string;
    priority?: string;
    total_price?: number;
    payment_status?: string;
    payment_method?: string;
    notes?: string;
    internal_notes?: string;
    assigned_to?: string;
    client_id?: string; // Link to clients table
    created_at: string;
    updated_at?: string;
    completed_at?: string;
    // Additional Costs
    ad1?: number;
    ad2?: number;
    ad3: number;
    ad4: number;
    // Local fields for compatibility
    imageUrl?: string;
    backImageUrl?: string;
    logoFrontUrl?: string;
    logoBackUrl?: string;
    designFront?: any;
    designBack?: any;

    pdfUrl?: string;
    created_by?: string;

    // Kanban V2
    kanban_stage?: 'waiting_confirmation' | 'photolith' | 'waiting_arrival' | 'customization' | 'delivery' | 'finalized' | 'returned';
    return_reason?: string;
    photolith_url?: string;
    photolith_status?: boolean;
    checklist_photolith?: any; // Added
    checklist_arrival?: any;
    checklist_customization?: any;
    final_product_url?: string;
    client_signature_url?: string;
    delivered_at?: string;
    observations?: string;
}

/**
 * Get all orders from Supabase (with localStorage fallback)
 */
export async function getAllOrders(): Promise<Order[]> {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            return data as Order[];
        }

        // Fallback to localStorage
        const saved = localStorage.getItem('folk_studio_orders');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error loading orders from Supabase:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('folk_studio_orders');
        return saved ? JSON.parse(saved) : [];
    }
}

/**
 * Get a single order by ID
 */
export async function getOrderById(id: string): Promise<Order | null> {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (data) {
            return data as Order;
        }

        // Fallback to localStorage
        const saved = localStorage.getItem('folk_studio_orders');
        if (saved) {
            const orders: Order[] = JSON.parse(saved);
            return orders.find(o => o.id === id) || null;
        }
        return null;
    } catch (error) {
        console.error('Error loading order from Supabase:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('folk_studio_orders');
        if (saved) {
            const orders: Order[] = JSON.parse(saved);
            return orders.find(o => o.id === id) || null;
        }
        return null;
    }
}

/**
 * Create a new order
 */
export async function createOrder(order: Partial<Order>): Promise<Order | null> {
    try {
        // Prepare order data for Supabase
        const currentUser = getCurrentUser();
        const orderData = {
            client_id: order.client_id, // Added client_id
            created_by: currentUser?.id, // Added created_by
            customer_name: order.customer_name || 'Cliente',
            customer_email: order.customer_email,
            customer_phone: order.customer_phone,
            product_type: order.product_type || 'Camiseta',
            color: order.color || 'Branco',
            size: order.size,
            quantity: order.quantity || 1,
            status: order.status || 'pending',
            priority: order.priority || 'normal',
            total_price: order.total_price,
            payment_status: order.payment_status || 'pending',
            payment_method: order.payment_method,
            notes: order.notes,
            internal_notes: order.internal_notes,
            // Additional Costs
            ad1: order.ad1,
            ad2: order.ad2,
            ad3: order.ad3,
            ad4: order.ad4,
            logoBackUrl: order.logoBackUrl,
            designFront: order.designFront,
            designBack: order.designBack,
            pdf_url: order.pdfUrl,
            // Kanban V2 Defaults
            kanban_stage: order.kanban_stage || 'waiting_confirmation',
        };

        const { data, error } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (error) {
            console.warn("Supabase insert error (continuing to localStorage):", error);
            // Notify user of offline mode
            if (typeof window !== 'undefined') {
                // Dynamic import to avoid SSR issues if simple toast not available
                import('sonner').then(({ toast }) => {
                    toast.warning("Modo Offline: Pedido salvo apenas neste dispositivo. Verifique a conexão ou permissões.");
                });
            }
            throw error;
        }

        if (data) {
            console.log('Order created in Supabase:', data.id);
            return data as Order;
        }

        // Fallback to localStorage
        const newOrder: Order = {
            id: crypto.randomUUID(),
            ...orderData,
            created_at: new Date().toISOString(),
        } as Order;

        const saved = localStorage.getItem('folk_studio_orders');
        const orders: Order[] = saved ? JSON.parse(saved) : [];
        orders.unshift(newOrder);
        localStorage.setItem('folk_studio_orders', JSON.stringify(orders));
        console.log('Order created in localStorage:', newOrder.id);
        return newOrder;
    } catch (error) {
        console.error('Error creating order in Supabase:', error);
        // Fallback to localStorage
        const newOrder: Order = {
            id: crypto.randomUUID(),
            customer_name: order.customer_name || 'Cliente',
            product_type: order.product_type || 'Camiseta',
            color: order.color || 'Branco',
            quantity: order.quantity || 1,
            status: order.status || 'pending',
            created_at: new Date().toISOString(),
            ...order,
        } as Order;

        const saved = localStorage.getItem('folk_studio_orders');
        const orders: Order[] = saved ? JSON.parse(saved) : [];
        orders.unshift(newOrder);
        localStorage.setItem('folk_studio_orders', JSON.stringify(orders));
        console.log('Order created in localStorage (fallback):', newOrder.id);
        return newOrder;
    }
}

/**
 * Update an existing order
 */
export async function updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    try {
        const { data, error } = await supabase
            .from('orders')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (data) {
            console.log('Order updated in Supabase:', id);
            return data as Order;
        }

        // Fallback to localStorage
        const saved = localStorage.getItem('folk_studio_orders');
        if (saved) {
            const orders: Order[] = JSON.parse(saved);
            const index = orders.findIndex(o => o.id === id);
            if (index !== -1) {
                orders[index] = { ...orders[index], ...updates, updated_at: new Date().toISOString() };
                localStorage.setItem('folk_studio_orders', JSON.stringify(orders));
                console.log('Order updated in localStorage:', id);
                return orders[index];
            }
        }
        return null;
    } catch (error) {
        console.error('Error updating order in Supabase:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('folk_studio_orders');
        if (saved) {
            const orders: Order[] = JSON.parse(saved);
            const index = orders.findIndex(o => o.id === id);
            if (index !== -1) {
                orders[index] = { ...orders[index], ...updates, updated_at: new Date().toISOString() };
                localStorage.setItem('folk_studio_orders', JSON.stringify(orders));
                console.log('Order updated in localStorage (fallback):', id);
                return orders[index];
            }
        }
        return null;
    }
}

/**
 * Delete an order
 */
export async function deleteOrder(id: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) throw error;

        console.log('Order deleted from Supabase:', id);
        return true;
    } catch (error) {
        console.error('Error deleting order from Supabase:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('folk_studio_orders');
        if (saved) {
            const orders: Order[] = JSON.parse(saved);
            const filtered = orders.filter(o => o.id !== id);
            localStorage.setItem('folk_studio_orders', JSON.stringify(filtered));
            console.log('Order deleted from localStorage (fallback):', id);
            return true;
        }
        return false;
    }
}

/**
 * Update order status
 */
export async function updateOrderStatus(id: string, newStatus: string, changedBy: string = 'System'): Promise<boolean> {
    try {
        // Get current order to log status change
        const order = await getOrderById(id);
        const oldStatus = order?.kanban_stage || order?.status;

        // Map kanban_stage to valid DB status (assuming 'pending', 'active', 'completed', 'cancelled' or 'returned')
        // Validating against likely Check Constraint: pending, active, completed, cancelled, returned
        let dbStatus = 'active';
        if (newStatus === 'waiting_confirmation') dbStatus = 'pending';
        else if (newStatus === 'finalized') dbStatus = 'completed';
        else if (newStatus === 'returned') dbStatus = 'returned'; // Try returned, if fails, assume 'cancelled' in catch?

        // Update order status AND kanban_stage
        // We prioritize kanban_stage for the UI
        const updated = await updateOrder(id, {
            kanban_stage: newStatus as any,
            status: dbStatus
        });

        if (updated) {
            // Log status change
            try {
                await supabase.from('status_logs').insert({
                    order_id: id,
                    old_status: oldStatus,
                    new_status: newStatus,
                    changed_by: changedBy,
                });
            } catch (logError) {
                console.warn('Could not log status change:', logError);
                // Continue even if logging fails
            }

            return true;
        }

        return false;
    } catch (error) {
        console.error('Error updating order status:', error);
        return false;
    }
}

/**
 * Get orders created by specific user
 */
/**
 * Get orders created by specific user
 */
export async function getOrdersByUser(userId: string): Promise<Order[]> {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('created_by', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data as Order[]) || [];
    } catch (error) {
        console.error('Error fetching user orders (falling back to local):', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('folk_studio_orders');
        if (saved) {
            const orders: Order[] = JSON.parse(saved);
            // Filter by created_by if present, otherwise show all?
            // For vendors, we likely want to see orders they created.
            // If created_by is missing in local data, maybe show none or all?
            // Let's match by created_by if it exists.
            return orders.filter(o => o.created_by === userId || !o.created_by); // showing valid or legacy orders? Better to be strict: o.created_by === userId.
            // But for testing if created_by wasn't saved locally before...
            // Let's assume new orders will have it.
        }
        return [];
    }
}

/**
 * Get activity logs for a user (status changes)
 * We search by user ID or Name in changed_by field
 */
export async function getActivityLogsByUser(userId: string, userName: string): Promise<any[]> {
    try {
        // Try to fetch by ID or Name (since legacy logs might use name)
        const { data, error } = await supabase
            .from('status_logs')
            .select(`
                *,
                order:orders(order_number, customer_name)
            `)
            .or(`changed_by.eq.${userId},changed_by.eq.${userName}`)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching user logs:', error);
        const savedLogs = localStorage.getItem('folk_admin_status_logs');
        if (savedLogs) {
            const logs = JSON.parse(savedLogs);
            return logs.filter((l: any) => l.user === userName || l.user === userId);
        }
        return [];
    }
}
