"use client";

import React, { createContext, useCallback, useContext, useState, useRef, ReactNode, useEffect } from "react";
import {
  normalizeVehicleBodyStyle,
  type VehicleBodyStyle,
} from "@/types/vehicle";

// ── sessionStorage helpers (SSR-safe) ────────────────────────────────────────
const SS_KEY = 'dtailwash_booking_state';

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

function getStableCatalogId(item: { id: string | number; catalogId?: number }): string | number | undefined {
  return item.catalogId ?? (typeof item.id === 'number' ? item.id : undefined);
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
  id?: string;
  make: string;
  model: string;
  year: string;
  color: string;
  type?: VehicleBodyStyle;
}

export interface VehiclePriceLine {
  index: number;
  vehicleId?: string;
  bodyStyle: VehicleBodyStyle;
  priceSource: 'override' | 'base';
  servicePriceCents: number;
  addOnsPriceCents: number;
  totalCents: number;
  servicePrice: number;
  addOnsPrice: number;
  total: number;
}

export interface BookingPriceQuote {
  service: {
    id: string | number;
    documentId: string | null;
    name: string;
    basePriceCents: number;
  };
  vehicles: VehiclePriceLine[];
  subtotalCents: number;
  serviceFeeCents: number;
  totalCents: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  currency: 'usd';
  pricingRevision: string;
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

  // Vehicle info — single vehicle (backwards compat, reflects first vehicle)
  vehicleInfo: VehicleInfo | null;

  // Multi-vehicle booking — array of vehicles for one appointment
  bookingVehicles: VehicleInfo[];
  addBookingVehicle: (vehicle: VehicleInfo) => void;
  removeBookingVehicle: (index: number) => void;
  selectedBodyStyle: VehicleBodyStyle | null;
  setSelectedBodyStyle: (style: VehicleBodyStyle) => void;

  // Pricing (per vehicle — multiply by vehicleCount for group total)
  subtotal: number;
  serviceFee: number;
  total: number;
  priceQuote: BookingPriceQuote | null;
  pricingRevision: string | null;
  quoteStatus: 'idle' | 'loading' | 'ready' | 'error';
  quoteError: string | null;
  refreshPriceQuote: () => Promise<BookingPriceQuote | null>;
  applyPriceQuote: (quote: BookingPriceQuote) => void;

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
  const [priceQuote, setPriceQuote] = useState<BookingPriceQuote | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const quoteRequestId = useRef(0);

  // Customer contact info
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  // Vehicle info
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);

  // Multi-vehicle booking
  const [bookingVehicles, setBookingVehicles] = useState<VehicleInfo[]>([]);
  const [selectedBodyStyle, setSelectedBodyStyleState] = useState<VehicleBodyStyle | null>(null);

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
    const bv = ssGet<VehicleInfo[]>('bookingVehicles');
    const step = ssGet<number>('currentStep');
    const storedQuote = ssGet<BookingPriceQuote>('priceQuote');
    const storedBodyStyle = ssGet<unknown>('selectedBodyStyle');

    if (svc) setSelectedService(svc);
    if (addOns) setSelectedAddOns(addOns);
    if (loc) setCustomerLocation(loc);
    if (dateStr) setSelectedDate(new Date(dateStr));
    if (tw) setSelectedTimeWindow(tw);
    if (ci) setCustomerInfo(ci);
    const normalizedVehicle = vi
      ? { ...vi, type: normalizeVehicleBodyStyle(vi.type) }
      : null;
    const normalizedBookingVehicles = bv?.map((vehicle) => ({
      ...vehicle,
      type: normalizeVehicleBodyStyle(vehicle.type),
    })) ?? [];
    if (normalizedVehicle) setVehicleInfo(normalizedVehicle);
    if (normalizedBookingVehicles.length > 0) {
      setBookingVehicles(normalizedBookingVehicles);
      if (!normalizedVehicle) setVehicleInfo(normalizedBookingVehicles[0]);
    }
    if (step) setCurrentStep(step);
    if (storedBodyStyle) {
      setSelectedBodyStyleState(normalizeVehicleBodyStyle(storedBodyStyle));
    } else if (normalizedBookingVehicles[0]) {
      setSelectedBodyStyleState(normalizedBookingVehicles[0].type);
    } else if (normalizedVehicle) {
      setSelectedBodyStyleState(normalizedVehicle.type);
    }
    if (storedQuote) {
      setPriceQuote(storedQuote);
      setSubtotal(storedQuote.subtotal);
      setServiceFee(storedQuote.serviceFee);
      setTotal(storedQuote.total);
    }

    // Recalculate pricing from restored state
    if (svc && !storedQuote) {
      calculateTotalWithService(svc, addOns ?? []);
    }

    setIsHydrated(true);
  }, []);

  // Action: Set service (adapted from Uber clone's driver selection)
  const setService = (service: Service) => {
    setSelectedService(service);
    setPriceQuote(null);
    ssSave({ selectedService: service, priceQuote: null });
    calculateTotalWithService(service, selectedAddOns, bookingVehicles.length);
  };

  // Action: Add add-on
  const addAddOn = (addOn: AddOn) => {
    const newAddOns = [...selectedAddOns, addOn];
    setSelectedAddOns(newAddOns);
    ssSave({ selectedAddOns: newAddOns });
    setPriceQuote(null);
    ssSave({ priceQuote: null });
    calculateTotalWithService(selectedService, newAddOns, bookingVehicles.length);
  };

  // Action: Remove add-on
  const removeAddOn = (addOnId: string | number) => {
    const newAddOns = selectedAddOns.filter((a) => a.id !== addOnId);
    setSelectedAddOns(newAddOns);
    ssSave({ selectedAddOns: newAddOns });
    setPriceQuote(null);
    ssSave({ priceQuote: null });
    calculateTotalWithService(selectedService, newAddOns, bookingVehicles.length);
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
    addOns: AddOn[],
    vehicleCount = 1,
  ) => {
    if (!service) {
      setSubtotal(0);
      setServiceFee(0);
      setTotal(0);
      return;
    }

    const servicePrice = service.basePrice;
    const addOnsTotal = addOns.reduce((sum, addon) => sum + addon.price, 0);
    const newSubtotal = (servicePrice + addOnsTotal) * Math.max(vehicleCount, 1);

    // Service fee removed - included in base price
    const newServiceFee = 0;
    const newTotal = newSubtotal;

    setSubtotal(newSubtotal);
    setServiceFee(newServiceFee);
    setTotal(newTotal);
  };

  // Action: Calculate total (public interface)
  const calculateTotal = () => {
    calculateTotalWithService(selectedService, selectedAddOns, bookingVehicles.length);
  };

  const applyPriceQuote = useCallback((quote: BookingPriceQuote) => {
    setPriceQuote(quote);
    setSubtotal(quote.subtotal);
    setServiceFee(quote.serviceFee);
    setTotal(quote.total);
    setQuoteStatus('ready');
    setQuoteError(null);
    ssSave({ priceQuote: quote });
  }, []);

  const refreshPriceQuote = useCallback(async (): Promise<BookingPriceQuote | null> => {
    const requestId = ++quoteRequestId.current;
    if (!selectedService) return null;

    const vehicles = bookingVehicles.length > 0
      ? bookingVehicles.map((vehicle) => ({
          vehicleId: vehicle.id,
          bodyStyle: normalizeVehicleBodyStyle(vehicle.type),
        }))
      : vehicleInfo
        ? [{
            vehicleId: vehicleInfo.id,
            bodyStyle: normalizeVehicleBodyStyle(vehicleInfo.type),
          }]
        : selectedBodyStyle
          ? [{ bodyStyle: selectedBodyStyle }]
          : [];

    if (vehicles.length === 0) {
      setPriceQuote(null);
      setQuoteStatus('idle');
      setQuoteError(null);
      calculateTotalWithService(selectedService, selectedAddOns, 1);
      ssSave({ priceQuote: null });
      return null;
    }

    setQuoteStatus('loading');
    setQuoteError(null);

    try {
      const response = await fetch('/api/booking/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: getStableCatalogId(selectedService),
          serviceName: selectedService.name,
          addOnIds: selectedAddOns
            .map(getStableCatalogId)
            .filter((id): id is string | number => id !== undefined),
          zipCode: customerLocation?.zipCode,
          vehicles,
        }),
      });

      if (!response.ok) {
        const payload: { error?: string | Record<string, string[]> } = await response.json();
        const message = typeof payload.error === 'string'
          ? payload.error
          : 'Unable to refresh pricing';
        throw new Error(message);
      }

      const payload: {
        service: BookingPriceQuote['service'];
        vehicles: VehiclePriceLine[];
        breakdown: {
          subtotalCents: number;
          serviceFeeCents: number;
          totalCents: number;
        };
        subtotal: number;
        serviceFee: number;
        total: number;
        currency: 'usd';
        pricingRevision: string;
      } = await response.json();

      const quote: BookingPriceQuote = {
        service: payload.service,
        vehicles: payload.vehicles,
        subtotalCents: payload.breakdown.subtotalCents,
        serviceFeeCents: payload.breakdown.serviceFeeCents,
        totalCents: payload.breakdown.totalCents,
        subtotal: payload.subtotal,
        serviceFee: payload.serviceFee,
        total: payload.total,
        currency: payload.currency,
        pricingRevision: payload.pricingRevision,
      };
      if (requestId !== quoteRequestId.current) return null;
      applyPriceQuote(quote);
      return quote;
    } catch (error) {
      if (requestId !== quoteRequestId.current) return null;
      setQuoteStatus('error');
      setQuoteError(error instanceof Error ? error.message : 'Unable to refresh pricing');
      return null;
    }
  }, [applyPriceQuote, bookingVehicles, customerLocation?.zipCode, selectedAddOns, selectedBodyStyle, selectedService, vehicleInfo]);

  useEffect(() => {
    if (!isHydrated) return;
    void refreshPriceQuote();
  }, [isHydrated, refreshPriceQuote]);

  // Wrap the raw setters so they also persist to sessionStorage
  const setCustomerInfoPersisted = (info: CustomerInfo) => {
    setCustomerInfo(info);
    ssSave({ customerInfo: info });
  };

  const setVehicleInfoPersisted = (info: VehicleInfo) => {
    const normalized = { ...info, type: normalizeVehicleBodyStyle(info.type) };
    setVehicleInfo(normalized);
    setSelectedBodyStyleState(normalized.type);
    setPriceQuote(null);
    ssSave({ vehicleInfo: normalized, selectedBodyStyle: normalized.type, priceQuote: null });
  };

  const setSelectedBodyStyle = (style: VehicleBodyStyle) => {
    setSelectedBodyStyleState(style);
    setPriceQuote(null);
    ssSave({ selectedBodyStyle: style, priceQuote: null });
  };

  const addBookingVehicle = (vehicle: VehicleInfo) => {
    setBookingVehicles(prev => {
      const normalized = { ...vehicle, type: normalizeVehicleBodyStyle(vehicle.type) };
      const next = [...prev, normalized];
      setPriceQuote(null);
      calculateTotalWithService(selectedService, selectedAddOns, next.length);
      ssSave({ bookingVehicles: next, priceQuote: null });
      // Keep vehicleInfo in sync with first vehicle
      if (next.length === 1) {
        setVehicleInfo(normalized);
        setSelectedBodyStyleState(normalized.type);
        ssSave({ vehicleInfo: normalized, selectedBodyStyle: normalized.type });
      }
      return next;
    });
  };

  const removeBookingVehicle = (index: number) => {
    setBookingVehicles(prev => {
      const next = prev.filter((_, i) => i !== index);
      setPriceQuote(null);
      calculateTotalWithService(selectedService, selectedAddOns, next.length);
      ssSave({ bookingVehicles: next, priceQuote: null });
      // Keep vehicleInfo in sync
      if (next.length > 0) {
        setVehicleInfo(next[0]);
        setSelectedBodyStyleState(normalizeVehicleBodyStyle(next[0].type));
        ssSave({ vehicleInfo: next[0], selectedBodyStyle: normalizeVehicleBodyStyle(next[0].type) });
      } else {
        setVehicleInfo(null);
        setSelectedBodyStyleState(null);
        ssSave({ vehicleInfo: null, selectedBodyStyle: null });
      }
      return next;
    });
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
    setPriceQuote(null);
    setQuoteStatus('idle');
    setQuoteError(null);
    setCustomerInfo(null);
    setVehicleInfo(null);
    setBookingVehicles([]);
    setSelectedBodyStyleState(null);
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
    bookingVehicles,
    addBookingVehicle,
    removeBookingVehicle,
    selectedBodyStyle,
    setSelectedBodyStyle,
    subtotal,
    serviceFee,
    total,
    priceQuote,
    pricingRevision: priceQuote?.pricingRevision ?? null,
    quoteStatus,
    quoteError,
    refreshPriceQuote,
    applyPriceQuote,
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
