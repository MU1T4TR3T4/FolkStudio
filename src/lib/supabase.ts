import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface Design {
    id: string;
    mockup_image: string | null;
    product_type: string;
    color: string;
    elements: any;
    final_image_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    customer_name: string;
    customer_email: string | null;
    customer_phone: string | null;
    product_type: string;
    color: string;
    size: string | null;
    quantity: number;
    design_id: string | null;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface Stamp {
    id: string;
    name: string;
    image_url: string;
    type: string; // 'generated' | 'uploaded'
    prompt: string | null;
    created_at: string;
}

export interface OrderMessage {
    id: string;
    order_id: string;
    sender: string;
    message: string;
    is_admin: boolean;
    created_at: string;
}

export interface OrderFile {
    id: string;
    order_id: string;
    file_name: string;
    file_url: string;
    uploaded_by: string;
    created_at: string;
}
