"use client";

import { createContext, useContext, useState, useCallback, useRef, ReactNode, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fmtDate } from '@/lib/dateUtils';
import { useAuth } from './AuthContext';

// --- Types ---

export type BookingStatus = 'pending_payment' | 'pending' | 'pending_assignment' | 'confirmed' | 'en_route' | 'working' | 'in_progress' | 'pending_approval' | 'completed' | 'cancelled';

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
    reviewRating?: number | null;
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

    // Refresh helpers
    refreshBookings: () => Promise<void>;
    simulateProviderUpdate: (bookingId: string) => void;
}

const BookingStatusContext = createContext<BookingStatusContextType | undefined>(undefined);

// --- DB row shape for vehicles table ---
interface DbVehicle {
    id: string;
    user_id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    type: string;
    created_at?: string;
}

// Mapping Helpers
function mapDbVehicleToVehicle(dbVehicle: DbVehicle): Vehicle {
    return {
        id: dbVehicle.id,
        make: dbVehicle.make,
        model: dbVehicle.model,
        year: dbVehicle.year.toString(),
        color: dbVehicle.color,
        licensePlate: dbVehicle.license_plate,
        type: dbVehicle.type as Vehicle['type'],
    };
}

/** Detect locale from current URL pathname. */
function detectLocale(): 'en' | 'es' {
    if (typeof window === 'undefined') return 'en';
    const seg = window.location.pathname.split('/')[1];
    return seg === 'es' ? 'es' : 'en';
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
    const refreshBookingsRef = useRef<(() => Promise<void>) | null>(null);

    const refreshBookings = useCallback(async () => {
        if (refreshBookingsRef.current) await refreshBookingsRef.current();
    }, []);

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

        async function fetchBookings() {
            try {
                const bookingsRes = await fetch('/api/booking/list');
                if (bookingsRes.ok) {
                    const { bookings: bookingData, contractorNames } = await bookingsRes.json();
                    setBookings((bookingData ?? []).map((b: Record<string, unknown>) => ({
                        id: String(b.id),
                        serviceName: (b.service_name as string) || 'Auto Detail',
                        date: b.date as string,
                        time: (b.time_window as string) || 'N/A',
                        status: (b.status as BookingStatus) || 'pending',
                        price: Number(b.total_amount) || 0,
                        customerAddress: (b.address as string) || 'N/A',
                        paymentStatus: b.payment_status as string | undefined,
                        confirmationCode: b.confirmation_code as string | undefined,
                        providerName: b.contractor_id ? contractorNames[b.contractor_id as string] : undefined,
                        providerRating: undefined,
                        reviewRating: (b.review_rating as number | null) ?? null,
                    })));
                }
            } catch {
                console.error('Failed to fetch bookings via API');
            }
        }
        refreshBookingsRef.current = fetchBookings;

        async function fetchUserData() {
            setIsLoading(true);
            try {
                const supabase = createClient();

                // Fetch Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (profileData) {
                    setUserProfile({
                        name: profileData.full_name?.split(' ')[0] || 'there',
                        email: userEmail,
                        phone: profileData.phone || '',
                        memberSince: fmtDate(profileData.created_at, 'en-US', { month: 'long', year: 'numeric' }),
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

                await fetchBookings();
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchUserData();

        // Re-fetch bookings when the window regains focus (e.g. returning from booking flow)
        // Throttled: skip if last fetch was < 5 seconds ago
        let lastFetchTime = Date.now();
        const handleFocus = () => {
            if (Date.now() - lastFetchTime < 5000) return;
            lastFetchTime = Date.now();
            fetchBookings();
        };
        window.addEventListener('focus', handleFocus);


        // Real-time for Vehicles + Bookings
        const supabase = createClient();
        const vehicleChannel = supabase
            .channel(`user-vehicles-${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'vehicles', filter: `user_id=eq.${userId}` },
                (payload: any) => {
                    const record = payload.new as DbVehicle;
                    if (payload.eventType === 'INSERT') {
                        setVehicles(prev => [...prev, mapDbVehicleToVehicle(record)]);
                    } else if (payload.eventType === 'DELETE') {
                        setVehicles(prev => prev.filter(v => v.id !== (payload.old as DbVehicle).id));
                    } else if (payload.eventType === 'UPDATE') {
                        setVehicles(prev => prev.map(v => v.id === record.id ? mapDbVehicleToVehicle(record) : v));
                    }
                }
            )
            .subscribe();

        const bookingChannel = supabase
            .channel(`user-bookings-${userId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'bookings', filter: `customer_email=eq.${userEmail}` },
                (payload: any) => {
                    const row = payload.new as Record<string, unknown>;
                    const newBooking: Booking = {
                        id: String(row.id),
                        serviceName: (row.service_name as string) || 'Auto Detail',
                        date: row.date as string,
                        time: (row.time_window as string) || 'N/A',
                        status: (row.status as BookingStatus) || 'pending',
                        price: Number(row.total_amount) || 0,
                        customerAddress: (row.address as string) || 'N/A',
                        paymentStatus: row.payment_status as string | undefined,
                        confirmationCode: row.confirmation_code as string | undefined,
                        reviewRating: null,
                    };
                    setBookings(prev => {
                        if (prev.some(b => b.id === newBooking.id)) return prev;
                        return [newBooking, ...prev];
                    });
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `customer_email=eq.${userEmail}` },
                (payload: any) => {
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
                        const isEs = currentLang === 'es';
                        addNotification({
                            title: isEs ? '¡Trabajo Completado!' : 'Job Complete!',
                            message: isEs
                                ? `Orden ${confirmationCode ?? bookingId} lista. Deja una reseña.`
                                : `Order ${confirmationCode ?? bookingId} is done. Leave a review.`,
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
            window.removeEventListener('focus', handleFocus);
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
            const loc = detectLocale();
            addNotification({
                title: loc === 'es' ? 'Garaje Sincronizado' : 'Garage Synced',
                message: loc === 'es'
                    ? `${guestVehicles.length} vehiculos de tu sesion de invitado fueron agregados a tu cuenta.`
                    : `${guestVehicles.length} vehicles from your guest session were added to your account.`,
                type: 'success'
            });
        }

        syncVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const loc = detectLocale();
        if (!user) {
            // Guest mode: update local state only
            setUserProfile(prev => prev ? { ...prev, ...data } : null);
            addNotification({
                title: loc === 'es' ? 'Perfil Actualizado' : 'Profile Updated',
                message: loc === 'es' ? 'Tus cambios de perfil han sido guardados.' : 'Your profile changes have been saved.',
                type: 'success',
            });
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
            addNotification({ title: loc === 'es' ? 'Actualizacion Fallida' : 'Update Failed', message: error.message, type: 'error' });
            return;
        }

        setUserProfile(prev => prev ? { ...prev, ...data } : null);
        addNotification({
            title: loc === 'es' ? 'Perfil Actualizado' : 'Profile Updated',
            message: loc === 'es' ? 'Tus cambios de perfil han sido guardados.' : 'Your profile changes have been saved.',
            type: 'success',
        });
    };

    const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
        const loc = detectLocale();
        const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
        if (!user) {
            // Guest mode: persist to localStorage
            const newVehicle: Vehicle = { ...vehicle, id: Math.random().toString(36).substr(2, 9) };
            setVehicles(prev => {
                const updated = [...prev, newVehicle];
                localStorage.setItem('guest_vehicles', JSON.stringify(updated));
                return updated;
            });
            addNotification({
                title: loc === 'es' ? 'Vehiculo Agregado' : 'Vehicle Added',
                message: loc === 'es' ? `${vehicleLabel} agregado al garaje.` : `${vehicleLabel} added to garage.`,
                type: 'success',
            });
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
            addNotification({ title: loc === 'es' ? 'Accion Fallida' : 'Action Failed', message: error.message, type: 'error' });
            return;
        }

        addNotification({
            title: loc === 'es' ? 'Vehiculo Agregado' : 'Vehicle Added',
            message: loc === 'es' ? `${vehicleLabel} agregado al garaje.` : `${vehicleLabel} added to garage.`,
            type: 'success',
        });
    };

    const removeVehicle = async (id: string) => {
        const loc = detectLocale();
        if (!user) {
            // Guest mode: remove from localStorage
            setVehicles(prev => {
                const updated = prev.filter(v => v.id !== id);
                localStorage.setItem('guest_vehicles', JSON.stringify(updated));
                return updated;
            });
            addNotification({
                title: loc === 'es' ? 'Vehiculo Eliminado' : 'Vehicle Removed',
                message: loc === 'es' ? 'Vehiculo eliminado de tu garaje.' : 'Vehicle removed from your garage.',
                type: 'info',
            });
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
            addNotification({ title: loc === 'es' ? 'Accion Fallida' : 'Action Failed', message: error.message, type: 'error' });
            return;
        }

        addNotification({
            title: loc === 'es' ? 'Vehiculo Eliminado' : 'Vehicle Removed',
            message: loc === 'es' ? 'Vehiculo eliminado de tu garaje.' : 'Vehicle removed from your garage.',
            type: 'info',
        });
    };

    const updateSettings = (data: Partial<UserSettings>) => {
        const loc = detectLocale();
        setSettings(prev => ({ ...prev, ...data }));
        addNotification({
            title: loc === 'es' ? 'Configuracion Guardada' : 'Settings Saved',
            message: loc === 'es' ? 'Tus preferencias han sido actualizadas.' : 'Your preferences have been updated.',
            type: 'success',
        });
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
                refreshBookings,
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
