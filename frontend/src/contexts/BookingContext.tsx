"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Types adapted from Uber clone but for auto detailing
export interface Service {
  id: string | number;
  documentId: string;
  strapiId?: number;
  name: string;
  description: string;
  basePrice: number;
  duration: number; // in minutes
  image?: string;
}

export interface AddOn {
  id: string | number;
  documentId: string;
  strapiId?: number;
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
  slot: "morning" | "afternoon" | "evening";
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

  // Action: Set service (adapted from Uber clone's driver selection)
  const setService = (service: Service) => {
    setSelectedService(service);
    // Auto-calculate when service changes
    calculateTotalWithService(service, selectedAddOns);
  };

  // Action: Add add-on
  const addAddOn = (addOn: AddOn) => {
    const newAddOns = [...selectedAddOns, addOn];
    setSelectedAddOns(newAddOns);
    calculateTotalWithService(selectedService, newAddOns);
  };

  // Action: Remove add-on
  const removeAddOn = (addOnId: string | number) => {
    const newAddOns = selectedAddOns.filter((a) => a.id !== addOnId);
    setSelectedAddOns(newAddOns);
    calculateTotalWithService(selectedService, newAddOns);
  };

  // Action: Set location (adapted from Uber clone's setUserLocation)
  const setLocation = (location: Location) => {
    setCustomerLocation(location);
    // Note: removed schedule clearing logic as precise location is now entered after scheduling
  };

  // Action: Set schedule
  const setSchedule = (date: Date, timeWindow: TimeWindow) => {
    setSelectedDate(date);
    setSelectedTimeWindow(timeWindow);
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

    // 5% service fee (same as Uber clone model)
    const newServiceFee = newSubtotal * 0.05;
    const newTotal = newSubtotal + newServiceFee;

    setSubtotal(newSubtotal);
    setServiceFee(newServiceFee);
    setTotal(newTotal);
  };

  // Action: Calculate total (public interface)
  const calculateTotal = () => {
    calculateTotalWithService(selectedService, selectedAddOns);
  };

  // Navigation actions
  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 6)); // Max 6 steps
  };

  const previousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1)); // Min step 1
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
    paymentStatus,
    paymentIntentId,
    setPaymentStatus,
    setPaymentIntentId,
    setService,
    addAddOn,
    removeAddOn,
    setLocation,
    setSchedule,
    setCustomerInfo,
    setVehicleInfo,
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
