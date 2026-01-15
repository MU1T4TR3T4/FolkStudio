import { supabase } from './supabase';
import { getCurrentUser } from './auth';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'new_order' | 'order_in_production' | 'order_ready' | 'new_message' | 'order_status_changed';
    link: string | null;
    is_read: boolean;
    created_at: string;
}

/**
 * Buscar notificações do usuário
 */
export async function getNotifications(userId?: string, limit: number = 20) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser && !userId) {
            return { success: false, error: 'Usuário não autenticado', data: [] };
        }

        const targetUserId = userId || currentUser!.id;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', targetUserId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Erro ao buscar notificações:', error);
            return { success: false, error: error.message, data: [] };
        }

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        return { success: false, error: 'Erro ao buscar notificações', data: [] };
    }
}

/**
 * Contar notificações não lidas
 */
export async function getUnreadCount(userId?: string) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser && !userId) {
            return { success: false, count: 0 };
        }

        const targetUserId = userId || currentUser!.id;

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', targetUserId)
            .eq('is_read', false);

        if (error) {
            console.error('Erro ao contar notificações:', error);
            return { success: false, count: 0 };
        }

        return { success: true, count: count || 0 };
    } catch (error) {
        console.error('Erro ao contar notificações:', error);
        return { success: false, count: 0 };
    }
}

/**
 * Marcar notificação como lida
 */
export async function markAsRead(notificationId: string) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) {
            console.error('Erro ao marcar notificação como lida:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return { success: false, error: 'Erro ao marcar notificação como lida' };
    }
}

/**
 * Marcar todas as notificações como lidas
 */
export async function markAllAsRead(userId?: string) {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser && !userId) {
            return { success: false, error: 'Usuário não autenticado' };
        }

        const targetUserId = userId || currentUser!.id;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', targetUserId)
            .eq('is_read', false);

        if (error) {
            console.error('Erro ao marcar todas como lidas:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao marcar todas como lidas:', error);
        return { success: false, error: 'Erro ao marcar todas como lidas' };
    }
}

/**
 * Criar notificação manualmente
 */
export async function createNotification(data: {
    user_id: string;
    title: string;
    message: string;
    type: Notification['type'];
    link?: string;
}) {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: data.user_id,
                title: data.title,
                message: data.message,
                type: data.type,
                link: data.link || null,
                is_read: false
            });

        if (error) {
            console.error('Erro ao criar notificação:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
        return { success: false, error: 'Erro ao criar notificação' };
    }
}

/**
 * Deletar notificação
 */
export async function deleteNotification(notificationId: string) {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) {
            console.error('Erro ao deletar notificação:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar notificação:', error);
        return { success: false, error: 'Erro ao deletar notificação' };
    }
}
