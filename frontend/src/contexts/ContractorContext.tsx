import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type RequestStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceRequest {
  id: string;
  confirmationCode?: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  vehicleName: string; // e.g. "Tesla Model 3"
  serviceId: string;
  serviceName: string;
  address: string;
  estimatedTotal: number;
  notes?: string;
  status: RequestStatus;
  timestamp: string; // ISO date
}

interface ContractorContextType {
  requests: ServiceRequest[];
  updateStatus: (id: string, status: RequestStatus) => Promise<void>;
  getRequestsByStatus: (status: RequestStatus | RequestStatus[]) => ServiceRequest[];
  isLoading: boolean;
}

const ContractorContext = createContext<ContractorContextType | undefined>(undefined);

interface BookingRow {
  id: string | number;
  confirmation_code?: string | null;
  customer_email?: string | null;
  customer_name?: string | null;
  vehicle_year?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  service_name?: string | null;
  total_amount?: string | number | null;
  special_instructions?: string | null;
  status?: string | null;
  created_at?: string | null;
  contractor_id?: string | null;
}

// Helper to map Supabase booking to ServiceRequest
function mapBookingToRequest(booking: BookingRow): ServiceRequest {
  // Build vehicle name from individual columns; fall back gracefully
  const vehicleParts = [
    booking.vehicle_year,
    booking.vehicle_make,
    booking.vehicle_model,
    booking.vehicle_color,
  ].filter(Boolean);
  const vehicleName = vehicleParts.length > 0 ? vehicleParts.join(' ') : 'Vehicle';

  // Build address string, filtering empty parts
  const addressParts = [
    booking.address,
    booking.city,
    booking.state,
    booking.zip_code,
  ].filter(Boolean);
  const address = addressParts.join(', ');

  return {
    id: booking.id.toString(),
    confirmationCode: booking.confirmation_code || undefined,
    customerId: booking.customer_email || 'guest',
    customerName: booking.customer_name || 'Guest Customer',
    vehicleId: 'V-N/A',
    vehicleName,
    serviceId: 'S-N/A',
    serviceName: booking.service_name || 'Auto Detailing',
    address,
    estimatedTotal: (typeof booking.total_amount === 'string'
      ? parseFloat(booking.total_amount)
      : (Number(booking.total_amount) || 0)) * 0.70,
    notes: booking.special_instructions || undefined,
    status: (booking.status as RequestStatus) || 'pending',
    timestamp: booking.created_at || new Date().toISOString(),
  };
}

export function ContractorProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();
  const contractorId = profile?.id;

  // Initial Fetch — only this contractor's bookings
  useEffect(() => {
    if (!contractorId) return;

    async function fetchBookings() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('contractor_id', contractorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
      } else if (data) {
        setRequests((data as BookingRow[]).map(mapBookingToRequest));
      }
      setIsLoading(false);
    }

    fetchBookings();

    // Re-fetch when window regains focus (e.g. returning from job details)
    // Throttled: skip if last fetch was < 5 seconds ago
    let lastFetchTime = Date.now();
    const handleFocus = () => {
        if (Date.now() - lastFetchTime < 5000) return;
        lastFetchTime = Date.now();
        fetchBookings();
    };
    window.addEventListener('focus', handleFocus);

    // Real-time subscription — filtered to this contractor's bookings only
    const supabase = createClient();
    const channel = supabase
      .channel(`bookings-contractor-${contractorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `contractor_id=eq.${contractorId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRequest = mapBookingToRequest(payload.new as BookingRow);
            setRequests(prev => [newRequest, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedRequest = mapBookingToRequest(payload.new as BookingRow);
            setRequests(prev => prev.map(req =>
              req.id === updatedRequest.id ? updatedRequest : req
            ));
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as BookingRow;
            setRequests(prev => prev.filter(req => req.id !== String(oldRow.id)));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
    };
  }, [contractorId]);

  const updateStatus = async (id: string, status: RequestStatus) => {
    const supabase = createClient();

    // Optimistic update
    const prevRequests = [...requests];
    setRequests(prev => prev.map(req =>
      req.id === id ? { ...req, status } : req
    ));

    // IDs are UUIDs — do NOT use parseInt which returns NaN for UUIDs
    // Ownership check: only update bookings assigned to this contractor
    const { error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('contractor_id', contractorId);

    if (error) {
      console.error('Error updating status:', error);
      setRequests(prevRequests); // Rollback
      throw error;
    }
  };

  const getRequestsByStatus = (status: RequestStatus | RequestStatus[]) => {
    const statuses = Array.isArray(status) ? status : [status];
    return requests.filter(req => statuses.includes(req.status));
  };

  return (
    <ContractorContext.Provider value={{ requests, updateStatus, getRequestsByStatus, isLoading }}>
      {children}
    </ContractorContext.Provider>
  );
}

export function useContractor() {
  const context = useContext(ContractorContext);
  if (context === undefined) {
    throw new Error('useContractor must be used within a ContractorProvider');
  }
  return context;
}
