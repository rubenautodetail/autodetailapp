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
                    email: string | null
                    full_name: string | null
                    phone_number: string | null
                    phone: string | null
                    role: 'user' | 'contractor' | 'admin'
                    approval_status: 'pending' | 'approved' | 'rejected' | null
                    avatar_url: string | null
                    profile_photo_url: string | null
                    bio: string | null
                    stripe_account_id: string | null
                    onboarding_complete: boolean | null
                    is_available: boolean | null
                    service_area_zips: string[] | null
                    availability: Json | null
                    languages: string[] | null
                    rating: number | null
                    total_ratings: number | null
                    total_jobs_completed: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    phone_number?: string | null
                    phone?: string | null
                    role?: 'user' | 'contractor' | 'admin'
                    approval_status?: 'pending' | 'approved' | 'rejected' | null
                    avatar_url?: string | null
                    profile_photo_url?: string | null
                    bio?: string | null
                    stripe_account_id?: string | null
                    onboarding_complete?: boolean | null
                    is_available?: boolean | null
                    service_area_zips?: string[] | null
                    availability?: Json | null
                    languages?: string[] | null
                    rating?: number | null
                    total_ratings?: number | null
                    total_jobs_completed?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    phone_number?: string | null
                    phone?: string | null
                    role?: 'user' | 'contractor' | 'admin'
                    approval_status?: 'pending' | 'approved' | 'rejected' | null
                    avatar_url?: string | null
                    profile_photo_url?: string | null
                    bio?: string | null
                    stripe_account_id?: string | null
                    onboarding_complete?: boolean | null
                    is_available?: boolean | null
                    service_area_zips?: string[] | null
                    availability?: Json | null
                    languages?: string[] | null
                    rating?: number | null
                    total_ratings?: number | null
                    total_jobs_completed?: number | null
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
                    name_es: string | null
                    slug: string | null
                    description: string | null
                    description_es: string | null
                    base_price: string | number
                    duration_minutes: number | null
                    checklist: Json | null
                    sort_order: number | null
                    is_active: boolean | null
                    stripe_product_id: string | null
                    created_at: string
                    updated_at: string
                    published_at: string | null
                    locale: string | null
                }
                Insert: {
                    id?: number
                    document_id?: string | null
                    name: string
                    name_es?: string | null
                    slug?: string | null
                    description?: string | null
                    description_es?: string | null
                    base_price: string | number
                    duration_minutes?: number | null
                    checklist?: Json | null
                    sort_order?: number | null
                    is_active?: boolean | null
                    stripe_product_id?: string | null
                    created_at?: string
                    updated_at?: string
                    published_at?: string | null
                    locale?: string | null
                }
                Update: {
                    id?: number
                    document_id?: string | null
                    name?: string
                    name_es?: string | null
                    slug?: string | null
                    description?: string | null
                    description_es?: string | null
                    base_price?: string | number
                    duration_minutes?: number | null
                    checklist?: Json | null
                    sort_order?: number | null
                    is_active?: boolean | null
                    stripe_product_id?: string | null
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
                    user_id: string | null
                    contractor_id: string | null
                    confirmation_code: string | null
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
                    subtotal: string | number | null
                    service_fee: string | number | null
                    total_amount: string | number
                    platform_commission: string | number | null
                    contractor_earnings: string | number | null
                    payment_status: string | null
                    payment_intent_id: string | null
                    payment_auth_id: string | null
                    stripe_payment_intent_id: string | null
                    status: string | null
                    time_window: string | null
                    accepted_at: string | null
                    captured_at: string | null
                    paid_at: string | null
                    completed_at: string | null
                    cancelled_at: string | null
                    cancellation_reason: string | null
                    rejection_reason: string | null
                    payment_error: string | null
                    customer_notes: string | null
                    before_photos: string[] | null
                    completion_photos: string[] | null
                    checklist_completed: Json | null
                    created_at: string
                    updated_at: string
                    published_at: string | null
                }
                Insert: {
                    id?: number
                    document_id?: string | null
                    user_id?: string | null
                    contractor_id?: string | null
                    confirmation_code?: string | null
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
                    subtotal?: string | number | null
                    service_fee?: string | number | null
                    total_amount?: string | number
                    payment_status?: string | null
                    payment_intent_id?: string | null
                    status?: string | null
                    time_window?: string | null
                    created_at?: string
                    updated_at?: string
                    published_at?: string | null
                }
                Update: {
                    id?: number
                    document_id?: string | null
                    user_id?: string | null
                    contractor_id?: string | null
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
                    subtotal?: string | number | null
                    service_fee?: string | number | null
                    total_amount?: string | number
                    payment_status?: string | null
                    payment_intent_id?: string | null
                    status?: string | null
                    time_window?: string | null
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
