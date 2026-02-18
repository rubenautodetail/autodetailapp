import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type RequestStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceRequest {
  id: string;
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

// Helper to map Supabase booking to ServiceRequest
function mapBookingToRequest(booking: any): ServiceRequest {
  return {
    id: booking.id.toString(),
    customerId: booking.customer_email || 'guest',
    customerName: booking.customer_name || 'Guest Customer',
    vehicleId: 'V-N/A',
    vehicleName: `${booking.vehicle_year || ''} ${booking.vehicle_type || 'Vehicle'} ${booking.vehicle_color || ''}`.trim(),
    serviceId: 'S-N/A',
    serviceName: 'Auto Detailing', // Booking table doesn't have names, just IDs
    address: `${booking.address || ''}, ${booking.city || ''}, ${booking.state || ''} ${booking.zip_code || ''}`.trim(),
    estimatedTotal: typeof booking.total_amount === 'string' ? parseFloat(booking.total_amount) : (booking.total_amount || 0),
    notes: booking.special_instructions,
    status: (booking.status as RequestStatus) || 'pending',
    timestamp: booking.created_at || new Date().toISOString(),
  };
}

export function ContractorProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Fetch
  useEffect(() => {
    async function fetchBookings() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
      } else if (data) {
        setRequests(data.map(mapBookingToRequest));
      }
      setIsLoading(false);
    }

    fetchBookings();

    // Set up Real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRequest = mapBookingToRequest(payload.new);
            setRequests(prev => [newRequest, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedRequest = mapBookingToRequest(payload.new);
            setRequests(prev => prev.map(req =>
              req.id === updatedRequest.id ? updatedRequest : req
            ));
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(req => req.id !== payload.old.id.toString()));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, status: RequestStatus) => {
    const supabase = createClient();

    // Optimistic update
    const prevRequests = [...requests];
    setRequests(prev => prev.map(req =>
      req.id === id ? { ...req, status } : req
    ));

    const { error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', parseInt(id));

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
