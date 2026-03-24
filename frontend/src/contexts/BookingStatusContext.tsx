"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';

// --- Types ---

export type BookingStatus = 'pending_payment' | 'pending' | 'pending_assignment' | 'confirmed' | 'en_route' | 'working' | 'completed' | 'cancelled';

export interface Booking {
    id: string;
    serviceName: string;
    date: string; // ISO string
    time: string;
    status: BookingStatus;
    price: number;
    providerName?: string;
    providerRating?: number;
    providerLocation?: { lat: number; lng: number }; // For map simulation
    customerAddress: string;
    paymentStatus?: string;
    confirmationCode?: string;
}

export interface ToastMessage {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
}

export interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: string;
    color: string;
    licensePlate: string;
    type: 'sedan' | 'suv' | 'truck' | 'coupe' | 'van' | 'other';
}

export interface UserProfile {
    path?: string; // Avatar URL
    name: string;
    email: string;
    phone: string;
    memberSince: string;
}

export interface UserSettings {
    notificationsEnabled: boolean;
    marketingEmails: boolean;
    darkMode: boolean;
}

interface BookingStatusContextType {
    // Booking State
    bookings: Booking[];
    getBooking: (id: string) => Booking | undefined;
    updateBookingStatus: (id: string, status: BookingStatus) => void;

    // Notification State
    notifications: ToastMessage[];
    addNotification: (notification: Omit<ToastMessage, 'id'>) => void;
    dismissNotification: (id: string) => void;

    // User & Vehicle State
    userProfile: UserProfile | null;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
    vehicles: Vehicle[];
    addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>;
    removeVehicle: (id: string) => Promise<void>;
    settings: UserSettings;
    updateSettings: (data: Partial<UserSettings>) => void;
    isLoading: boolean;

    // Simulation helpers
    simulateProviderUpdate: (bookingId: string) => void;
}

const BookingStatusContext = createContext<BookingStatusContextType | undefined>(undefined);

// Mapping Helpers
function mapDbVehicleToVehicle(dbVehicle: any): Vehicle {
    return {
        id: dbVehicle.id,
        make: dbVehicle.make,
        model: dbVehicle.model,
        year: dbVehicle.year.toString(),
        color: dbVehicle.color,
        licensePlate: dbVehicle.license_plate,
        type: dbVehicle.type as any
    };
}

const INITIAL_SETTINGS: UserSettings = {
    notificationsEnabled: true,
    marketingEmails: false,
    darkMode: true
};

export function BookingStatusProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [notifications, setNotifications] = useState<ToastMessage[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Fetch & Subscriptions
    useEffect(() => {
        if (!user || !user.id || !user.email) {
            // Guest / no-auth mode: load vehicles from localStorage, set a placeholder profile
            const stored = typeof window !== 'undefined' ? localStorage.getItem('guest_vehicles') : null;
            setVehicles(stored ? JSON.parse(stored) : []);
            setUserProfile({
                name: 'Test User',
                email: 'test@example.com',
                phone: '',
                memberSince: 'February 2026',
                path: ''
            });
            setIsLoading(false);
            return;
        }

        const userId = user.id;
        const userEmail = user.email;

        async function fetchUserData() {
            setIsLoading(true);
            const supabase = createClient();

            // Fetch Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileData) {
                setUserProfile({
                    name: profileData.full_name || userEmail.split('@')[0] || 'User',
                    email: userEmail,
                    phone: profileData.phone || '',
                    memberSince: new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    path: profileData.avatar_url || '/avatars/default.png'
                });
            }

            // Fetch Vehicles
            const { data: vehicleData } = await supabase
                .from('vehicles')
                .select('*')
                .eq('user_id', userId);

            if (vehicleData) {
                setVehicles(vehicleData.map(mapDbVehicleToVehicle));
            }

            // Fetch bookings from Supabase (source of truth for transactional data)
            const { data: bookingData } = await supabase
                .from('bookings')
                .select('*, contractor:contractor_id(full_name, rating)')
                .eq('customer_email', userEmail)
                .order('created_at', { ascending: false })
                .limit(20);

            if (bookingData) {
                setBookings(bookingData.map((b) => ({
                    id: b.id.toString(),
                    serviceName: (b as any).service_name || 'Auto Detail',
                    date: b.date,
                    time: b.time_window || 'N/A',
                    status: (b.status as BookingStatus) || 'pending',
                    price: Number(b.total_amount) || 0,
                    customerAddress: b.address || 'N/A',
                    paymentStatus: (b as any).payment_status,
                    confirmationCode: (b as any).confirmation_code,
                    providerName: (b as any).contractor?.full_name || undefined,
                    providerRating: (b as any).contractor?.rating || undefined,
                })));
            }

            setIsLoading(false);
        }

        fetchUserData();

        // Real-time for Vehicles + Bookings
        const supabase = createClient();
        const vehicleChannel = supabase
            .channel(`user-vehicles-${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'vehicles', filter: `user_id=eq.${userId}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setVehicles(prev => [...prev, mapDbVehicleToVehicle(payload.new)]);
                    } else if (payload.eventType === 'DELETE') {
                        setVehicles(prev => prev.filter(v => v.id !== payload.old.id));
                    } else if (payload.eventType === 'UPDATE') {
                        setVehicles(prev => prev.map(v => v.id === payload.new.id ? mapDbVehicleToVehicle(payload.new) : v));
                    }
                }
            )
            .subscribe();

        const bookingChannel = supabase
            .channel(`user-bookings-${userId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `customer_email=eq.${userEmail}` },
                (payload) => {
                    const updated = payload.new as Record<string, unknown>;
                    setBookings(prev => prev.map(b =>
                        b.id === String(updated.id)
                            ? { ...b, status: updated.status as BookingStatus }
                            : b
                    ));
                    if (updated.status === 'completed') {
                        const bookingId = String(updated.id);
                        const confirmationCode = updated.confirmation_code as string | undefined;
                        const currentLang = typeof window !== 'undefined'
                            ? (window.location.pathname.split('/')[1] || 'en')
                            : 'en';
                        addNotification({
                            title: 'Job Complete!',
                            message: `Order ${confirmationCode ?? bookingId} is done. Leave a review.`,
                            type: 'success',
                            link: `/${currentLang}/booking/${bookingId}/review`,
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(vehicleChannel);
            supabase.removeChannel(bookingChannel);
        };
    }, [user, user?.id, user?.email]);

    // Sync guest vehicles when user logs in
    useEffect(() => {
        if (!user) return;

        const stored = typeof window !== 'undefined' ? localStorage.getItem('guest_vehicles') : null;
        if (!stored) return;

        let guestVehicles: Vehicle[] = [];
        try {
            guestVehicles = JSON.parse(stored);
        } catch (e) {
            console.error("Failed to parse guest vehicles", e);
            return;
        }
        
        if (guestVehicles.length === 0) return;
        
        const userId = user.id;

        async function syncVehicles() {
            const supabase = createClient();
            for (const v of guestVehicles) {
                // Check if vehicle already exists to prevent duplicates (optional but good)
                await supabase.from('vehicles').insert({
                    user_id: userId,
                    make: v.make,
                    model: v.model,
                    year: parseInt(v.year),
                    color: v.color,
                    license_plate: v.licensePlate || '',
                    type: v.type
                });
            }
            localStorage.removeItem('guest_vehicles');
            addNotification({ 
                title: 'Garage Synced', 
                message: `${guestVehicles.length} vehicles from your guest session were added to your account.`, 
                type: 'success' 
            });
        }

        syncVehicles();
    }, [user]);

    // --- Notification Methods ---
    const addNotification = (notification: Omit<ToastMessage, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => [...prev, { ...notification, id }]);
        setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 5000);
    };

    const dismissNotification = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    // --- Booking Methods ---
    const getBooking = (id: string) => bookings.find((b) => b.id === id);

    const updateBookingStatus = (id: string, status: BookingStatus) => {
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
        // In a real app, this would update Supabase too
    };

    // --- User & Vehicle Methods ---
    const updateProfile = async (data: Partial<UserProfile>) => {
        if (!user) {
            // Guest mode: update local state only
            setUserProfile(prev => prev ? { ...prev, ...data } : null);
            addNotification({ title: 'Profile Updated', message: 'Your profile changes have been saved.', type: 'success' });
            return;
        }
        const supabase = createClient();

        const payload: Record<string, string | null> = {};
        if (data.name !== undefined) payload.full_name = data.name;
        if (data.phone !== undefined) payload.phone = data.phone;
        if (data.path !== undefined) payload.avatar_url = data.path || null;

        const { error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', user.id);

        if (error) {
            console.error('Error updating profile:', error);
            addNotification({ title: 'Update Failed', message: error.message, type: 'error' });
            return;
        }

        setUserProfile(prev => prev ? { ...prev, ...data } : null);
        addNotification({ title: 'Profile Updated', message: 'Your profile changes have been saved.', type: 'success' });
    };

    const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
        if (!user) {
            // Guest mode: persist to localStorage
            const newVehicle: Vehicle = { ...vehicle, id: Math.random().toString(36).substr(2, 9) };
            setVehicles(prev => {
                const updated = [...prev, newVehicle];
                localStorage.setItem('guest_vehicles', JSON.stringify(updated));
                return updated;
            });
            addNotification({ title: 'Vehicle Added', message: `${vehicle.year} ${vehicle.make} ${vehicle.model} added to garage.`, type: 'success' });
            return;
        }
        const supabase = createClient();

        const { error } = await supabase
            .from('vehicles')
            .insert({
                user_id: user.id,
                make: vehicle.make,
                model: vehicle.model,
                year: parseInt(vehicle.year),
                color: vehicle.color,
                license_plate: vehicle.licensePlate,
                type: vehicle.type
            });

        if (error) {
            console.error('Error adding vehicle:', error);
            addNotification({ title: 'Action Failed', message: error.message, type: 'error' });
            return;
        }

        addNotification({ title: 'Vehicle Added', message: `${vehicle.year} ${vehicle.make} ${vehicle.model} added to garage.`, type: 'success' });
    };

    const removeVehicle = async (id: string) => {
        if (!user) {
            // Guest mode: remove from localStorage
            setVehicles(prev => {
                const updated = prev.filter(v => v.id !== id);
                localStorage.setItem('guest_vehicles', JSON.stringify(updated));
                return updated;
            });
            addNotification({ title: 'Vehicle Removed', message: 'Vehicle removed from your garage.', type: 'info' });
            return;
        }
        // Optimistic update — remove immediately so the UI responds even if real-time is slow
        setVehicles(prev => prev.filter(v => v.id !== id));

        const supabase = createClient();
        const { error } = await supabase
            .from('vehicles')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error removing vehicle:', error);
            // Revert optimistic update on failure
            const { data } = await supabase.from('vehicles').select('*').eq('user_id', user.id);
            if (data) setVehicles(data.map(mapDbVehicleToVehicle));
            addNotification({ title: 'Action Failed', message: error.message, type: 'error' });
            return;
        }

        addNotification({ title: 'Vehicle Removed', message: 'Vehicle removed from your garage.', type: 'info' });
    };

    const updateSettings = (data: Partial<UserSettings>) => {
        setSettings(prev => ({ ...prev, ...data }));
        addNotification({ title: 'Settings Saved', message: 'Your preferences have been updated.', type: 'success' });
    };

    // simulation helper left as-is for demo richness
    const simulateProviderUpdate = (bookingId: string) => {
        updateBookingStatus(bookingId, 'en_route');
    };

    return (
        <BookingStatusContext.Provider
            value={{
                bookings,
                getBooking,
                updateBookingStatus,
                notifications,
                addNotification,
                dismissNotification,
                userProfile,
                updateProfile,
                vehicles,
                addVehicle,
                removeVehicle,
                settings,
                updateSettings,
                isLoading,
                simulateProviderUpdate,
            }}
        >
            {children}
        </BookingStatusContext.Provider>
    );
}

export function useBookingStatus() {
    const context = useContext(BookingStatusContext);
    if (context === undefined) {
        throw new Error('useBookingStatus must be used within a BookingStatusProvider');
    }
    return context;
}
