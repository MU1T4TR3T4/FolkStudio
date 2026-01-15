import { supabase } from './supabase';
import { getCurrentUser } from './auth';

/**
 * Verifica se o usuário pode acessar um recurso
 * Admin pode acessar tudo, vendedor só pode acessar seus próprios recursos
 */
export function canAccessResource(
    userId: string,
    resourceOwnerId: string | null,
    userRole: string
): boolean {
    if (userRole === 'admin') return true;
    if (!resourceOwnerId) return false; // Recursos sem dono não são acessíveis
    return userId === resourceOwnerId;
}

/**
 * Buscar estampas do vendedor
 */
export async function getVendorStamps(vendorId?: string) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Usuário não autenticado', data: [] };
        }

        let query = supabase
            .from('stamps')
            .select('*')
            .order('created_at', { ascending: false });

        // Se for vendedor, filtrar apenas suas estampas
        if (currentUser.role === 'vendedor') {
            query = query.eq('created_by_user_id', currentUser.id);
        }
        // Se for admin e vendorId foi especificado, filtrar por esse vendedor
        else if (currentUser.role === 'admin' && vendorId) {
            query = query.eq('created_by_user_id', vendorId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar estampas:', error);
            return { success: false, error: error.message, data: [] };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Erro ao buscar estampas:', error);
        return { success: false, error: 'Erro ao buscar estampas', data: [] };
    }
}

/**
 * Buscar clientes do vendedor
 */
export async function getVendorClients(vendorId?: string) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Usuário não autenticado', data: [] };
        }

        let query = supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        // Se for vendedor, filtrar apenas seus clientes
        if (currentUser.role === 'vendedor') {
            query = query.eq('created_by_user_id', currentUser.id);
        }
        // Se for admin e vendorId foi especificado, filtrar por esse vendedor
        else if (currentUser.role === 'admin' && vendorId) {
            query = query.eq('created_by_user_id', vendorId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar clientes:', error);
            return { success: false, error: error.message, data: [] };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        return { success: false, error: 'Erro ao buscar clientes', data: [] };
    }
}

/**
 * Buscar pedidos do vendedor
 */
export async function getVendorOrders(vendorId?: string) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Usuário não autenticado', data: [] };
        }

        let query = supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        // Se for vendedor, filtrar apenas seus pedidos
        if (currentUser.role === 'vendedor') {
            query = query.eq('vendor_id', currentUser.id);
        }
        // Se for admin e vendorId foi especificado, filtrar por esse vendedor
        else if (currentUser.role === 'admin' && vendorId) {
            query = query.eq('vendor_id', vendorId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar pedidos:', error);
            return { success: false, error: error.message, data: [] };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return { success: false, error: 'Erro ao buscar pedidos', data: [] };
    }
}

/**
 * Buscar designs do vendedor
 */
export async function getVendorDesigns(vendorId?: string) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Usuário não autenticado', data: [] };
        }

        let query = supabase
            .from('designs')
            .select('*')
            .order('created_at', { ascending: false });

        // Se for vendedor, filtrar apenas seus designs
        if (currentUser.role === 'vendedor') {
            query = query.eq('created_by_user_id', currentUser.id);
        }
        // Se for admin e vendorId foi especificado, filtrar por esse vendedor
        else if (currentUser.role === 'admin' && vendorId) {
            query = query.eq('created_by_user_id', vendorId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar designs:', error);
            return { success: false, error: error.message, data: [] };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Erro ao buscar designs:', error);
        return { success: false, error: 'Erro ao buscar designs', data: [] };
    }
}

/**
 * Buscar estatísticas do vendedor
 */
export async function getVendorStats(vendorId: string) {
    try {
        // Buscar contagens em paralelo
        const [stampsResult, clientsResult, ordersResult, designsResult] = await Promise.all([
            supabase.from('stamps').select('id', { count: 'exact', head: true }).eq('created_by_user_id', vendorId),
            supabase.from('clients').select('id', { count: 'exact', head: true }).eq('created_by_user_id', vendorId),
            supabase.from('orders').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
            supabase.from('designs').select('id', { count: 'exact', head: true }).eq('created_by_user_id', vendorId),
        ]);

        return {
            success: true,
            stats: {
                totalStamps: stampsResult.count || 0,
                totalClients: clientsResult.count || 0,
                totalOrders: ordersResult.count || 0,
                totalDesigns: designsResult.count || 0,
            }
        };
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return {
            success: false,
            error: 'Erro ao buscar estatísticas',
            stats: {
                totalStamps: 0,
                totalClients: 0,
                totalOrders: 0,
                totalDesigns: 0,
            }
        };
    }
}

/**
 * Buscar dados completos do vendedor
 */
export async function getVendorData(vendorId: string) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        // Apenas admin pode buscar dados de outros vendedores
        if (currentUser.role !== 'admin' && currentUser.id !== vendorId) {
            return { success: false, error: 'Sem permissão para acessar estes dados' };
        }

        // Buscar informações do vendedor
        const { data: vendor, error: vendorError } = await supabase
            .from('users')
            .select('*')
            .eq('id', vendorId)
            .single();

        if (vendorError || !vendor) {
            return { success: false, error: 'Vendedor não encontrado' };
        }

        // Buscar estatísticas
        const statsResult = await getVendorStats(vendorId);

        // Buscar dados recentes
        const [stamps, clients, orders, designs] = await Promise.all([
            getVendorStamps(vendorId),
            getVendorClients(vendorId),
            getVendorOrders(vendorId),
            getVendorDesigns(vendorId),
        ]);

        return {
            success: true,
            vendor,
            stats: statsResult.stats,
            stamps: stamps.data || [],
            clients: clients.data || [],
            orders: orders.data || [],
            designs: designs.data || [],
        };
    } catch (error) {
        console.error('Erro ao buscar dados do vendedor:', error);
        return { success: false, error: 'Erro ao buscar dados do vendedor' };
    }
}
