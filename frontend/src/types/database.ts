export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    phone_number: string | null
                    role: 'user' | 'contractor' | 'admin'
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    phone_number?: string | null
                    role?: 'user' | 'contractor' | 'admin'
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    phone_number?: string | null
                    role?: 'user' | 'contractor' | 'admin'
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            vehicles: {
                Row: {
                    id: string
                    user_id: string
                    make: string
                    model: string
                    year: number
                    color: string | null
                    license_plate: string | null
                    type: string | null
                    photo_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    make: string
                    model: string
                    year: number
                    color?: string | null
                    license_plate?: string | null
                    type?: string | null
                    photo_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    make?: string
                    model?: string
                    year?: number
                    color?: string | null
                    license_plate?: string | null
                    type?: string | null
                    photo_url?: string | null
                    created_at?: string
                }
            }
            add_ons: {
                Row: {
                    id: number
                    document_id: string | null
                    name: string
                    name_es: string | null
                    description: string | null
                    description_es: string | null
                    price: string | number
                    duration_minutes: number | null
                    sort_order: number | null
                    is_active: boolean | null
                    created_at: string
                }
                Insert: {
                    id?: number
                    document_id?: string | null
                    name: string
                    name_es?: string | null
                    description?: string | null
                    description_es?: string | null
                    price: string | number
                    duration_minutes?: number | null
                    sort_order?: number | null
                    is_active?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: number
                    document_id?: string | null
                    name?: string
                    name_es?: string | null
                    description?: string | null
                    description_es?: string | null
                    price?: string | number
                    duration_minutes?: number | null
                    sort_order?: number | null
                    is_active?: boolean | null
                    created_at?: string
                }
            }
            services: {
                Row: {
                    id: number
                    document_id: string | null
                    name: string
                    slug: string | null
                    description: string | null
                    base_price: string | number
                    duration_minutes: number | null
                    checklist: Json | null
                    sort_order: number | null
                    created_at: string
                    updated_at: string
                    published_at: string | null
                    locale: string | null
                }
                Insert: {
                    id?: number
                    document_id?: string | null
                    name: string
                    slug?: string | null
                    description?: string | null
                    base_price: string | number
                    duration_minutes?: number | null
                    checklist?: Json | null
                    sort_order?: number | null
                    created_at?: string
                    updated_at?: string
                    published_at?: string | null
                    locale?: string | null
                }
                Update: {
                    id?: number
                    document_id?: string | null
                    name?: string
                    slug?: string | null
                    description?: string | null
                    base_price?: string | number
                    duration_minutes?: number | null
                    checklist?: Json | null
                    sort_order?: number | null
                    created_at?: string
                    updated_at?: string
                    published_at?: string | null
                    locale?: string | null
                }
            }
            bookings: {
                Row: {
                    id: number
                    document_id: string | null
                    date: string
                    address: string | null
                    city: string | null
                    state: string | null
                    zip_code: string | null
                    customer_name: string | null
                    customer_email: string | null
                    customer_phone: string | null
                    service_name: string | null
                    vehicle_type: string | null
                    vehicle_color: string | null
                    vehicle_make: string | null
                    vehicle_model: string | null
                    vehicle_year: string | null
                    special_instructions: string | null
                    total_amount: string | number
                    payment_status: string | null
                    payment_intent_id: string | null
                    status: string | null
                    confirmation_code: string | null
                    time_window: string | null
                    created_at: string
                    updated_at: string
                    published_at: string | null
                }
                Insert: {
                    id?: number
                    document_id?: string | null
                    date: string
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    zip_code?: string | null
                    customer_name?: string | null
                    customer_email?: string | null
                    customer_phone?: string | null
                    service_name?: string | null
                    vehicle_type?: string | null
                    vehicle_color?: string | null
                    vehicle_make?: string | null
                    vehicle_model?: string | null
                    vehicle_year?: string | null
                    special_instructions?: string | null
                    total_amount?: string | number
                    payment_status?: string | null
                    payment_intent_id?: string | null
                    status?: string | null
                    confirmation_code?: string | null
                    time_window?: string | null
                    created_at?: string
                    updated_at?: string
                    published_at?: string | null
                }
                Update: {
                    id?: number
                    document_id?: string | null
                    date?: string
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    customer_name?: string | null
                    customer_email?: string | null
                    customer_phone?: string | null
                    service_name?: string | null
                    vehicle_type?: string | null
                    vehicle_color?: string | null
                    vehicle_make?: string | null
                    vehicle_model?: string | null
                    vehicle_year?: string | null
                    special_instructions?: string | null
                    total_amount?: string | number
                    payment_status?: string | null
                    payment_intent_id?: string | null
                    status?: string | null
                    created_at?: string
                    updated_at?: string
                    published_at?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
