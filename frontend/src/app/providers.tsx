"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { BookingStatusProvider } from "@/contexts/BookingStatusContext";

/**
 * Global providers — AuthProvider wraps everything so any page can call useAuth().
 * ContractorProvider is scoped to the /contractor layout only.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <BookingProvider>
        <BookingStatusProvider>
          {children}
        </BookingStatusProvider>
      </BookingProvider>
    </AuthProvider>
  );
}
