// Central export for all contexts
export { BookingProvider, useBooking } from "./BookingContext";
export { ContractorProvider, useContractor } from "./ContractorContext";
export { AuthProvider, useAuth } from "./AuthContext";

export type { Service, AddOn, Location, TimeWindow, CustomerInfo, VehicleInfo } from "./BookingContext";
export type { User } from "./AuthContext";
