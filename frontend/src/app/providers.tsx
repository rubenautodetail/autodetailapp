"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { BookingStatusProvider } from "@/contexts/BookingStatusContext";
import { ContractorProvider } from "@/contexts/ContractorContext";

/**
 * Global providers wrapper
 * Adapted from Uber clone's store pattern but using Context API
 *
 * Usage: Wrap your app layout with this component
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <BookingProvider>
        <BookingStatusProvider>
          <ContractorProvider>
            {children}
          </ContractorProvider>
        </BookingStatusProvider>
      </BookingProvider>
    </AuthProvider>
  );
}
