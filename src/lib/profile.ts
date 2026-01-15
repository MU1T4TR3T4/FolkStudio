import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import bcrypt from 'bcryptjs';

export interface ProfileData {
    full_name?: string;
    email?: string;
    phone?: string;
}

export interface VendorStatistics {
    totalOrders: number;
    ordersInProduction: number;
    ordersCompleted: number;
    totalClients: number;
    totalStamps: number;
    totalRevenue?: number;
}

/**
 * Upload de avatar do usuário
 */
export async function uploadAvatar(file: File, userId: string) {
    try {
        // Validar arquivo
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            return { success: false, error: 'Arquivo muito grande. Máximo 2MB.' };
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: 'Formato não suportado. Use JPG, PNG ou WEBP.' };
        }

        // Upload para Supabase Storage (usando bucket 'designs' com prefixo 'avatars/')
        const fileName = `avatars/${userId}-${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
            .from('designs')
            .upload(fileName, file, {
                upsert: true,
                contentType: file.type
            });

        if (uploadError) {
            console.error('Erro ao fazer upload:', uploadError);
            return { success: false, error: `Erro ao fazer upload: ${uploadError.message}` };
        }

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('designs')
            .getPublicUrl(fileName);

        // Atualizar URL no banco
        const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: publicUrl })
            .eq('id', userId);

        if (updateError) {
            console.error('Erro ao atualizar avatar:', updateError);
            return { success: false, error: 'Erro ao atualizar avatar' };
        }

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error('Erro ao fazer upload de avatar:', error);
        return { success: false, error: 'Erro ao fazer upload de avatar' };
    }
}

/**
 * Atualizar dados do perfil
 */
export async function updateProfile(userId: string, data: ProfileData) {
    try {
        const updateData: any = {};

        if (data.full_name) updateData.full_name = data.full_name;
        if (data.email) updateData.email = data.email;
        if (data.phone) updateData.phone = data.phone;

        const { error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId);

        if (error) {
            console.error('Erro ao atualizar perfil:', error);
            return { success: false, error: error.message };
        }

        // Atualizar localStorage se for o usuário atual
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const updatedUser = { ...currentUser, ...updateData };
            localStorage.setItem('folk_user', JSON.stringify(updatedUser));
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return { success: false, error: 'Erro ao atualizar perfil' };
    }
}

/**
 * Alterar senha do usuário
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
        // Buscar usuário
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('password_hash')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        // Verificar senha atual
        const isValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isValid) {
            return { success: false, error: 'Senha atual incorreta' };
        }

        // Validar nova senha
        if (newPassword.length < 8) {
            return { success: false, error: 'A nova senha deve ter no mínimo 8 caracteres' };
        }

        // Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Atualizar senha
        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: newPasswordHash })
            .eq('id', userId);

        if (updateError) {
            console.error('Erro ao alterar senha:', updateError);
            return { success: false, error: 'Erro ao alterar senha' };
        }

        return { success: true };
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        return { success: false, error: 'Erro ao alterar senha' };
    }
}

/**
 * Buscar estatísticas do vendedor
 */
export async function getVendorStatistics(vendorId: string): Promise<VendorStatistics> {
    try {
        // Buscar contagens em paralelo
        const [ordersResult, clientsResult, stampsResult] = await Promise.all([
            supabase.from('orders').select('id, status', { count: 'exact' }).eq('vendor_id', vendorId),
            supabase.from('clients').select('id', { count: 'exact', head: true }).eq('created_by_user_id', vendorId),
            supabase.from('stamps').select('id', { count: 'exact', head: true }).eq('created_by_user_id', vendorId),
        ]);

        const orders = ordersResult.data || [];
        const totalOrders = ordersResult.count || 0;
        const ordersInProduction = orders.filter(o => o.status === 'in_production' || o.status === 'confirmed').length;
        const ordersCompleted = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;

        return {
            totalOrders,
            ordersInProduction,
            ordersCompleted,
            totalClients: clientsResult.count || 0,
            totalStamps: stampsResult.count || 0,
        };
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        return {
            totalOrders: 0,
            ordersInProduction: 0,
            ordersCompleted: 0,
            totalClients: 0,
            totalStamps: 0,
        };
    }
}

/**
 * Buscar dados completos do perfil
 */
export async function getProfileData(userId: string) {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        // Buscar estatísticas se for vendedor
        let statistics: VendorStatistics | null = null;
        if (user.role === 'vendedor') {
            statistics = await getVendorStatistics(userId);
        }

        return {
            success: true,
            user,
            statistics
        };
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error);
        return { success: false, error: 'Erro ao buscar dados do perfil' };
    }
}
