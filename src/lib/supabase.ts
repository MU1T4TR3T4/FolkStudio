import { createClient } from '@supabase/supabase-js';

// Use fallback values during build time if env vars are not available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface Design {
    id: string;
    mockup_image: string | null;
    product_type: string;
    color: string;
    elements: DesignElement[];
    final_image_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface DesignElement {
    id: string;
    type: "text" | "image";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    xPercent?: number;
    yPercent?: number;
    widthPercent?: number;
    heightPercent?: number;
    // Text properties
    content?: string;
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    color?: string;
    textAlign?: string;
    // Image properties
    src?: string;
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
