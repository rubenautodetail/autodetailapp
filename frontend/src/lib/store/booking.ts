import { create } from 'zustand';

interface BookingState {
    // ZIP validation
    zipCode: string | null;
    isZipValid: boolean;

    // Service selection
    selectedServiceId: string | null;
    selectedAddOnIds: string[];

    // Date/time
    selectedDate: string | null;
    selectedTimeWindow: 'morning' | 'afternoon' | 'evening' | null;

    // Customer info
    customerInfo: {
        name: string;
        email: string;
        phone: string;
        address: string;
    } | null;

    // Actions
    setZipCode: (zip: string) => void;
    setZipValid: (valid: boolean) => void;
    selectService: (serviceId: string) => void;
    toggleAddOn: (addOnId: string) => void;
    selectDateTime: (date: string, timeWindow: 'morning' | 'afternoon' | 'evening') => void;
    setCustomerInfo: (info: BookingState['customerInfo']) => void;
    resetBooking: () => void;
}

const initialState = {
    zipCode: null,
    isZipValid: false,
    selectedServiceId: null,
    selectedAddOnIds: [],
    selectedDate: null,
    selectedTimeWindow: null,
    customerInfo: null,
};

export const useBookingStore = create<BookingState>((set) => ({
    ...initialState,

    setZipCode: (zip) => set({ zipCode: zip }),

    setZipValid: (valid) => set({ isZipValid: valid }),

    selectService: (serviceId) => set({ selectedServiceId: serviceId }),

    toggleAddOn: (addOnId) => set((state) => ({
        selectedAddOnIds: state.selectedAddOnIds.includes(addOnId)
            ? state.selectedAddOnIds.filter(id => id !== addOnId)
            : [...state.selectedAddOnIds, addOnId],
    })),

    selectDateTime: (date, timeWindow) => set({
        selectedDate: date,
        selectedTimeWindow: timeWindow,
    }),

    setCustomerInfo: (info) => set({ customerInfo: info }),

    resetBooking: () => set(initialState),
}));
