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
        // 1. Fetch from Supabase
        const [ordersResult, clientsResult, stampsResult] = await Promise.all([
            // Orders use 'created_by'
            supabase.from('orders').select('id, status, kanban_stage, created_by', { count: 'exact' }).eq('created_by', vendorId),
            // Clients use 'user_id'
            supabase.from('clients').select('id, user_id', { count: 'exact', head: true }).eq('user_id', vendorId),
            // Stamps use 'user_id'
            supabase.from('stamps').select('id, user_id', { count: 'exact', head: true }).eq('user_id', vendorId),
        ]);

        const dbOrders = ordersResult.data || [];
        const dbClientCount = clientsResult.count || 0;
        const dbStampCount = stampsResult.count || 0;

        // 2. Fetch from LocalStorage (for offline data)
        let localOrders: any[] = [];
        let localClients: any[] = [];
        let localStamps: any[] = [];

        if (typeof window !== 'undefined') {
            try {
                const savedOrders = localStorage.getItem('folk_studio_orders');
                if (savedOrders) localOrders = JSON.parse(savedOrders);

                const savedClients = localStorage.getItem('folk_studio_clients');
                if (savedClients) localClients = JSON.parse(savedClients);

                // Stamps usually don't have a direct 'folk_studio_stamps' key in this context unless explicitly saved
                // but checking just in case or skipping if deemed server-only.
                // Assuming clients might be local-only.
            } catch (e) {
                console.error("Error reading localStorage stats:", e);
            }
        }

        // 3. Merge/Deduplicate Orders
        // We filter local orders by created_by == vendorId (if field exists logic)
        // And ensure we don't double count if ID exists in DB (though usually local ID is UUID too)
        // Simple approach: Set of IDs
        const allOrderIds = new Set(dbOrders.map(o => o.id));
        const combinedOrders = [...dbOrders];

        localOrders.forEach(o => {
            // Check if belongs to vendor (or if created_by is missing, maybe assume yes if it's their local machine?)
            // Safest: check created_by matching.
            if ((o.created_by === vendorId) && !allOrderIds.has(o.id)) {
                combinedOrders.push(o);
                allOrderIds.add(o.id);
            }
        });

        const totalOrders = combinedOrders.length;

        // Calculate status based on combined data
        const ordersInProduction = combinedOrders.filter(o => {
            const s = o.status?.toLowerCase();
            const k = o.kanban_stage?.toLowerCase();
            return s === 'active' || (k && ['photolith', 'waiting_arrival', 'customization', 'delivery'].includes(k));
        }).length;

        const ordersCompleted = combinedOrders.filter(o => {
            const s = o.status?.toLowerCase();
            const k = o.kanban_stage?.toLowerCase();
            return s === 'completed' || s === 'delivered' || k === 'finalized';
        }).length;


        // 4. Merge/Deduplicate Clients
        // Since we only got count from DB for clients, we can't dedup by ID easily without fetching all IDs.
        // Optimization: Fetch IDs from DB instead of just count if list is small, or just add local count?
        // Let's assume offline clients have unique IDs not in DB yet (failed sync).
        // But if they are synced, they are in DB.
        // Ideally we fetch IDs. 'clientsResult' above was just count/head. Let's change strictly for Clients to fetch IDs to dedup.

        // Refetching clients IDs for accurate count if we suspect overlap
        // Or simpler: Just count local clients that have user_id == vendorId.
        // Risk: Double counting if local copy remains after sync.
        // Better approach: Since 'getClients' does a robust merge, let's trust that logic or replicate it simply.
        // Let's count local clients that are NOT in DB count? No, we don't know which.

        // Revised Strategy for Clients:
        // Use the count we got. Check local clients. If local client ID is found in a "synced" list... 
        // Actually, if we want ACCURACY, we should fetch all Client IDs from DB. it's just UUIDs, lightweight.

        // However, I can't easily change the Promise.all struct drastically in this replace block without complexity.
        // Let's assume for now that if it's in LocalStorage, might be dup.
        // BUT, usually we wipe from LS or mark synced? 
        // Current 'clients.ts' doesn't seem to wipe LS on read.

        // Let's do this: Local Count of (user_id == vendorId) + DB Count.
        // If the user says "0", it means DB is 0. So Local is X. Total = X.
        // If DB has 5, Local has 5 (same), Total should be 5.
        // We MUST deduplicate.

        // Let's change the query for clients to fetch IDs.
        // But I need to do it inside the function.
        // I will re-run the client query to get IDs for deduplication.

        const { data: dbClientIds } = await supabase.from('clients').select('id').eq('user_id', vendorId);
        const dbClientIdSet = new Set((dbClientIds || []).map(c => c.id));

        let totalClients = dbClientIdSet.size;

        localClients.forEach(c => {
            if ((c.user_id === vendorId) && !dbClientIdSet.has(c.id)) {
                totalClients++;
                dbClientIdSet.add(c.id);
            }
        });

        // Stamps - same logic
        const { data: dbStampIds } = await supabase.from('stamps').select('id').eq('user_id', vendorId);
        const dbStampIdSet = new Set((dbStampIds || []).map(s => s.id));

        // Load local stamps if exists (mocking logic since we didn't read them above)
        // Assuming no heavy verification needed for stamps count for now, 
        // just using DB count to avoid complexity if LS key is unknown.
        // But for Clients, we fixed it.

        return {
            totalOrders,
            ordersInProduction,
            ordersCompleted,
            totalClients,
            totalStamps: dbStampIdSet.size, // Keeping stamps simple for now
        };
    } catch (error: any) {
        console.error('Erro ao buscar estatísticas:', error);
        // Temporary debug toast:
        if (typeof window !== 'undefined') {
            import('sonner').then(({ toast }) => {
                toast.error(`Debug erro: ${error.message || JSON.stringify(error)}`);
            });
        }
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
