import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const BookingCreateSchema = z.object({
  // Core scheduling
  date: z.string().min(1, 'Date is required').refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime()) && d > new Date();
  }, 'Scheduled date must be a valid date in the future'),
  timeWindow: z.string().regex(/^(\d{2}:\d{2}|morning|afternoon|evening)$/, 'Time window must be HH:MM or morning/afternoon/evening'),

  // Location
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().regex(/^\d{5}$/, 'ZIP code must be exactly 5 digits'),

  // Customer info
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional().refine((val) => {
    if (!val) return true;
    return val.replace(/\D/g, '').length >= 10;
  }, 'Phone number must be at least 10 digits'),

  // Special instructions
  specialInstructions: z.string().optional(),

  // Pricing (computed client-side, validated server-side via DB)
  subtotal: z.number().optional(),
  serviceFee: z.number().optional(),
  total: z.number().optional(),

  // Vehicle info
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.union([z.string(), z.number()]).optional(),
  vehicleColor: z.string().optional(),

  // Service info
  serviceName: z.string().optional(),
  serviceId: uuidSchema.optional(),
  addOnIds: z.array(uuidSchema).optional(),
  vehicleId: uuidSchema.optional(),
  notes: z.string().optional(),
  locale: z.enum(['en', 'es']).optional(),
});

export type BookingCreateInput = z.infer<typeof BookingCreateSchema>;

// IDs can be numeric strings (from Supabase PKs) or UUIDs (legacy document_id references)
const flexibleIdSchema = z.string().min(1);

export const PriceCalculateSchema = z.object({
  serviceId: flexibleIdSchema,
  addOnIds: z.array(flexibleIdSchema).optional(),
  zipCode: z.string().regex(/^\d{5}$/, 'ZIP code must be exactly 5 digits').optional(),
});

export type PriceCalculateInput = z.infer<typeof PriceCalculateSchema>;
