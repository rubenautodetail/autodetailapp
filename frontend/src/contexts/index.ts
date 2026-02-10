// Central export for all contexts
export { BookingProvider, useBooking } from "./BookingContext";
export { ContractorProvider, useContractor } from "./ContractorContext";
export { AuthProvider, useAuth } from "./AuthContext";

export type { Service, AddOn, Location, TimeWindow } from "./BookingContext";
export type { Contractor } from "./ContractorContext";
export type { User } from "./AuthContext";
