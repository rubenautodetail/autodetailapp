"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// Types adapted from Uber clone's Driver types
export interface Contractor {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage?: string;
  rating: number;
  totalJobs: number;
  serviceZipCodes: string[];
  homeBase: {
    latitude: number;
    longitude: number;
  };
  availability: {
    [date: string]: {
      morning: boolean;
      afternoon: boolean;
      evening: boolean;
    };
  };
  // Calculated fields (from Uber clone's marker data)
  distance?: number; // miles from customer
  estimatedArrival?: number; // minutes
}

interface ContractorContextType {
  // Available contractors (like Uber clone's drivers array)
  availableContractors: Contractor[];

  // Selected contractor (like Uber clone's selectedDriver)
  selectedContractor: Contractor | null;

  // Assigned contractor (after booking confirmed)
  assignedContractor: Contractor | null;

  // Loading state
  isLoadingContractors: boolean;

  // Actions - adapted from Uber clone's DriverStore
  setAvailableContractors: (contractors: Contractor[]) => void;
  setSelectedContractor: (contractor: Contractor | null) => void;
  setAssignedContractor: (contractor: Contractor | null) => void;
  clearSelectedContractor: () => void;

  // Fetch contractors by ZIP and date/time
  fetchAvailableContractors: (
    zipCode: string,
    date: Date,
    timeWindow: string
  ) => Promise<void>;
}

const ContractorContext = createContext<ContractorContextType | undefined>(
  undefined
);

export const ContractorProvider = ({ children }: { children: ReactNode }) => {
  const [availableContractors, setAvailableContractors] = useState<Contractor[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [assignedContractor, setAssignedContractor] = useState<Contractor | null>(null);
  const [isLoadingContractors, setIsLoadingContractors] = useState(false);

  // Action: Clear selected contractor (same as Uber clone)
  const clearSelectedContractor = () => {
    setSelectedContractor(null);
  };

  // Action: Fetch available contractors
  // Adapted from Uber clone's useFetch<Driver[]> pattern
  const fetchAvailableContractors = async (
    zipCode: string,
    date: Date,
    timeWindow: string
  ) => {
    setIsLoadingContractors(true);
    try {
      // Call Strapi API to get available contractors
      const response = await fetch(
        `/api/contractors/available?zipCode=${zipCode}&date=${date.toISOString()}&timeWindow=${timeWindow}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch contractors");
      }

      const data = await response.json();
      setAvailableContractors(data.contractors || []);
    } catch (error) {
      console.error("Error fetching contractors:", error);
      setAvailableContractors([]);
    } finally {
      setIsLoadingContractors(false);
    }
  };

  const value: ContractorContextType = {
    availableContractors,
    selectedContractor,
    assignedContractor,
    isLoadingContractors,
    setAvailableContractors,
    setSelectedContractor,
    setAssignedContractor,
    clearSelectedContractor,
    fetchAvailableContractors,
  };

  return (
    <ContractorContext.Provider value={value}>
      {children}
    </ContractorContext.Provider>
  );
};

// Custom hook (same pattern as Uber clone's useDriverStore)
export const useContractor = () => {
  const context = useContext(ContractorContext);
  if (context === undefined) {
    throw new Error("useContractor must be used within a ContractorProvider");
  }
  return context;
};
