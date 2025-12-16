import { supabase } from './supabase';

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
    created_at: string;
    updated_at?: string;
    completed_at?: string;
    // Local fields for compatibility
    imageUrl?: string;
    backImageUrl?: string;
    logoFrontUrl?: string;
    logoBackUrl?: string;
    designFront?: any;
    designBack?: any;
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
        const orderData = {
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
        };

        const { data, error } = await supabase
            .from('orders')
            .insert(orderData)
            .select()
            .single();

        if (error) throw error;

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
        const oldStatus = order?.status;

        // Update order status
        const updated = await updateOrder(id, { status: newStatus });

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
