"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Types adapted from Uber clone but for auto detailing
export interface Service {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  basePrice: number;
  duration: number; // in minutes
  image?: string;
}

export interface AddOn {
  id: string;
  name: string;
  nameEs: string;
  price: number;
  description?: string;
  descriptionEs?: string;
}

export interface Location {
  address: string;
  zipCode: string;
  latitude: number;
  longitude: number;
}

export interface TimeWindow {
  slot: "morning" | "afternoon" | "evening";
  label: string;
  labelEs: string;
  range: string;
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

  // Pricing
  subtotal: number;
  serviceFee: number;
  total: number;

  // Booking step tracking
  currentStep: number;

  // Actions - adapted from Uber clone's Zustand actions
  setService: (service: Service) => void;
  addAddOn: (addOn: AddOn) => void;
  removeAddOn: (addOnId: string) => void;
  setLocation: (location: Location) => void;
  setSchedule: (date: Date, timeWindow: TimeWindow) => void;
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
  const removeAddOn = (addOnId: string) => {
    const newAddOns = selectedAddOns.filter((a) => a.id !== addOnId);
    setSelectedAddOns(newAddOns);
    calculateTotalWithService(selectedService, newAddOns);
  };

  // Action: Set location (adapted from Uber clone's setUserLocation)
  const setLocation = (location: Location) => {
    setCustomerLocation(location);
    // Clear schedule if location changes (same pattern as Uber clone)
    if (selectedDate || selectedTimeWindow) {
      setSelectedDate(null);
      setSelectedTimeWindow(null);
    }
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
    setCurrentStep((prev) => Math.min(prev + 1, 5)); // Max 5 steps
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
  };

  const value: BookingContextType = {
    selectedService,
    selectedAddOns,
    customerLocation,
    selectedDate,
    selectedTimeWindow,
    subtotal,
    serviceFee,
    total,
    currentStep,
    setService,
    addAddOn,
    removeAddOn,
    setLocation,
    setSchedule,
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
