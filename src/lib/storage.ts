import { openDB } from 'idb';
import { supabase } from './supabase';

const DB_NAME = 'folk_studio_db';
const STORE_NAME = 'images';

// Supabase Storage Helper
export async function uploadFile(file: File, path: string): Promise<string | null> {
    try {
        const { data, error } = await supabase.storage
            .from('orders')
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            console.error('Supabase Storage Error:', error);
            throw error;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('orders')
            .getPublicUrl(path);

        return publicUrl;
    } catch (err) {
        console.error('Falha no upload:', err);
        return null;
    }
}

// ... Keep IDB for legacy or cache if needed, but primary is now Storage ...
export async function initDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        },
    });
}

export async function saveImage(key: string, base64: string): Promise<void> {
    const db = await initDB();
    await db.put(STORE_NAME, base64, key);
}

export async function getImage(key: string): Promise<string | null> {
    const db = await initDB();
    const val = await db.get(STORE_NAME, key);
    return val || null;
}

export async function deleteImage(key: string): Promise<void> {
    const db = await initDB();
    await db.delete(STORE_NAME, key);
}

export async function clearImages(): Promise<void> {
    const db = await initDB();
    await db.clear(STORE_NAME);
}
