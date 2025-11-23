import { openDB } from 'idb';

const DB_NAME = 'folk_studio_db';
const STORE_NAME = 'images';

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
    return (await db.get(STORE_NAME, key)) || null;
}

export async function deleteImage(key: string): Promise<void> {
    const db = await initDB();
    await db.delete(STORE_NAME, key);
}

export async function clearImages(): Promise<void> {
    const db = await initDB();
    await db.clear(STORE_NAME);
}
