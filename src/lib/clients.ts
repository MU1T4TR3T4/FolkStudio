
import { supabase, Design, Stamp } from './supabase';

export interface Client {
    id: string;
    user_id?: string;
    name: string;
    email?: string;
    phone?: string;
    company_name?: string;
    cpf_cnpj?: string;
    address_street?: string;
    address_number?: string;
    address_complement?: string;
    address_neighborhood?: string;
    address_city?: string;
    address_state?: string;
    address_zip?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Get all clients (sorted by newest first)
 */
export async function getClients(): Promise<Client[]> {
    let dbClients: Client[] = [];
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) dbClients = data;
    } catch (error) {
        console.error('Error fetching clients from DB:', error);
    }

    // Always fetch from LocalStorage to include offline/fallback clients
    let localClients: Client[] = [];
    try {
        const saved = localStorage.getItem('folk_studio_clients');
        if (saved) {
            localClients = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error reading localStorage clients:', e);
    }

    // Merge lists, removing duplicates (prefer DB version if exists, or just merge by ID)
    // Since we use random UUIDs, collision is unlikely unless it's the same record.
    // If a record exists in both, we usually prefer the DB one, but for simple display,
    // let's just combine them and deduplicate by ID.
    const allClients = [...dbClients];
    const dbIds = new Set(dbClients.map(c => c.id));

    localClients.forEach(c => {
        if (!dbIds.has(c.id)) {
            allClients.push(c);
        }
    });

    // Re-sort by created_at desc
    return allClients.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
    });
}

/**
 * Get a single client by ID
 */
export async function getClientById(id: string): Promise<Client | null> {
    let client: Client | null = null;
    try {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .single();

        if (!error && data) {
            client = data;
        }
    } catch (error) {
        console.error(`Error fetching client ${id} from DB:`, error);
    }

    if (client) return client;

    // Fallback to localStorage if not found in DB
    try {
        const saved = localStorage.getItem('folk_studio_clients');
        if (saved) {
            const clients: Client[] = JSON.parse(saved);
            const found = clients.find(c => c.id === id);
            if (found) return found;
        }
    } catch (e) {
        console.error('Error reading localStorage client:', e);
    }

    return null;
}

/**
 * Create a new client
 */
export async function createClient(client: Partial<Client>): Promise<Client | null> {
    try {
        // Prepare data for Supabase
        // Note: user_id should be handled by RLS or passed explicitly if needed, but for now we might rely on client-side logic or context
        // Ideally we grab the current user's ID here if we had auth context available directly in lib, 
        // but typically Supabase client handles auth context if user is signed in.
        // For 'clients' table we defined user_id as NOT NULL.
        // If we are strictly client-side without a real backend user, we might need to fake it or rely on the RLS policy 'true' for now.
        // But the schema says user_id is REFERENCES users(id). 
        // DEVELOPMENT HACK: If no user is logged in, we might fail on NOT NULL constraint if we don't send a valid user_id.
        // Let's assume we are passing a valid user_id or we are in a mode where we can bypass it temporarily or fetch current user.

        const { data: { user } } = await supabase.auth.getUser();

        const clientData = {
            ...client,
            user_id: user?.id || client.user_id, // prioritize auth user, fallback to passed, otherwise might fail if needed
        };

        // WARNING: If user is not logged in and user_id is required, this will fail in Supabase.
        // For local dev with 'idb' fallback it's fine.

        if (user || client.user_id) {
            const { data, error } = await supabase
                .from('clients')
                .insert(clientData)
                .select()
                .single();

            if (data) return data;
        }

        throw new Error("No authenticated user or Supabase error");

    } catch (error) {
        console.warn('Backend creation failed, falling back to localStorage:', error);
        // Fallback to localStorage
        const newClient: Client = {
            id: crypto.randomUUID(),
            name: client.name || 'Novo Cliente',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...client,
        } as Client;

        const saved = localStorage.getItem('folk_studio_clients');
        const clients: Client[] = saved ? JSON.parse(saved) : [];
        clients.unshift(newClient);
        localStorage.setItem('folk_studio_clients', JSON.stringify(clients));
        return newClient;
    }
}

/**
 * Update a client
 */
export async function updateClient(id: string, updates: Partial<Client>): Promise<Client | null> {
    try {
        const { data, error } = await supabase
            .from('clients')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating client:', error);
        // Fallback
        const saved = localStorage.getItem('folk_studio_clients');
        if (saved) {
            const clients: Client[] = JSON.parse(saved);
            const index = clients.findIndex(c => c.id === id);
            if (index !== -1) {
                clients[index] = { ...clients[index], ...updates, updated_at: new Date().toISOString() };
                localStorage.setItem('folk_studio_clients', JSON.stringify(clients));
                return clients[index];
            }
        }
        return null;
    }
}

/**
 * Delete a client
 */
export async function deleteClient(id: string): Promise<boolean> {
    try {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error deleting client:', error);
        // Fallback
        const saved = localStorage.getItem('folk_studio_clients');
        if (saved) {
            const clients: Client[] = JSON.parse(saved);
            const filtered = clients.filter(c => c.id !== id);
            localStorage.setItem('folk_studio_clients', JSON.stringify(filtered));
            return true;
        }
        return false;
    }
}

export interface ClientStamp {
    id: string;
    client_id: string;
    stamp_id?: string;
    design_id?: string;
    type: 'stamp' | 'design';
    created_at: string;
    approval_token?: string;
    approval_status?: 'pending' | 'approved' | 'rejected';
    approval_signature?: string;
    approved_at?: string;
    // Joined data
    stamp?: Stamp;
    design?: Design;
}

/**
 * Assign multiple stamps/designs to a client
 */
export async function assignStampsToClient(clientId: string, items: { id: string, type: 'stamp' | 'design' }[]): Promise<boolean> {
    try {
        const toInsert = items.map(item => ({
            client_id: clientId,
            stamp_id: item.type === 'stamp' ? item.id : null,
            design_id: item.type === 'design' ? item.id : null,
            type: item.type,
            approval_token: crypto.randomUUID() // Generate unique token for approval
        }));

        const { error } = await supabase
            .from('client_stamps')
            .insert(toInsert);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Error assigning stamps:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('folk_studio_client_stamps');
        const current: any[] = saved ? JSON.parse(saved) : [];
        const newItems = items.map(item => ({
            id: crypto.randomUUID(),
            client_id: clientId,
            stamp_id: item.type === 'stamp' ? item.id : null,
            design_id: item.type === 'design' ? item.id : null,
            type: item.type,
            created_at: new Date().toISOString(),
            approval_token: crypto.randomUUID()
        }));
        localStorage.setItem('folk_studio_client_stamps', JSON.stringify([...current, ...newItems]));
        return true;
    }
}

/**
 * Get all stamps assigned to a client
 */
export async function getClientStamps(clientId: string): Promise<ClientStamp[]> {
    let stamps: ClientStamp[] = [];

    // 1. Try to get relationships from DB
    try {
        const { data, error } = await supabase
            .from('client_stamps')
            .select('*')
            .eq('client_id', clientId);

        if (error) throw error;
        if (data) stamps = data as any;
    } catch (error) {
        console.error('Error fetching client stamps from DB:', error);
    }

    // 2. Fallback/Merge with LocalStorage if empty
    // If DB returned nothing (or empty list), check LS and use it if present.
    // This allows offline-created stamps to be visible.
    if (stamps.length === 0) {
        try {
            const saved = localStorage.getItem('folk_studio_client_stamps');
            if (saved) {
                const all: any[] = JSON.parse(saved);
                const localRels = all.filter(x => x.client_id === clientId);
                if (localRels.length > 0) {
                    stamps = localRels;
                }
            }
        } catch (e) {
            console.error('Error reading localStorage for client_stamps', e);
        }
    }

    if (stamps.length === 0) return [];

    // 3. Hydrate details (Fetch actual Stamp/Design objects)
    // We try to fetch these from DB. 
    // Optimization: we could also check LS for stamps/designs if DB fetch yields nothing, 
    // but for now let's assume global catalog is in DB or we only fix the relational link.

    try {
        const stampIds = stamps.filter(s => s.type === 'stamp' && s.stamp_id).map(s => s.stamp_id!);
        let fetchedStamps: Stamp[] = [];
        if (stampIds.length > 0) {
            const { data } = await supabase.from('stamps').select('*').in('id', stampIds);
            if (data) fetchedStamps = data as Stamp[];
        }

        const designIds = stamps.filter(s => s.type === 'design' && s.design_id).map(s => s.design_id!);
        let fetchedDesigns: Design[] = [];
        if (designIds.length > 0) {
            const { data } = await supabase.from('designs').select('*').in('id', designIds);
            if (data) fetchedDesigns = data as Design[];
        }

        // 4. Attach details to the relationships
        return stamps.map(s => {
            const item = { ...s };

            if (item.type === 'stamp' && item.stamp_id) {
                item.stamp = fetchedStamps.find(fs => fs.id === item.stamp_id);
            } else if (item.type === 'design' && item.design_id) {
                item.design = fetchedDesigns.find(fd => fd.id === item.design_id);
            }
            return item;
        });

    } catch (error) {
        console.error('Error hydrating client stamps:', error);
        // Return stamps even if hydration failed, so at least we see boxes
        return stamps;
    }
}

/**
 * Get client stamp by approval token
 */
export async function getApprovalByToken(token: string): Promise<ClientStamp | null> {
    let stampEntry: ClientStamp | null = null;

    // 1. Try Supabase
    try {
        const { data, error } = await supabase
            .from('client_stamps')
            .select('*')
            .eq('approval_token', token)
            .single();

        if (!error && data) {
            stampEntry = data as ClientStamp;
        }
    } catch (error) {
        console.error('Error fetching approval from DB:', error);
    }

    // 2. Fallback to LocalStorage
    if (!stampEntry) {
        try {
            const saved = localStorage.getItem('folk_studio_client_stamps');
            if (saved) {
                const all: any[] = JSON.parse(saved);
                const found = all.find(x => x.approval_token === token);
                if (found) {
                    stampEntry = found;
                }
            }
        } catch (e) {
            console.error('Error reading localStorage for approval', e);
        }
    }

    if (!stampEntry) return null;

    // 3. Hydrate details
    // Even if the link is local, the DESIGN/STAMP might be in Supabase (or we search LS)
    try {
        if (stampEntry.type === 'stamp' && stampEntry.stamp_id) {
            const { data: s } = await supabase.from('stamps').select('*').eq('id', stampEntry.stamp_id).single();
            if (s) {
                stampEntry.stamp = s;
            } else {
                // Try LS for stamp?
                // (Omitted for brevity, typically stamps are public/persisted)
            }
        } else if (stampEntry.type === 'design' && stampEntry.design_id) {
            const { data: d } = await supabase.from('designs').select('*').eq('id', stampEntry.design_id).single();
            if (d) {
                stampEntry.design = d;
            } else {
                // Try LS for design?
                // (Designs might be local only too)
                const designsSaved = localStorage.getItem('folk_studio_designs'); // Hypothetical key
                // Not implemented fully here as usually designs are saved to DB.
            }
        }
    } catch (err) {
        console.error("Error hydrating approval details:", err);
    }

    return stampEntry;
}

/**
 * Submit approval or rejection
 */
export async function submitApproval(token: string, status: 'approved' | 'rejected', signature?: string): Promise<boolean> {
    let success = false;
    const updateData: any = {
        approval_status: status,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
        approval_signature: signature || null
    };

    // 1. Try Supabase
    try {
        const { data, error, count } = await supabase
            .from('client_stamps')
            .update(updateData)
            .eq('approval_token', token)
            .select();

        if (!error && (count || (data && data.length > 0))) {
            success = true;
        }
    } catch (error) {
        console.error('Error submitting approval to DB:', error);
    }

    // 2. Fallback/Sync to LocalStorage
    try {
        const saved = localStorage.getItem('folk_studio_client_stamps');
        if (saved) {
            const all: any[] = JSON.parse(saved);
            const index = all.findIndex(x => x.approval_token === token);
            if (index !== -1) {
                all[index] = { ...all[index], ...updateData };
                localStorage.setItem('folk_studio_client_stamps', JSON.stringify(all));
                success = true; // Mark as success because we updated the local record
            }
        }
    } catch (e) {
        console.error('Error updating localStorage approval:', e);
    }

    return success;
}

/**
 * Remove a stamp assignment from a client
 */
export async function removeClientStamp(id: string): Promise<boolean> {
    let success = false;

    // 1. Remove from Supabase
    try {
        const { error } = await supabase
            .from('client_stamps')
            .delete()
            .eq('id', id);

        if (!error) success = true;
        else console.error('Error removing client stamp from DB:', error);
    } catch (error) {
        console.error('Error removing client stamp:', error);
    }

    // 2. Always try to remove from LocalStorage (cleanup)
    try {
        const saved = localStorage.getItem('folk_studio_client_stamps');
        if (saved) {
            const all: any[] = JSON.parse(saved);
            const initialLength = all.length;
            const filtered = all.filter(x => x.id !== id);

            if (filtered.length !== initialLength) {
                localStorage.setItem('folk_studio_client_stamps', JSON.stringify(filtered));
                success = true; // Mark as success if we found and removed it locally
            }
        }
    } catch (e) {
        console.error('Error removing from localStorage:', e);
    }

    return success;
}
