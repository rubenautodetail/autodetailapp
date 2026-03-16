"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// ── sessionStorage helpers (SSR-safe) ────────────────────────────────────────
const SS_KEY = 'rubens_booking_state';

function ssGet<T>(field: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return (obj[field] ?? null) as T;
  } catch { return null; }
}

function ssSave(updates: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    sessionStorage.setItem(SS_KEY, JSON.stringify({ ...existing, ...updates }));
  } catch { /* ignore quota errors */ }
}

function ssClear() {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(SS_KEY); } catch { /* ignore */ }
}

// Types adapted from Uber clone but for auto detailing
export interface Service {
  id: string | number;
  documentId: string;
  catalogId?: number;
  name: string;
  description: string;
  basePrice: number;
  duration: number; // in minutes
  image?: string;
}

export interface AddOn {
  id: string | number;
  documentId: string;
  catalogId?: number;
  name: string;
  price: number;
  description?: string;
}


export interface Location {
  address: string;
  city?: string;
  state?: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface TimeWindow {
  slot: string;
  label: string;
  labelEs: string;
  range: string;
  rangeEs: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  specialNotes: string;
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  color: string;
  type?: 'sedan' | 'suv' | 'truck' | 'coupe' | 'van' | 'other';
}

interface BookingContextType {
  // Service selection
  selectedService: Service | null;
  selectedAddOns: AddOn[];

  // Location
  customerLocation: Location | null;

  // Scheduling
  selectedDate: Date | null;
  selectedTimeWindow: TimeWindow | null;

  // Customer contact info (collected on review page, used on payment page)
  customerInfo: CustomerInfo | null;

  // Vehicle info (collected on details page, used on payment page)
  vehicleInfo: VehicleInfo | null;

  // Pricing
  subtotal: number;
  serviceFee: number;
  total: number;

  // Booking step tracking
  currentStep: number;

  // Hydration flag — true once sessionStorage state has been restored
  isHydrated: boolean;

  // Payment state
  paymentStatus: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';
  paymentIntentId: string | null;
  setPaymentStatus: (status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded') => void;
  setPaymentIntentId: (id: string) => void;

  // Actions - adapted from Uber clone's Zustand actions
  setService: (service: Service) => void;
  addAddOn: (addOn: AddOn) => void;
  removeAddOn: (addOnId: string | number) => void;
  setLocation: (location: Location) => void;
  setSchedule: (date: Date, timeWindow: TimeWindow) => void;
  setCustomerInfo: (info: CustomerInfo) => void;
  setVehicleInfo: (info: VehicleInfo) => void;
  calculateTotal: () => void;
  nextStep: () => void;
  previousStep: () => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Provider component
export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [customerLocation, setCustomerLocation] = useState<Location | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<TimeWindow | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Pricing state
  const [subtotal, setSubtotal] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [total, setTotal] = useState(0);

  // Customer contact info
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  // Vehicle info
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);

  // Payment state
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'paid' | 'failed' | 'refunded'>('pending');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Hydration flag — prevents redirect guards from firing before sessionStorage is restored
  const [isHydrated, setIsHydrated] = useState(false);

  // ── Restore state from sessionStorage on mount ─────────────────────────────
  useEffect(() => {
    const svc = ssGet<Service>('selectedService');
    const addOns = ssGet<AddOn[]>('selectedAddOns');
    const loc = ssGet<Location>('customerLocation');
    const dateStr = ssGet<string>('selectedDate');
    const tw = ssGet<TimeWindow>('selectedTimeWindow');
    const ci = ssGet<CustomerInfo>('customerInfo');
    const vi = ssGet<VehicleInfo>('vehicleInfo');
    const step = ssGet<number>('currentStep');

    if (svc) setSelectedService(svc);
    if (addOns) setSelectedAddOns(addOns);
    if (loc) setCustomerLocation(loc);
    if (dateStr) setSelectedDate(new Date(dateStr));
    if (tw) setSelectedTimeWindow(tw);
    if (ci) setCustomerInfo(ci);
    if (vi) setVehicleInfo(vi);
    if (step) setCurrentStep(step);

    // Recalculate pricing from restored state
    if (svc) {
      calculateTotalWithService(svc, addOns ?? []);
    }

    setIsHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Action: Set service (adapted from Uber clone's driver selection)
  const setService = (service: Service) => {
    setSelectedService(service);
    ssSave({ selectedService: service });
    calculateTotalWithService(service, selectedAddOns);
  };

  // Action: Add add-on
  const addAddOn = (addOn: AddOn) => {
    const newAddOns = [...selectedAddOns, addOn];
    setSelectedAddOns(newAddOns);
    ssSave({ selectedAddOns: newAddOns });
    calculateTotalWithService(selectedService, newAddOns);
  };

  // Action: Remove add-on
  const removeAddOn = (addOnId: string | number) => {
    const newAddOns = selectedAddOns.filter((a) => a.id !== addOnId);
    setSelectedAddOns(newAddOns);
    ssSave({ selectedAddOns: newAddOns });
    calculateTotalWithService(selectedService, newAddOns);
  };

  // Action: Set location (adapted from Uber clone's setUserLocation)
  const setLocation = (location: Location) => {
    setCustomerLocation(location);
    ssSave({ customerLocation: location });
  };

  // Action: Set schedule
  const setSchedule = (date: Date, timeWindow: TimeWindow) => {
    setSelectedDate(date);
    setSelectedTimeWindow(timeWindow);
    ssSave({ selectedDate: date.toISOString(), selectedTimeWindow: timeWindow });
  };

  // Helper function for calculating total
  const calculateTotalWithService = (
    service: Service | null,
    addOns: AddOn[]
  ) => {
    if (!service) {
      setSubtotal(0);
      setServiceFee(0);
      setTotal(0);
      return;
    }

    const servicePrice = service.basePrice;
    const addOnsTotal = addOns.reduce((sum, addon) => sum + addon.price, 0);
    const newSubtotal = servicePrice + addOnsTotal;

    // Service fee removed - included in base price
    const newServiceFee = 0;
    const newTotal = newSubtotal;

    setSubtotal(newSubtotal);
    setServiceFee(newServiceFee);
    setTotal(newTotal);
  };

  // Action: Calculate total (public interface)
  const calculateTotal = () => {
    calculateTotalWithService(selectedService, selectedAddOns);
  };

  // Wrap the raw setters so they also persist to sessionStorage
  const setCustomerInfoPersisted = (info: CustomerInfo) => {
    setCustomerInfo(info);
    ssSave({ customerInfo: info });
  };

  const setVehicleInfoPersisted = (info: VehicleInfo) => {
    setVehicleInfo(info);
    ssSave({ vehicleInfo: info });
  };

  // Navigation actions
  const nextStep = () => {
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, 5); // Max 5 steps
      ssSave({ currentStep: next });
      return next;
    });
  };

  const previousStep = () => {
    setCurrentStep((prev) => {
      const next = Math.max(prev - 1, 1);
      ssSave({ currentStep: next });
      return next;
    });
  };

  // Action: Reset booking (like Uber clone's navigation reset)
  const resetBooking = () => {
    setSelectedService(null);
    setSelectedAddOns([]);
    setCustomerLocation(null);
    setSelectedDate(null);
    setSelectedTimeWindow(null);
    setCurrentStep(1);
    setSubtotal(0);
    setServiceFee(0);
    setTotal(0);
    setCustomerInfo(null);
    setVehicleInfo(null);
    setPaymentStatus('pending');
    setPaymentIntentId(null);
    ssClear(); // wipe persisted state so next booking starts fresh
  };

  const value: BookingContextType = {
    selectedService,
    selectedAddOns,
    customerLocation,
    selectedDate,
    selectedTimeWindow,
    customerInfo,
    vehicleInfo,
    subtotal,
    serviceFee,
    total,
    currentStep,
    isHydrated,
    paymentStatus,
    paymentIntentId,
    setPaymentStatus,
    setPaymentIntentId,
    setService,
    addAddOn,
    removeAddOn,
    setLocation,
    setSchedule,
    setCustomerInfo: setCustomerInfoPersisted,
    setVehicleInfo: setVehicleInfoPersisted,
    calculateTotal,
    nextStep,
    previousStep,
    resetBooking,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

// Custom hook (same pattern as Uber clone's useLocationStore)
export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};
