# SOP: Detailing on Demand Platform Development

## Project Overview (500+ words)

**Client:** OAC Digital client
**Project Type:** Mobile Car Detailing Booking Platform (B2C Marketplace)
**Development Method:** AI-assisted development using LLM code generation tools (Cursor, Bolt, v0, etc.)
**Tech Stack:** Strapi (Headless CMS), Stripe (Payments), React/Next.js (Frontend), Node.js (Backend APIs)
**Languages:** Fully bilingual - English and Spanish

### What We Are Building

This platform is a comprehensive on-demand mobile car detailing marketplace that connects customers who need their vehicles detailed at home with independent detailing contractors who service specific geographic zones. The system functions similarly to Uber but for car detailing services - customers book services online, the platform automatically assigns available contractors based on location and availability, payments are processed with automatic commission splits, and all parties receive real-time notifications throughout the service lifecycle.

### Core Business Model

The platform operates on a commission-based revenue model where:
- **Customers** pay upfront for detailing services via credit card
- **The Platform** retains a configurable commission percentage (e.g., 15-25%)
- **Contractors** receive automatic payouts for their portion after commission deduction
- All financial transactions are automated through Stripe Connect for seamless multi-party payments

### Three User Roles

1. **Customers (End Users):** Browse services, enter location (ZIP code or geolocation), select detailing packages and add-ons, choose appointment windows, pay online, receive notifications, and leave reviews after service completion.

2. **Contractors (Service Providers):** Register with documentation and coverage zones, receive job notifications in their service areas, accept/reject assignments, manage their daily schedule, upload before/after photos, and track earnings with automated payouts.

3. **Platform Administrator:** Oversees all operations through a comprehensive dashboard, manages contractor approvals and performance, configures service zones and pricing, sets commission rates, monitors quality through reviews, and generates business intelligence reports (revenue, bookings by zone, cancellations, customer satisfaction).

### Key Differentiators

**Geographic Intelligence:** The system uses ZIP code validation and geolocation to ensure customers only see available services in their area and contractors only receive jobs they can physically service. This prevents booking failures and optimizes contractor utilization.

**Automated Assignment Logic:** When a customer books, the platform evaluates all contractors covering that ZIP code, checks their availability for the requested time window, considers their performance ratings and proximity, then either auto-assigns to the best candidate or broadcasts to multiple contractors with first-come-first-served acceptance.

**Quality Assurance System:** Each service includes a digital checklist that contractors must complete, mandatory before/after photo uploads for documentation and dispute resolution, and a customer review system that directly impacts contractor ranking and future assignment priority.

**Flexible Service Structure:** Base packages (Interior Detail, Exterior Detail, Full Detail) with customizable add-ons (pet hair removal, tough stain treatment, headlight restoration) allow dynamic pricing and upselling opportunities while contractors see exactly what's included in each job.

**Communication Automation:** Reduces administrative overhead through automated SMS/email notifications at every stage - booking confirmation, 24-hour reminder, "contractor en route" alert, service completion notification, and review requests. Contractors receive daily schedule summaries and real-time job offers.

### Technical Architecture Approach

The platform will be built as a modern headless architecture:
- **Strapi CMS** manages all content (service descriptions, pricing, zone configurations, contractor profiles, customer data)
- **Custom APIs** handle business logic (booking engine, assignment algorithm, notification triggers, payment processing)
- **Stripe Integration** processes payments, manages marketplace commissions via Stripe Connect, and handles contractor payouts
- **Frontend Application** (React/Next.js) provides responsive bilingual interfaces for customers, contractors, and administrators
- **i18n Implementation** ensures all UI elements, notifications, and content are fully available in English and Spanish with easy language switching

This system eliminates manual coordination, reduces no-shows through prepayment, ensures contractor accountability through documentation, and provides the administrator with complete operational visibility and control.

---

## SOP Part 1: Development Structure & Architecture

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                       │
│  Next.js/React - Responsive & Bilingual                 │
│  ├─ Customer Portal (Public)                           │
│  ├─ Contractor Dashboard (Auth Required)               │
│  └─ Admin Panel (Auth Required)                        │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                     API LAYER                           │
│  Custom Node.js/Express APIs                            │
│  ├─ Booking Engine API                                 │
│  ├─ Assignment Algorithm API                           │
│  ├─ Notification Service API                           │
│  ├─ Payment Processing API (Stripe)                    │
│  └─ Analytics & Reporting API                          │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   DATA/CMS LAYER                        │
│  Strapi Headless CMS + PostgreSQL                       │
│  ├─ Content Management (Services, Zones, Pricing)      │
│  ├─ User Management (Customers, Contractors, Admins)   │
│  ├─ Booking Records                                    │
│  └─ Reviews & Media Storage                            │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                       │
│  ├─ Stripe Connect (Payments & Payouts)               │
│  ├─ Twilio (SMS Notifications)                         │
│  ├─ SendGrid/AWS SES (Email Notifications)            │
│  └─ Google Maps API (Geolocation & ZIP Validation)    │
└─────────────────────────────────────────────────────────┘
```

### Development Phases

**Phase 1: Foundation Setup (Week 1-2)**
- Initialize Strapi CMS with PostgreSQL database
- Set up Next.js frontend with bilingual routing (i18n)
- Configure Stripe Connect account for marketplace payments
- Establish development, staging, production environments

**Phase 2: Core Booking System (Week 3-5)**
- Build customer-facing service selection interface
- Implement ZIP code validation and geolocation features
- Create calendar/time slot selection with availability checking
- Develop Stripe payment integration with customer checkout flow

**Phase 3: Contractor Management (Week 6-7)**
- Build contractor registration and onboarding workflow
- Create contractor dashboard with job queue and schedule
- Implement acceptance/rejection system for job assignments
- Develop photo upload and checklist completion features

**Phase 4: Assignment & Automation (Week 8-9)**
- Code automated assignment algorithm (zone matching, availability, ratings)
- Build notification service (SMS via Twilio, Email via SendGrid)
- Implement commission calculation and payout automation
- Create status tracking system (booked → assigned → en route → completed)

**Phase 5: Admin & Analytics (Week 10-11)**
- Build administrator dashboard with KPI overview
- Implement zone and pricing configuration tools
- Create contractor management interface (approval, suspension, performance)
- Develop reporting system (revenue, bookings, quality metrics)

**Phase 6: Quality & Polish (Week 12-13)**
- Implement review and rating system for contractors
- Add cancellation/rescheduling policies with automated fee handling
- Build customer profile with booking history
- Complete bilingual content translation and testing

**Phase 7: Testing & Launch (Week 14-15)**
- End-to-end testing of booking flow in both languages
- Payment processing testing (test mode → live mode)
- Load testing for concurrent bookings
- Soft launch with limited ZIP codes, then scale

---

## SOP Part 2: Detailed Development Requirements

### Component 1: Online Booking System with ZIP Validation

**Objective:** Allow customers to check service availability in their area and initiate bookings

**Technical Requirements:**
- **ZIP Code Input Field** with real-time validation against service coverage database
- **Geolocation Button** that requests browser location permission and auto-fills ZIP
- **Coverage Check Logic:** Query Strapi for active contractors serving that ZIP code
- **Unavailable ZIP Handling:** Display "We're not in your area yet - join waitlist" with email capture
- **Mobile-First Design:** Responsive form that works seamlessly on phones (primary device)

**API Endpoints Needed:**
```
POST /api/validate-zip
Body: { zipCode: "33186" }
Response: { available: true, contractors: 5, nextAvailableDate: "2024-01-15" }

POST /api/geolocation
Body: { latitude: 25.7617, longitude: -80.1918 }
Response: { zipCode: "33186", available: true }
```

**Strapi Collections:**
- `ServiceZones`: ZIP code, coverage radius, active status, assigned contractors
- `Contractors`: Service areas (array of ZIP codes), availability calendar

**User Experience Flow:**
1. Customer lands on homepage
2. Prominent "Enter Your Location" section above the fold
3. Customer enters ZIP or clicks "Use My Location"
4. System checks coverage in <1 second
5. If available: Shows "We service your area! Choose your detail package"
6. If unavailable: "Not in your area yet - be notified when we launch" with email signup

**Bilingual Considerations:**
- All labels, buttons, error messages in English/Spanish based on user's language selection
- ZIP code field accepts both "ZIP Code" (EN) and "Código Postal" (ES) labels
- Geolocation permission prompt respects browser language settings

---

### Component 2: Service Selection & Add-Ons

**Objective:** Present clear service packages with customizable extras and dynamic pricing

**Service Structure:**
```
BASE PACKAGES:
├─ Interior Detail ($80-120)
│  └─ Vacuum, dashboard, door panels, windows, air freshener
├─ Exterior Detail ($100-150)
│  └─ Hand wash, wheels/tires, wax, chrome polish, glass
└─ Full Detail ($180-250)
   └─ Complete interior + exterior treatment

ADD-ONS (upsells):
├─ Pet Hair Removal (+$25)
├─ Tough Stain Treatment (+$30)
├─ Headlight Restoration (+$40)
├─ Engine Bay Cleaning (+$50)
└─ Ceramic Coating (+$150)
```

**Technical Implementation:**
- **Strapi Content Type:** `Services` with fields: name (localized), description (localized), basePrice, duration, checklist (JSON), addOns (relation)
- **Strapi Content Type:** `AddOns` with fields: name (localized), price, description (localized), applicableServices (relation)
- **Frontend Component:** Card-based layout with service images, "What's Included" expandable sections
- **Dynamic Pricing Display:** Real-time total calculation as customer selects/deselects add-ons
- **Mobile UX:** Sticky footer showing running total and "Continue" button

**Pricing Logic:**
```javascript
// Example pricing calculation
const calculateTotal = (baseService, selectedAddOns, zipCode) => {
  let total = baseService.basePrice;
  
  // Apply zone-specific pricing adjustments
  const zonePricing = getZonePricing(zipCode);
  total *= zonePricing.multiplier; // e.g., 1.1 for premium areas
  
  // Add selected add-ons
  selectedAddOns.forEach(addon => {
    total += addon.price;
  });
  
  // Calculate platform fee (shown to customer)
  const serviceFee = total * 0.05; // 5% service fee
  
  return {
    subtotal: total,
    serviceFee: serviceFee,
    total: total + serviceFee,
    contractorEarnings: total * (1 - platformCommission) // Not shown to customer
  };
};
```

**API Endpoints:**
```
GET /api/services?zipCode=33186&lang=es
Response: [
  {
    id: "interior-detail",
    name: "Detalle Interior",
    description: "Limpieza profunda...",
    basePrice: 100,
    zonePriceMultiplier: 1.0,
    duration: 90,
    availableAddOns: ["pet-hair", "stain-removal"]
  }
]

POST /api/calculate-price
Body: { 
  serviceId: "full-detail", 
  addOnIds: ["pet-hair", "headlights"],
  zipCode: "33186"
}
Response: {
  subtotal: 205,
  serviceFee: 10.25,
  total: 215.25,
  currency: "USD"
}
```

---

### Component 3: Calendar & Time Slot Selection

**Objective:** Allow customers to choose appointment dates and time windows based on real-time contractor availability

**Time Window Options:**
- Morning: 9:00 AM - 12:00 PM
- Afternoon: 1:00 PM - 4:00 PM
- Evening: 4:00 PM - 7:00 PM (optional, based on contractor preferences)

**Technical Requirements:**

**Availability Algorithm:**
1. Customer selects service + add-ons (determines duration)
2. System calculates required time block (e.g., Full Detail = 3 hours)
3. Query all contractors covering customer's ZIP code
4. Check each contractor's calendar for open slots matching time windows
5. Return only dates/times where at least one contractor is available
6. Grey out unavailable slots in calendar UI

**Frontend Component:**
- **Calendar Library:** React-Calendar or similar with custom styling
- **Available Dates Highlighted:** Green indicator on dates with openings
- **Time Window Selection:** Radio buttons or cards showing AM/PM/EVE with availability count
- **Next Available:** Prominent button "Next Available: Tomorrow 9-12 AM" for quick booking
- **Buffer Time:** System adds 30-minute buffer between appointments for travel

**Strapi Collections:**
```
ContractorAvailability:
├─ contractor (relation to Contractors)
├─ date (date field)
├─ timeWindows (JSON): { 
│    morning: { available: true, booked: false },
│    afternoon: { available: true, booked: true },
│    evening: { available: false, blocked: true }
│  }
└─ blockedReason (string): "time off", "maintenance", "weather"

Bookings:
├─ customer (relation)
├─ contractor (relation)
├─ service (relation)
├─ date (date)
├─ timeWindow (enum: morning/afternoon/evening)
├─ status (enum: pending/confirmed/in_progress/completed/cancelled)
└─ duration (integer, minutes)
```

**API Endpoints:**
```
GET /api/availability?zipCode=33186&serviceId=full-detail&month=2024-01
Response: {
  availableDates: [
    {
      date: "2024-01-15",
      slots: [
        { window: "morning", contractorsAvailable: 3 },
        { window: "afternoon", contractorsAvailable: 1 }
      ]
    }
  ],
  nextAvailable: {
    date: "2024-01-15",
    window: "morning",
    displayText: "Tomorrow at 9:00 AM"
  }
}

POST /api/bookings/hold-slot
Body: {
  zipCode: "33186",
  date: "2024-01-15",
  timeWindow: "morning",
  duration: 180
}
Response: {
  holdToken: "temp_abc123", // Expires in 10 minutes
  expiresAt: "2024-01-14T10:10:00Z"
}
```

**User Experience:**
1. Customer sees calendar with next 30 days
2. Unavailable dates are greyed out
3. Customer clicks available date → time windows appear below
4. Customer selects time window → system creates temporary 10-minute hold on slot
5. Customer proceeds to payment → hold converts to confirmed booking
6. If customer abandons: hold expires, slot becomes available again

---

### Component 4: Stripe Payment Integration

**Objective:** Secure online payment processing with automatic commission splits to contractors

**Stripe Setup Requirements:**
- **Stripe Connect:** Platform account (OAC Digital's client)
- **Connected Accounts:** Each contractor gets a Stripe Express account
- **Payment Flow:** Charge customer → Hold funds → Release to contractor after service → Platform keeps commission

**Implementation Steps:**

**1. Stripe Connect Onboarding for Contractors:**
```javascript
// When contractor registers
const accountLink = await stripe.accountLinks.create({
  account: contractor.stripeAccountId,
  refresh_url: 'https://platform.com/contractor/onboarding/refresh',
  return_url: 'https://platform.com/contractor/dashboard',
  type: 'account_onboarding',
});
// Redirect contractor to accountLink.url to complete onboarding
```

**2. Payment Intent Creation (Customer Checkout):**
```javascript
// When customer clicks "Pay Now"
const paymentIntent = await stripe.paymentIntents.create({
  amount: 21525, // $215.25 in cents
  currency: 'usd',
  payment_method_types: ['card'],
  application_fee_amount: 3229, // 15% commission ($32.29)
  transfer_data: {
    destination: contractor.stripeAccountId, // Assigned contractor
  },
  metadata: {
    bookingId: booking.id,
    customerId: customer.id,
    contractorId: contractor.id,
    service: 'full-detail',
  },
});

// Return client_secret to frontend for Stripe Elements
```

**3. Frontend Payment Form:**
```jsx
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ clientSecret, bookingTotal }) => {
  const stripe = useStripe();
  const elements = useElements();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: {
          name: customer.name,
          email: customer.email,
        },
      },
    });
    
    if (error) {
      // Show error message
    } else if (paymentIntent.status === 'succeeded') {
      // Booking confirmed! Redirect to confirmation page
      confirmBooking(paymentIntent.id);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        Pay ${bookingTotal}
      </button>
    </form>
  );
};
```

**4. Webhook Handling (Backend):**
```javascript
// Listen for Stripe events
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Update booking status to "paid"
      updateBooking(event.data.object.metadata.bookingId, { 
        status: 'confirmed',
        paidAt: new Date(),
        paymentIntentId: event.data.object.id
      });
      
      // Send confirmation notifications
      sendCustomerConfirmation();
      sendContractorJobNotification();
      break;
      
    case 'transfer.paid':
      // Contractor payout completed
      updateContractorBalance();
      sendContractorPaymentNotification();
      break;
  }
  
  res.json({received: true});
});
```

**Payment Security:**
- **PCI Compliance:** Stripe handles all card data, never touches your servers
- **3D Secure:** Automatically triggered for cards requiring authentication
- **Fraud Detection:** Stripe Radar enabled for all transactions
- **Refund Policy:** Implemented in Strapi, triggered by admin or automated rules

**API Endpoints:**
```
POST /api/payments/create-intent
Body: {
  bookingId: "book_123",
  amount: 21525,
  contractorId: "cont_456"
}
Response: {
  clientSecret: "pi_abc_secret_xyz",
  publishableKey: "pk_live_..."
}

POST /api/payments/confirm
Body: {
  paymentIntentId: "pi_abc123",
  bookingId: "book_123"
}
Response: {
  success: true,
  booking: { id: "book_123", status: "confirmed" },
  confirmationCode: "DTL-20240115-0842"
}
```

**Billing & Receipts:**
- Customer receives itemized receipt via email (Stripe Receipt + Custom PDF)
- Contractor sees earnings breakdown in dashboard (Gross - Commission - Stripe Fees = Net)
- Admin dashboard shows: Total Revenue, Platform Commission, Contractor Payouts, Stripe Fees

---

### Component 5: Automated Contractor Assignment System

**Objective:** Intelligently match each booking with the best available contractor based on zone, availability, performance, and proximity

**Assignment Algorithm Logic:**

**Step 1: Filter by Zone Coverage**
```sql
SELECT * FROM contractors 
WHERE status = 'active' 
AND '33186' = ANY(service_zip_codes)
AND onboarding_complete = true
```

**Step 2: Check Availability**
```javascript
const availableContractors = filteredContractors.filter(contractor => {
  // Check if contractor has availability for the requested date/time window
  const schedule = contractor.availability[bookingDate];
  return schedule && schedule[timeWindow].available && !schedule[timeWindow].booked;
});
```

**Step 3: Calculate Ranking Score**
```javascript
const rankedContractors = availableContractors.map(contractor => {
  let score = 0;
  
  // Performance metrics (40% weight)
  score += contractor.averageRating * 8; // 0-5 rating = 0-40 points
  
  // Reliability (30% weight)
  score += contractor.completionRate * 30; // 0-100% = 0-30 points
  
  // Response time (15% weight)
  const avgResponseMinutes = contractor.avgAcceptanceTime;
  score += Math.max(0, 15 - (avgResponseMinutes / 10)); // Faster = more points
  
  // Proximity to customer (15% weight)
  const distance = calculateDistance(contractor.homeBase, customer.address);
  score += Math.max(0, 15 - (distance / 2)); // Closer = more points
  
  return { contractor, score };
}).sort((a, b) => b.score - a.score);
```

**Step 4: Assignment Strategy (Configurable)**

**Strategy A: Auto-Assignment (Recommended)**
```javascript
// Automatically assign to highest-ranked contractor
const selectedContractor = rankedContractors[0].contractor;

await createBooking({
  contractor: selectedContractor,
  status: 'confirmed',
  assignedAt: new Date()
});

await sendNotification({
  to: selectedContractor,
  type: 'new_job_assigned',
  booking: booking
});
```

**Strategy B: Broadcast to Multiple (Competitive)**
```javascript
// Send job offer to top 3 contractors
const topContractors = rankedContractors.slice(0, 3);

topContractors.forEach(({ contractor }) => {
  sendNotification({
    to: contractor,
    type: 'job_offer',
    booking: booking,
    expiresIn: 300 // 5 minutes to accept
  });
});

// First to accept wins
// Others receive "job_filled" notification
```

**Step 5: Fallback Handling**
```javascript
// If no contractors available for requested time:
if (availableContractors.length === 0) {
  // Option 1: Suggest next available slot
  const nextAvailable = findNextAvailability(booking.zipCode, booking.service);
  return {
    success: false,
    suggestedAlternative: nextAvailable,
    message: "No contractors available for your selected time. We have openings on {date} at {time}."
  };
  
  // Option 2: Waitlist the booking
  await createWaitlistEntry(booking);
  notifyAdminOfCapacityIssue(booking.zipCode, booking.date);
}

// If contractor rejects or doesn't respond:
setTimeout(() => {
  if (booking.status === 'pending_acceptance') {
    reassignToNextContractor(booking);
  }
}, 15 * 60 * 1000); // 15-minute timeout
```

**Strapi Collections for Assignment:**
```
Contractors:
├─ service_zip_codes (JSON array): ["33186", "33155", "33143"]
├─ home_base (JSON): { lat: 25.76, lng: -80.19 }
├─ average_rating (float): 4.7
├─ completion_rate (float): 0.95
├─ total_jobs (integer): 143
├─ avg_acceptance_time (integer, seconds): 420
├─ status (enum): active/inactive/suspended
└─ performance_tier (enum): standard/preferred/elite

AssignmentLogs:
├─ booking (relation)
├─ attempted_contractors (JSON array): [{ id, score, accepted, timestamp }]
├─ final_assignment (relation to Contractor)
├─ assignment_strategy (string): "auto" / "broadcast"
├─ assignment_duration (integer, seconds)
└─ notes (text)
```

**API Endpoints:**
```
POST /api/assignments/find-contractor
Body: {
  bookingId: "book_123",
  zipCode: "33186",
  date: "2024-01-15",
  timeWindow: "morning",
  serviceId: "full-detail"
}
Response: {
  assigned: true,
  contractor: {
    id: "cont_456",
    name: "Juan Pérez",
    rating: 4.8,
    estimatedArrival: "9:00 AM",
    phone: "+1-305-***-**89" // Masked until booking confirmed
  },
  assignmentMethod: "auto"
}

POST /api/assignments/contractor-response
Body: {
  bookingId: "book_123",
  contractorId: "cont_456",
  action: "accept" | "reject",
  rejectReason: "schedule_conflict" (if reject)
}
Response: {
  success: true,
  booking: { status: "confirmed" },
  nextSteps: "Customer has been notified. You will receive full details 1 hour before service."
}
```

**Admin Configuration (in Strapi Admin Panel):**
- Assignment strategy selector: Auto vs. Broadcast
- Timeout durations: How long to wait for contractor response
- Fallback rules: What happens when no one is available
- Performance thresholds: Minimum rating to receive jobs (e.g., must have 4.0+ rating)
- Geographic priorities: Prefer contractors within X miles

---

### Component 6: Contractor Registration & Manual Onboarding

**Objective:** Allow administrators to invite and manually verify contractors before they can receive jobs

**Registration Flow:**

**Step 1: Admin Sends Invitation**
```javascript
// Admin panel action
POST /api/contractors/send-invitation
Body: {
  email: "detailer@example.com",
  name: "Carlos Mendoza",
  phone: "+1-305-555-1234",
  serviceZipCodes: ["33186", "33155", "33143"],
  notes: "Referred by existing contractor"
}

// System sends email with unique registration link
// Link expires in 7 days
```

**Step 2: Contractor Completes Registration Form**

**Required Information:**
- **Personal Info:** Full name, phone, email, home address (for proximity calculations)
- **Business Info:** Business name (if applicable), EIN or SSN for tax purposes
- **Service Areas:** Select ZIP codes they want to cover (multi-select from available zones)
- **Availability:** Default weekly schedule (which time windows they work)
- **Vehicle Info:** Make, model, year (for insurance verification)

**Required Documents (Upload):**
- Driver's License (front and back)
- Vehicle Insurance Certificate
- Business License (if applicable)
- Background Check Consent Form (e-signed)

**Step 3: Stripe Connect Onboarding**
```javascript
// After contractor submits registration
const stripeAccount = await stripe.accounts.create({
  type: 'express',
  country: 'US',
  email: contractor.email,
  capabilities: {
    transfers: { requested: true }
  },
  business_type: 'individual',
  metadata: {
    contractorId: contractor.id,
    platform: 'detailing-platform'
  }
});

// Create onboarding link
const accountLink = await stripe.accountLinks.create({
  account: stripeAccount.id,
  refresh_url: `${baseUrl}/contractor/onboarding/refresh`,
  return_url: `${baseUrl}/contractor/onboarding/complete`,
  type: 'account_onboarding',
});

// Redirect contractor to Stripe to enter banking info
```

**Step 4: Admin Review & Approval**

**Admin Panel View:**
```
Pending Contractors:
┌─────────────────────────────────────────────────────┐
│ Carlos Mendoza                        [View Details] │
│ Email: carlos@example.com                           │
│ Zones: 33186, 33155, 33143                         │
│ Submitted: 2024-01-10 2:30 PM                      │
│                                                     │
│ Documents:                                          │
│ ✓ Driver's License                                 │
│ ✓ Vehicle Insurance                                │
│ ✓ Background Check Consent                         │
│ ⚠ Business License (Not required)                   │
│                                                     │
│ Stripe Connect: ✓ Complete                         │
│                                                     │
│ [Approve] [Request More Info] [Reject]             │
└─────────────────────────────────────────────────────┘
```

**Admin Actions:**
- **Approve:** Contractor becomes active, can start receiving jobs
- **Request More Info:** Send message to contractor asking for clarification/additional docs
- **Reject:** Contractor marked as rejected with reason (saved for reference)

**Step 5: Contractor Activation**
```javascript
// When admin clicks "Approve"
await updateContractor(contractorId, {
  status: 'active',
  approvedAt: new Date(),
  approvedBy: adminId,
  onboarding_complete: true
});

// Send welcome email with dashboard access
sendEmail({
  to: contractor.email,
  template: 'contractor-approved',
  data: {
    name: contractor.name,
    dashboardUrl: `${baseUrl}/contractor/dashboard`,
    supportEmail: 'support@platform.com'
  }
});

// Send SMS confirmation
sendSMS({
  to: contractor.phone,
  message: `Welcome to the team, ${contractor.name}! You're now approved to receive detailing jobs. Log in at: ${baseUrl}/contractor`
});
```

**Strapi Collections:**
```
Contractors:
├─ name (string)
├─ email (string, unique)
├─ phone (string)
├─ home_address (JSON): { street, city, state, zip, coordinates }
├─ service_zip_codes (JSON array)
├─ default_availability (JSON): {
│    monday: { morning: true, afternoon: true, evening: false },
│    tuesday: { ... }
│  }
├─ stripe_account_id (string)
├─ stripe_onboarding_complete (boolean)
├─ documents (media, multiple)
├─ status (enum): pending/active/inactive/suspended/rejected
├─ approval_notes (text)
├─ approved_at (datetime)
├─ approved_by (relation to Admin User)
└─ created_at (datetime)

ContractorInvitations:
├─ email (string)
├─ token (string, unique)
├─ expires_at (datetime)
├─ used (boolean)
├─ used_at (datetime)
└─ sent_by (relation to Admin User)
```

**API Endpoints:**
```
POST /api/contractors/register
Body: {
  token: "invite_abc123",
  personalInfo: { name, email, phone, address },
  businessInfo: { businessName, ein },
  serviceZipCodes: ["33186", "33155"],
  availability: { monday: {...}, tuesday: {...} },
  vehicleInfo: { make, model, year }
}
Response: {
  success: true,
  contractorId: "cont_456",
  nextStep: "stripe_onboarding",
  stripeOnboardingUrl: "https://connect.stripe.com/..."
}

POST /api/contractors/:id/approve
Body: { notes: "All documents verified" }
Response: {
  success: true,
  contractor: { status: "active", approvedAt: "2024-01-11T14:30:00Z" }
}
```

**Security Considerations:**
- Registration links expire after 7 days
- Document uploads stored securely in S3 or Strapi media library with access controls
- Admin-only access to review sensitive documents
- Background checks processed through third-party API (Checkr, Sterling) - optional integration
- Two-factor authentication for contractor dashboard access (optional, recommended)

---

### Component 7: Automated Notifications (SMS & Email)

**Objective:** Keep all parties informed at every stage of the booking lifecycle without manual intervention

**Notification Triggers & Content:**

**FOR CUSTOMERS:**

**1. Booking Confirmation (Immediate after payment)**
- **Channel:** Email + SMS
- **Timing:** Within 30 seconds of payment success
- **Content:**
```
Subject: ✓ Tu Detail está confirmado - [Date] [Time Window]

Hola [Customer Name],

¡Gracias por tu reserva! Aquí están los detalles:

Servicio: Full Detail + Pet Hair Removal
Fecha: Sábado, 20 de enero, 2025
Horario: 9:00 AM - 12:00 PM
Dirección: [Customer Address]
Total Pagado: $215.25

Tu Contractor: [Assigned to best available contractor]
Recibirás una notificación con los detalles del contractor 24 horas antes del servicio.

¿Necesitas cambios? Reprograma hasta 24 horas antes sin cargo.
[Reschedule Button] | [Cancel Booking Button]

Preguntas? Responde a este email o llama al [Support Phone]

¡Nos vemos pronto!
Detailing on Demand Team
```

**2. Reminder 24 Hours Before (Automated)**
- **Channel:** Email + SMS
- **Content:**
```
SMS:
Recordatorio: Tu detail es mañana 20/01 entre 9-12 AM. 
Contractor: Carlos M. (⭐ 4.8) 
Asegúrate que tu auto esté accesible. 
Más info: [Link]

Email:
Subject: Mañana es tu Detail - Prepara tu vehículo

Hola [Name],

Tu detail está programado para mañana:
📅 Sábado, 20 de enero
⏰ 9:00 AM - 12:00 PM
📍 [Address]

Tu Contractor:
Carlos Mendoza - ⭐ 4.8 rating (125 servicios completados)
Tel: [Contractor Masked Phone]

Importante:
✓ Asegura que tu auto esté en un lugar accesible
✓ Desbloquea puertas si es necesario
✓ Remueve objetos personales del interior

Recibirás una notificación cuando Carlos esté en camino.

[View Booking Details] [Contact Support]
```

**3. Contractor En Route (When contractor clicks "On My Way")**
- **Channel:** SMS (priority) + Push notification if app exists
- **Timing:** Real-time
- **Content:**
```
SMS:
¡Carlos está en camino! 🚗
Llegada estimada: 9:15 AM (15 min)
Rastrea en tiempo real: [Tracking Link]
Contacto: [Masked Phone]
```

**4. Service Started (When contractor clicks "Start Service")**
- **Channel:** SMS
- **Content:**
```
SMS:
Tu detail ha comenzado ✨
Duración estimada: 3 horas
Recibirás fotos cuando termine.
```

**5. Service Completed (When contractor uploads photos & marks complete)**
- **Channel:** Email + SMS
- **Content:**
```
Email:
Subject: ✓ Tu Detail está completo - Mira los resultados

¡Hola [Name]!

Carlos ha completado tu Full Detail. Revisa las fotos:

[Before Photos Gallery]
[After Photos Gallery]

¿Cómo fue tu experiencia?
[Rate Service - Stars 1-5]
[Leave Review]

Tu recibo está adjunto.
Total: $215.25 (Paid)

¿Quieres programar tu próximo detail?
[Book Again - 15% Off]

Gracias por usar Detailing on Demand!

SMS:
¡Tu detail está listo! 🎉
Ve las fotos y deja tu reseña: [Link]
Reserva otra vez con 15% descuento: [Link]
```

**FOR CONTRACTORS:**

**1. New Job Assignment (Auto-assigned or broadcast accepted)**
- **Channel:** SMS + Email + Push notification
- **Timing:** Immediate
- **Content:**
```
SMS:
Nuevo trabajo asignado! 💼
📅 Sáb 20/01 - 9-12 AM
📍 33186 - [Partial Address]
💵 Ganas: $183 (después de comisión)
Servicio: Full Detail + Pet Hair
[View Full Details] [Navigate]

Email:
Subject: Nuevo Trabajo - Sábado 20/01, 9-12 AM

Detalles del Servicio:
Cliente: [Customer First Name Only]
Dirección: [Full address revealed 1 hour before service for privacy]
Fecha: Sábado, 20 de enero, 2025
Ventana horaria: 9:00 AM - 12:00 PM

Servicio Contratado:
- Full Detail (Interior + Exterior)
- Add-on: Pet Hair Removal

Duración estimada: 3 horas
Tu pago: $183.00 (Platform fee: $32.25 ya descontado)

Incluye:
☑ Aspirado completo interior
☑ Dashboard y paneles
☑ Lavado exterior a mano
☑ Encerado
☑ Llantas y rines
☑ Vidrios
☑ Remoción de pelos de mascota

Notas del cliente:
"Golden retriever - muchos pelos en asientos traseros"

[Navigate to Address] [View Checklist] [Contact Support]

Recuerda:
1. Llega dentro de la ventana horaria
2. Envía "En camino" 15-30 min antes
3. Completa el checklist
4. Sube fotos antes/después
5. Marca como terminado

¡Éxito!
```

**2. Daily Schedule Summary (Every morning at 7 AM)**
- **Channel:** SMS + Email
- **Content:**
```
SMS:
Buenos días Carlos! ☀️
Hoy tienes 3 servicios:
9-12 AM: Full Detail (33186)
1-4 PM: Exterior (33155)
4-7 PM: Interior (33186)
Total ganas hoy: $487
[View Schedule]

Email:
Subject: Tu agenda de hoy - 3 servicios

[Calendar view with all 3 jobs]
[Map showing all 3 locations with optimized route]
```

**3. Reminder 1 Hour Before Service**
- **Channel:** SMS
- **Content:**
```
Tu próximo servicio es en 1 hora:
📍 [Full Address Now Revealed]
🕐 Ventana: 9-12 AM
Cliente: [First Name + Last Initial]
[Navigate Now] [Call Customer]
```

**4. Missed Check-In Alert (If contractor doesn't mark "On My Way" 15 min into window)**
- **Channel:** SMS + Push
- **Content:**
```
⚠️ Recordatorio: Tu servicio comenzó hace 15 min
Cliente esperando en: [Address]
¿Hay algún problema?
[Mark On My Way] [Report Issue] [Call Support]
```

**5. Payment Processed (After admin review, typically next business day)**
- **Channel:** Email
- **Content:**
```
Subject: Pago procesado - $183.00 depositado

Hola Carlos,

Tu pago del servicio del 20/01 ha sido procesado:

Servicio: Full Detail + Pet Hair Removal
Cliente: [First Name + Last Initial]
Fecha: 20/01/2025
Total servicio: $215.25
Comisión plataforma (15%): -$32.25
Tu pago: $183.00

Depositado a: [Bank Last 4 Digits]
Fecha depósito: 21/01/2025

[View Transaction Details] [Download Invoice]

Balance total del mes: $1,847
[View Earnings Dashboard]
```

**FOR ADMIN:**

**1. Failed Assignment (No contractor available)**
- **Channel:** Email + Dashboard alert
- **Content:**
```
Subject: ⚠️ Booking Needs Attention - No Contractor Available

Booking ID: #DTL-20250120-0842
Customer: [Name]
Service: Full Detail
Date/Time: 20/01/2025, 9-12 AM
ZIP: 33186

Issue: No contractors available for this time slot

Available contractors in zone: 5
All have conflicts:
- Carlos M: Booked (9-12 AM)
- Juan P: Booked (9-12 AM)
- Maria G: Time off
- Luis R: Suspended (pending review)
- Ana S: Outside availability hours

Actions:
[Suggest Alternative Time to Customer]
[Manually Assign Override]
[Add to Waitlist]
[Contact Contractors for Override]

Customer already charged: $215.25
Refund deadline: [Auto-refund in 4 hours if unresolved]
```

**2. Contractor No-Show (Customer reports or contractor doesn't check in)**
- **Channel:** SMS + Email + Dashboard alert
- **Content:**
```
Subject: 🚨 URGENT: Contractor No-Show - #DTL-20250120-0842

Booking: #DTL-20250120-0842
Contractor: Carlos M
Customer: [Name] - [Phone]
Scheduled: 20/01/2025, 9-12 AM
Status: Contractor no-show (30 min past window start)

Actions Taken:
✓ Customer notified and apology sent
✓ Full refund initiated ($215.25)
✓ $25 service credit issued

Required Actions:
1. [Contact Contractor] - Find out what happened
2. [Reassign to Available Contractor] - Emergency booking
3. [Review Contractor Performance] - Consider suspension

Customer feedback: [Link to conversation]
```

**3. Low Rating Alert (Contractor receives <3 stars)**
- **Channel:** Email
- **Content:**
```
Subject: Performance Alert - Carlos M received 2-star review

Contractor: Carlos Mendoza
Recent Service: #DTL-20250120-0842
Customer Rating: ⭐⭐ (2.0/5)
Overall Rating Impact: 4.8 → 4.7

Customer Feedback:
"Arrived 45 minutes late, didn't complete interior dashboard cleaning, and left early. Disappointing."

Contractor's Response: [None yet]

Actions:
[Contact Contractor for Explanation]
[Review Service Photos]
[Issue Partial Refund to Customer]
[Add to Performance Improvement Plan]

Previous issues: 
- 1 late arrival (last month)
- 0 cancellations
- 143 total jobs, 4.7 avg rating
```

**Technical Implementation:**

**Notification Service Architecture:**
```javascript
// Centralized notification service
class NotificationService {
  async sendNotification(event, recipient, data) {
    const template = this.getTemplate(event, recipient.language);
    
    // Send via multiple channels based on priority
    if (event.priority === 'urgent') {
      await this.sendSMS(recipient.phone, template.sms, data);
      await this.sendPush(recipient.deviceTokens, template.push, data);
    }
    
    await this.sendEmail(recipient.email, template.email, data);
    
    // Log for audit trail
    await this.logNotification(event, recipient, data);
  }
  
  getTemplate(event, language) {
    // Load templates from Strapi CMS (editable by admin)
    return strapi.notificationTemplates.findOne({
      event: event,
      language: language
    });
  }
}

// Event listeners trigger notifications
eventEmitter.on('booking.confirmed', async (booking) => {
  await notificationService.sendNotification(
    'booking.confirmed',
    booking.customer,
    {
      serviceName: booking.service.name,
      date: booking.date,
      timeWindow: booking.timeWindow,
      address: booking.address,
      total: booking.total
    }
  );
});
```

**Strapi Collections:**
```
NotificationTemplates:
├─ event (string): "booking.confirmed", "contractor.assigned", etc.
├─ recipient_type (enum): customer/contractor/admin
├─ language (enum): en/es
├─ channels (JSON): { sms: true, email: true, push: false }
├─ sms_template (text, Handlebars syntax)
├─ email_subject (string)
├─ email_body_html (richtext, Handlebars)
├─ push_title (string)
├─ push_body (text)
└─ variables (JSON): ["customerName", "serviceName", "date", ...]

NotificationLogs:
├─ event (string)
├─ recipient (relation to User/Contractor)
├─ channels_sent (JSON): { sms: true, email: true }
├─ status (JSON): { sms: "delivered", email: "opened" }
├─ sent_at (datetime)
└─ data (JSON): {...}
```

**Integration with Twilio (SMS):**
```javascript
const twilio = require('twilio')(accountSid, authToken);

async function sendSMS(to, message) {
  try {
    const result = await twilio.messages.create({
      body: message,
      from: '+1-305-XXX-XXXX', // Your Twilio number
      to: to
    });
    
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('SMS failed:', error);
    return { success: false, error: error.message };
  }
}
```

**Integration with SendGrid (Email):**
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, html) {
  const msg = {
    to: to,
    from: 'noreply@detailingplatform.com',
    subject: subject,
    html: html,
  };
  
  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('Email failed:', error);
    return { success: false, error: error.message };
  }
}
```

**API Endpoints:**
```
POST /api/notifications/send
Body: {
  event: "booking.confirmed",
  recipientId: "cust_123",
  recipientType: "customer",
  data: { bookingId: "book_456", serviceName: "Full Detail" }
}

GET /api/notifications/logs?recipientId=cust_123
Response: [
  {
    event: "booking.confirmed",
    sentAt: "2024-01-14T15:30:00Z",
    channels: { sms: "delivered", email: "opened" }
  }
]
```

---

### Component 8: Dashboards for All User Types

**A. CUSTOMER DASHBOARD**

**Objective:** Allow customers to manage bookings, view history, and rebook services

**Dashboard Sections:**

**1. Upcoming Bookings Card**
```
┌────────────────────────────────────────────┐
│ Próximo Servicio                           │
├────────────────────────────────────────────┤
│ Full Detail + Pet Hair Removal             │
│ 📅 Sábado, 20 de enero, 2025              │
│ ⏰ 9:00 AM - 12:00 PM                      │
│ 📍 [Your Address]                          │
│                                            │
│ Contractor: Carlos M. (⭐ 4.8)             │
│ Estado: Confirmado ✓                       │
│                                            │
│ [Ver Detalles] [Reprogramar] [Cancelar]   │
└────────────────────────────────────────────┘
```

**2. Booking History Table**
```
Historial de Servicios:
┌──────────┬─────────────────┬──────────────┬────────┬────────┐
│ Fecha    │ Servicio        │ Contractor   │ Total  │ Estado │
├──────────┼─────────────────┼──────────────┼────────┼────────┤
│ 15/12/24 │ Exterior Detail │ Juan P. (4.9)│ $120   │ ⭐⭐⭐⭐⭐│
│ 03/11/24 │ Full Detail     │ Maria G.(4.7)│ $200   │ ⭐⭐⭐⭐ │
│ 20/09/24 │ Interior Detail │ Luis R. (4.5)│ $95    │ ⭐⭐⭐⭐⭐│
└──────────┴─────────────────┴──────────────┴────────┴────────┘
[View Receipt] [Book Again] [Leave Review]
```

**3. Quick Rebook Section**
```
┌────────────────────────────────────────────┐
│ Reserva Rápida - Tus Favoritos            │
├────────────────────────────────────────────┤
│ [ Full Detail - $200 ]                     │
│   Último: 03/11/24 con Maria G.           │
│   [Book Same Service]                      │
│                                            │
│ [ Exterior Detail - $120 ]                 │
│   Último: 15/12/24 con Juan P.            │
│   [Book Same Service]                      │
└────────────────────────────────────────────┘
```

**4. Saved Vehicles (Optional Feature)**
```
Mis Vehículos:
┌────────────────────────────────────────────┐
│ 🚗 2020 Honda Civic (Rojo)                 │
│    Última limpieza: 15/12/24              │
│    Próximo recomendado: 15/02/25          │
│    [Schedule Service]                      │
│                                            │
│ 🚙 2018 Toyota RAV4 (Gris)                 │
│    Última limpieza: 03/11/24              │
│    [Schedule Service]                      │
│                                            │
│ [+ Add Vehicle]                            │
└────────────────────────────────────────────┘
```

**5. Payment Methods & Billing**
```
Métodos de Pago:
┌────────────────────────────────────────────┐
│ Visa •••• 4242 (Default)                   │
│ Exp: 12/26                                 │
│ [Edit] [Remove]                            │
│                                            │
│ [+ Add New Card]                           │
└────────────────────────────────────────────┘

Facturas:
- Invoice #DTL-0120-2025 ($215.25) [Download PDF]
- Invoice #DTL-1215-2024 ($120.00) [Download PDF]
```

**B. CONTRACTOR DASHBOARD**

**Objective:** Centralized hub for contractors to manage daily operations, view earnings, and track performance

**Dashboard Sections:**

**1. Today's Schedule (Priority View)**
```
┌────────────────────────────────────────────────────────────┐
│ Mi Agenda de Hoy - Sábado, 20 de enero                    │
├────────────────────────────────────────────────────────────┤
│ 9:00 AM - 12:00 PM                           [En Progreso] │
│ Full Detail + Pet Hair Removal                             │
│ Cliente: Ana M. (Primera vez)                              │
│ 📍 123 Main St, Miami FL 33186                            │
│ 💵 Ganas: $183                                             │
│ Notas: "Golden retriever - muchos pelos traseros"         │
│                                                            │
│ [📍 Navigate] [📞 Call] [✓ Mark Complete]                 │
│                                                            │
│ Checklist: [3/8 items completed]                          │
│ ☑ Vacuum interior                                         │
│ ☑ Clean dashboard                                         │
│ ☑ Wash exterior                                           │
│ ☐ Wax exterior                                            │
│ ☐ Clean wheels                                            │
│ ☐ Detail chrome                                           │
│ ☐ Clean windows                                           │
│ ☐ Remove pet hair                                         │
│                                                            │
│ [Upload Before Photos] [Upload After Photos]              │
├────────────────────────────────────────────────────────────┤
│ 1:00 PM - 4:00 PM                              [Upcoming]  │
│ Exterior Detail                                            │
│ Cliente: Roberto S.                                        │
│ 📍 456 Oak Ave, Miami FL 33155                            │
│ 💵 Ganas: $102                                             │
│                                                            │
│ [View Details] [Navigate]                                 │
└────────────────────────────────────────────────────────────┘
```

**2. Earnings Summary**
```
┌────────────────────────────────────────────┐
│ Ganancias                                  │
├────────────────────────────────────────────┤
│ Hoy:              $285 (2 servicios)       │
│ Esta Semana:      $1,247 (9 servicios)    │
│ Este Mes:         $3,892 (28 servicios)   │
│                                            │
│ Próximo Pago: $1,847                       │
│ Fecha: 25/01/2025                          │
│                                            │
│ [Ver Detalles de Pagos] [Tax Documents]   │
└────────────────────────────────────────────┘
```

**3. Performance Metrics**
```
┌────────────────────────────────────────────┐
│ Mi Desempeño                               │
├────────────────────────────────────────────┤
│ Calificación Promedio: ⭐⭐⭐⭐⭐ 4.8/5.0      │
│ Servicios Completados: 143                 │
│ Tasa de Finalización: 98%                 │
│ Puntualidad: 95% (on-time arrival)        │
│                                            │
│ Ranking en tu zona: #2 de 12 contractors  │
│ Status: ⭐ Preferred Contractor            │
│                                            │
│ [View Reviews] [Performance Report]        │
└────────────────────────────────────────────┘
```

**4. Availability Calendar**
```
Disponibilidad:
┌────────────────────────────────────────────┐
│     Lun   Mar   Mié   Jue   Vie   Sáb     │
│ AM   ✓     ✓     ✓     ✓     ✓     ✓      │
│ PM   ✓     ✓     ✗     ✓     ✓     ✓      │
│ EVE  ✗     ✗     ✗     ✗     ✓     ✓      │
│                                            │
│ [Edit Availability] [Request Time Off]     │
└────────────────────────────────────────────┘
```

**5. New Job Offers (If using broadcast strategy)**
```
┌────────────────────────────────────────────┐
│ Ofertas de Trabajo (1 Pendiente)          │
├────────────────────────────────────────────┤
│ Interior Detail                            │
│ Lunes, 22 de enero - 9-12 AM              │
│ ZIP: 33186 (2.3 miles from you)           │
│ Ganas: $68                                 │
│ Expira en: 4 min 23 seg ⏱                 │
│                                            │
│ [✓ Accept Job] [✗ Decline]                │
└────────────────────────────────────────────┘
```

**C. ADMIN DASHBOARD**

**Objective:** Comprehensive operations overview, management tools, and business intelligence

**Dashboard Sections:**

**1. Overview KPIs (Top of page)**
```
┌────────────────────────────────────────────────────────────────────┐
│ Today: Jan 20, 2025                          [Filter: Last 7 Days] │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📅 42 Bookings      💰 $8,947 Revenue    ⭐ 4.7 Avg Rating        │
│  (+12% vs last week) (+8% vs last week)   (↓0.1 vs last week)     │
│                                                                     │
│  👷 18 Active         🚫 3 Cancellations  📊 94% Completion Rate   │
│  Contractors          (7% cancel rate)    (target: 95%)            │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

**2. Real-Time Bookings Map**
```
┌────────────────────────────────────────────┐
│ [Interactive Map of Miami-Dade]            │
│                                            │
│  🟢 = In Progress (5)                      │
│  🟡 = Upcoming Today (8)                   │
│  🔵 = Scheduled (29)                       │
│  🔴 = Issue/Late (1)                       │
│                                            │
│  [Zoom to 33186] [Filter by Status]       │
└────────────────────────────────────────────┘
```

**3. Recent Bookings Table**
```
Reservas Recientes:
┌──────────┬──────────────┬──────────────┬──────────────┬────────────┬────────┐
│ ID       │ Cliente      │ Servicio     │ Contractor   │ Estado     │ Total  │
├──────────┼──────────────┼──────────────┼──────────────┼────────────┼────────┤
│ #0842    │ Ana M.       │ Full Detail  │ Carlos M.    │ In Progress│ $215   │
│ #0841    │ Luis G.      │ Exterior     │ Juan P.      │ Completed  │ $120   │
│ #0840    │ Maria S.     │ Interior     │ [Pending]    │ ⚠️ No Match │ $95    │
│ #0839    │ Roberto F.   │ Full Detail  │ Maria G.     │ Scheduled  │ $200   │
└──────────┴──────────────┴──────────────┴──────────────┴────────────┴────────┘
[View] [Assign Manually] [Refund] [Contact]
```

**4. Contractor Management**
```
Contractors:
┌────────────────────────────────────────────────────────────────┐
│ Name           │ Zone  │ Rating │ Jobs │ Status  │ Actions    │
├────────────────┼───────┼────────┼──────┼─────────┼────────────┤
│ Carlos Mendoza │ 33186 │ ⭐ 4.8  │ 143  │ Active  │ [View]     │
│ Juan Pérez     │ 33155 │ ⭐ 4.9  │ 201  │ Active  │ [View]     │
│ Maria Garcia   │ 33143 │ ⭐ 4.7  │ 89   │ Active  │ [View]     │
│ Luis Rodriguez │ 33186 │ ⭐ 4.5  │ 67   │ ⚠️Review │ [View]     │
│ Ana Sanchez    │ 33155 │ N/A    │ 0    │ Pending │ [Approve]  │
└────────────────┴───────┴────────┴──────┴─────────┴────────────┘
[+ Invite New Contractor]
```

**5. Service Zone Configuration**
```
Zonas de Servicio:
┌────────────────────────────────────────────────────────────────┐
│ ZIP Code │ Active  │ Contractors │ Avg Price │ Actions         │
├──────────┼─────────┼─────────────┼───────────┼─────────────────┤
│ 33186    │ ✓       │ 5           │ $195      │ [Edit] [Disable]│
│ 33155    │ ✓       │ 3           │ $185      │ [Edit] [Disable]│
│ 33143    │ ✓       │ 2           │ $180      │ [Edit] [Disable]│
│ 33144    │ ✗       │ 0           │ N/A       │ [Enable]        │
└──────────┴─────────┴─────────────┴───────────┴─────────────────┘
[+ Add New Zone]

Zone Details (33186):
- Base Price Multiplier: 1.0x
- Coverage Radius: 5 miles
- Min Contractors Required: 2
- Peak Hours Pricing: +20% (Sat/Sun 9-12 AM)
[Save Changes]
```

**6. Financial Reports**
```
Financial Overview (January 2025):
┌────────────────────────────────────────────┐
│ Gross Revenue:      $47,892                │
│ Platform Commission: $7,184 (15%)          │
│ Contractor Payouts:  $40,708               │
│ Stripe Fees:         -$1,390               │
│ Net Platform Revenue: $5,794               │
│                                            │
│ [Download P&L] [Export to CSV]            │
└────────────────────────────────────────────┘

Top Performing Services:
1. Full Detail - 128 bookings ($25,600)
2. Exterior Detail - 89 bookings ($10,680)
3. Interior Detail - 63 bookings ($5,985)

[View Detailed Analytics]
```

**7. Issues & Alerts**
```
⚠️ Attention Required (3):
┌────────────────────────────────────────────────────────────┐
│ 🔴 Booking #0840 - No contractor assigned (5 min ago)     │
│    Action: [Manually Assign] [Suggest Alternative Time]   │
│                                                            │
│ 🟡 Luis Rodriguez - Low rating (4.5) - Consider review    │
│    Action: [View Performance] [Contact Contractor]        │
│                                                            │
│ 🟡 Zone 33143 - Only 2 contractors, high demand this week │
│    Action: [Recruit More] [View Analytics]                │
└────────────────────────────────────────────────────────────┘
```

**API Endpoints for Dashboards:**
```
// Customer Dashboard
GET /api/customers/:id/dashboard
Response: {
  upcomingBookings: [...],
  bookingHistory: [...],
  savedVehicles: [...],
  paymentMethods: [...]
}

// Contractor Dashboard
GET /api/contractors/:id/dashboard
Response: {
  todaySchedule: [...],
  earnings: { today, week, month, nextPayout },
  performance: { rating, completionRate, punctuality },
  availability: {...},
  pendingOffers: [...]
}

// Admin Dashboard
GET /api/admin/dashboard?startDate=2025-01-14&endDate=2025-01-20
Response: {
  kpis: { bookings, revenue, avgRating, cancellations },
  recentBookings: [...],
  contractors: [...],
  zones: [...],
  financials: {...},
  alerts: [...]
}
```

---

### Component 9: Quality Control - Checklists, Photos & Reviews

**Objective:** Ensure service quality, provide documentation for disputes, and build trust through transparency

**A. SERVICE CHECKLISTS**

**Purpose:** Standardize service delivery and ensure contractors complete all included items

**Implementation:**

**1. Define Checklists in Strapi (Per Service Type)**
```
Interior Detail Checklist:
☐ Vacuum all carpets and mats
☐ Clean dashboard and console
☐ Wipe down door panels
☐ Clean cup holders and storage
☐ Clean and condition seats
☐ Clean interior windows
☐ Apply air freshener
☐ Remove visible trash

Exterior Detail Checklist:
☐ Pre-rinse vehicle
☐ Hand wash with soap
☐ Clean wheels and tires
☐ Dry vehicle completely
☐ Apply wax/sealant
☐ Polish chrome trim
☐ Clean exterior windows
☐ Tire shine application

Add-On Checklists:
Pet Hair Removal:
☐ Deep vacuum all fabric surfaces
☐ Use pet hair removal tool on upholstery
☐ Check under seats for hidden hair
☐ Final inspection for remaining hair

Headlight Restoration:
☐ Mask surrounding areas
☐ Sand headlights (multiple grits)
☐ Polish with compound
☐ Apply UV protective coating
☐ Remove masking, inspect clarity
```

**2. Contractor Mobile Checklist Interface**
```
Service: Full Detail + Pet Hair Removal
Progress: 8/15 items (53%)

Interior (5/8):
✓ Vacuum all carpets and mats
✓ Clean dashboard and console
✓ Wipe down door panels
✓ Clean cup holders and storage
☐ Clean and condition seats [Mark Complete]
✓ Clean interior windows
☐ Apply air freshener [Mark Complete]
☐ Remove visible trash [Mark Complete]

Exterior (3/7):
✓ Pre-rinse vehicle
✓ Hand wash with soap
✓ Clean wheels and tires
☐ Dry vehicle completely [Mark Complete]
☐ Apply wax/sealant [Mark Complete]
☐ Polish chrome trim [Mark Complete]
☐ Clean exterior windows [Mark Complete]

Add-On: Pet Hair (0/4):
☐ Deep vacuum fabric surfaces [Mark Complete]
☐ Use pet hair tool [Mark Complete]
☐ Check under seats [Mark Complete]
☐ Final inspection [Mark Complete]

[Can't mark service complete until all checked]
```

**3. Admin Configuration (in Strapi)**
- Create/edit checklists for each service type
- Mark items as "Required" vs "Optional"
- Set minimum completion percentage to mark job done (e.g., 90%)
- Allow contractors to add notes for any skipped items

**B. BEFORE/AFTER PHOTOS**

**Purpose:** Document work quality, protect against disputes, showcase results for marketing

**Photo Requirements:**

**Mandatory Photos (Enforced by System):**
- Before Photos: Minimum 2 (front view, interior overview)
- After Photos: Minimum 2 (same angles as before)
- Add-On Photos: If specific add-on selected, require relevant photos
  - Example: Pet Hair Removal → Must show before/after of affected seats

**Photo Upload Interface (Contractor App):**
```
📸 Upload Photos - Step 1 of 2

Before Photos (Required):
[+] Take Photo - Front View
[+] Take Photo - Interior
[+] Take Photo - Problem Areas (Optional)

Auto-tags: 
- Date/Time: 2025-01-20 9:45 AM
- Location: GPS coordinates
- Booking ID: #DTL-0842

[Continue to After Photos]
```

```
📸 Upload Photos - Step 2 of 2

After Photos (Required):
[+] Take Photo - Front View (Match angle)
[+] Take Photo - Interior
[+] Take Photo - Results (Optional)

Tip: Try to match the angles from your before photos for best comparison.

[Submit Photos & Complete Service]
```

**Photo Storage & Processing:**
```javascript
// Backend: Handle photo uploads
async function uploadServicePhotos(bookingId, photos, type) {
  const booking = await Booking.findById(bookingId);
  
  // Upload to S3/CloudFront with optimizations
  const uploadedPhotos = await Promise.all(
    photos.map(async (photo) => {
      // Compress for web (80% quality)
      const compressed = await sharp(photo)
        .resize(1920, 1080, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      // Upload to cloud storage
      const key = `bookings/${bookingId}/${type}/${Date.now()}-${photo.originalname}`;
      const url = await s3.upload(key, compressed);
      
      // Create thumbnail for gallery
      const thumbnail = await sharp(photo)
        .resize(400, 300, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();
      const thumbnailUrl = await s3.upload(`${key}-thumb`, thumbnail);
      
      return {
        original: url,
        thumbnail: thumbnailUrl,
        uploadedAt: new Date(),
        metadata: {
          gps: photo.metadata.gps,
          timestamp: photo.metadata.timestamp
        }
      };
    })
  );
  
  // Save to booking record
  await booking.update({
    [`photos_${type}`]: uploadedPhotos
  });
  
  return uploadedPhotos;
}
```

**Photo Display (Customer View):**
```
Your Service is Complete! 🎉

Before & After Comparison:

[Slider Component]
<=====> 
[Before Photo]     [After Photo]
Drag to compare

Gallery:
[Thumbnail 1] [Thumbnail 2] [Thumbnail 3] [Thumbnail 4]

[Download All Photos] [Share on Social Media]
```

**C. CUSTOMER REVIEWS & RATINGS**

**Purpose:** Quality feedback loop, contractor accountability, customer trust building

**Review System Structure:**

**1. Review Request Trigger**
- Sent 2 hours after service completion
- Delivered via email + SMS
- Expires after 7 days (but can still be submitted later, just not prompted)

**2. Review Form:**
```
How was your service with Carlos?

Overall Rating:
⭐ ⭐ ⭐ ⭐ ⭐ (tap to rate)

Quick Ratings:
Punctuality:     ⭐⭐⭐⭐⭐
Quality:         ⭐⭐⭐⭐⭐
Professionalism: ⭐⭐⭐⭐⭐
Communication:   ⭐⭐⭐⭐⭐

What did you like? (Optional)
[Text area]

What could be improved? (Optional)
[Text area]

Would you book Carlos again?
○ Yes, definitely
○ Maybe
○ No, prefer different contractor

[Submit Review]
```

**3. Review Moderation (Admin Panel)**
```
Pending Reviews (2):
┌──────────────────────────────────────────────────────────┐
│ Ana M. → Carlos M.  |  ⭐⭐ (2/5)  |  Jan 20, 2025        │
├──────────────────────────────────────────────────────────┤
│ "Arrived late and didn't complete dashboard cleaning.   │
│  Very disappointed with the rushed service."             │
│                                                          │
│ Contractor Response: [None yet]                          │
│                                                          │
│ [✓ Approve] [✗ Flag as Inappropriate] [Contact Customer]│
└──────────────────────────────────────────────────────────┘
```

**4. Contractor Response System**
```
// Contractors can respond to reviews (within 7 days)
Review from Ana M. - ⭐⭐ (2/5)
"Arrived late and didn't complete dashboard cleaning."

Your Response (Optional):
[Text area - 500 char max]

"I sincerely apologize for arriving late due to traffic. I 
understand this affected the quality of service. I've noted 
your feedback about the dashboard and will be more thorough 
in the future. Thank you for the honest feedback."

[Submit Response]
```

**5. Review Display (Public-Facing)**
```
Carlos Mendoza - ⭐⭐⭐⭐⭐ 4.8 (143 reviews)

Recent Reviews:

⭐⭐⭐⭐⭐ Luis G. - Jan 19, 2025
"Excellent work! Carlos was on time and very detailed. 
My car looks brand new. Highly recommend!"

⭐⭐⭐⭐ Maria S. - Jan 18, 2025
"Good service overall, but took a bit longer than expected."
Carlos responded: "Thank you for your feedback! I took extra 
time to address some tough stains you mentioned. I appreciate 
your patience!"

⭐⭐ Ana M. - Jan 20, 2025
"Arrived late and rushed through the service."
Carlos responded: "I sincerely apologize for the delay..."

[Load More Reviews]
```

**6. Impact on Contractor Status**
```javascript
// Automatic performance adjustments based on reviews
async function updateContractorPerformance(contractorId) {
  const contractor = await Contractor.findById(contractorId);
  const recentReviews = await Review.find({
    contractor: contractorId,
    createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } // Last 30 days
  });
  
  const avgRating = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
  
  // Update tier based on performance
  let tier = 'standard';
  if (avgRating >= 4.8 && contractor.totalJobs >= 100) {
    tier = 'elite';
  } else if (avgRating >= 4.5 && contractor.totalJobs >= 50) {
    tier = 'preferred';
  }
  
  // Flag for review if performance drops
  if (avgRating < 4.0) {
    await createAdminAlert({
      type: 'low_performance',
      contractor: contractorId,
      message: `${contractor.name} rating dropped to ${avgRating.toFixed(1)}`,
      action: 'review_required'
    });
  }
  
  await contractor.update({
    averageRating: avgRating,
    performanceTier: tier
  });
}
```

**API Endpoints:**
```
POST /api/reviews/create
Body: {
  bookingId: "book_456",
  contractorId: "cont_123",
  rating: 5,
  quickRatings: {
    punctuality: 5,
    quality: 5,
    professionalism: 4,
    communication: 5
  },
  comment: "Great service!",
  wouldBookAgain: true
}

GET /api/contractors/:id/reviews?page=1&limit=10
Response: {
  contractor: { name: "Carlos M.", avgRating: 4.8 },
  reviews: [...],
  pagination: { page: 1, total: 143, hasMore: true }
}

POST /api/reviews/:id/respond
Body: {
  contractorId: "cont_123",
  response: "Thank you for your feedback..."
}
```

**Strapi Collections:**
```
Reviews:
├─ booking (relation)
├─ customer (relation)
├─ contractor (relation)
├─ rating (integer, 1-5)
├─ quick_ratings (JSON): { punctuality, quality, professionalism, communication }
├─ comment (text)
├─ would_book_again (boolean)
├─ contractor_response (text)
├─ contractor_responded_at (datetime)
├─ status (enum): pending/approved/flagged
├─ flagged_reason (text)
└─ created_at (datetime)
```

---

### Component 10: Automated Commission Management & Contractor Payouts

**Objective:** Automatically calculate platform commission, track contractor earnings, and process payouts without manual intervention

**Commission Structure Configuration (Admin Panel):**
```
Commission Settings:
┌────────────────────────────────────────────┐
│ Default Platform Commission: 15%           │
│ (Applied to all services)                  │
│                                            │
│ Tier-Based Commissions (Optional):        │
│ ├─ Elite Contractors: 12%                 │
│ ├─ Preferred Contractors: 13%             │
│ └─ Standard Contractors: 15%              │
│                                            │
│ [Enable Tier-Based] [Save Changes]        │
└────────────────────────────────────────────┘
```

**How It Works:**

**1. Payment Capture (At Booking)**
```javascript
// When customer completes checkout
const booking = {
  serviceTotal: 215.25, // What customer pays
  platformCommission: 32.29, // 15% of 215.25
  contractorEarnings: 182.96, // 215.25 - 32.29
  stripeFee: 6.56, // Stripe's ~3% (paid by platform)
  netPlatformRevenue: 25.73 // 32.29 - 6.56
};

// Stripe payment intent with application fee
const paymentIntent = await stripe.paymentIntents.create({
  amount: 21525, // $215.25 in cents
  currency: 'usd',
  application_fee_amount: 3229, // $32.29 platform keeps
  transfer_data: {
    destination: contractor.stripeAccountId, // Contractor gets $182.96
  },
  metadata: { bookingId: booking.id }
});
```

**2. Earnings Tracking (Real-Time)**
```javascript
// After service completion, update contractor balance
async function updateContractorEarnings(bookingId) {
  const booking = await Booking.findById(bookingId).populate('contractor');
  
  // Create earnings record
  await ContractorEarnings.create({
    contractor: booking.contractor,
    booking: bookingId,
    serviceTotal: booking.total,
    platformCommission: booking.total * 0.15,
    grossEarnings: booking.total * 0.85,
    stripeFee: booking.total * 0.03, // Estimate
    netEarnings: (booking.total * 0.85) - (booking.total * 0.03),
    status: 'pending_transfer', // Will be transferred on payout schedule
    earnedAt: new Date()
  });
  
  // Update contractor running balance
  await booking.contractor.update({
    pendingBalance: booking.contractor.pendingBalance + (booking.total * 0.85)
  });
}
```

**3. Payout Schedule (Automated)**
```javascript
// Run daily at 3 AM
cron.schedule('0 3 * * *', async () => {
  const contractors = await Contractor.find({
    status: 'active',
    pendingBalance: { $gt: 0 } // Has earnings to pay out
  });
  
  for (const contractor of contractors) {
    // Check if payout day (e.g., every Monday)
    if (isPayoutDay()) {
      await processContractorPayout(contractor);
    }
  }
});

async function processContractorPayout(contractor) {
  // Stripe automatically transfers funds to contractor's bank account
  // Already done via application_fee_amount in original payment intent
  
  // Update contractor records
  await contractor.update({
    totalPaid: contractor.totalPaid + contractor.pendingBalance,
    pendingBalance: 0,
    lastPayoutDate: new Date()
  });
  
  // Create payout record
  await Payout.create({
    contractor: contractor.id,
    amount: contractor.pendingBalance,
    payoutDate: new Date(),
    method: 'stripe_transfer',
    status: 'completed',
    bankAccountLast4: contractor.stripeAccount.bankLast4
  });
  
  // Send notification
  await sendEmail({
    to: contractor.email,
    template: 'payout-processed',
    data: {
      amount: contractor.pendingBalance,
      payoutDate: new Date(),
      totalEarnedThisPeriod: contractor.pendingBalance
    }
  });
}
```

**4. Contractor Earnings Dashboard**
```
Carlos's Earnings Dashboard:

Current Balance:
┌────────────────────────────────────────────┐
│ Pending Payout: $1,847.23                  │
│ Next Payout Date: Monday, Jan 22, 2025    │
│ (Every Monday at 9 AM)                     │
│                                            │
│ Total Earned This Month: $3,892.45         │
│ Total Paid This Month: $2,045.22           │
└────────────────────────────────────────────┘

Recent Earnings:
┌──────────┬─────────────────┬────────┬──────────┬─────────┐
│ Date     │ Service         │ Gross  │ Comm(15%)│ Net Pay │
├──────────┼─────────────────┼────────┼──────────┼─────────┤
│ Jan 20   │ Full Detail     │ $215   │ -$32.29  │ $182.96 │
│ Jan 20   │ Exterior Detail │ $120   │ -$18.00  │ $102.00 │
│ Jan 19   │ Interior Detail │ $95    │ -$14.25  │ $80.75  │
│ Jan 19   │ Full Detail     │ $200   │ -$30.00  │ $170.00 │
└──────────┴─────────────────┴────────┴──────────┴─────────┘

Payout History:
- Jan 15, 2025: $1,542.89 → Bank ****1234
- Jan 8, 2025: $1,789.50 → Bank ****1234
- Jan 1, 2025: $1,245.00 → Bank ****1234

[Download Tax Document (1099)] [Update Banking Info]
```

**5. Admin Financial Reports**
```
Platform Revenue Dashboard:

This Month (January 2025):
┌────────────────────────────────────────────────────────┐
│ Total Customer Payments:     $47,892.00                │
│ Platform Commissions (15%):   $7,183.80                │
│ Contractor Payouts (85%):    -$40,708.20               │
│ Stripe Fees (~3%):            -$1,436.76               │
│ Net Platform Revenue:          $5,747.04               │
│                                                        │
│ Margin: 12% (after Stripe fees)                       │
└────────────────────────────────────────────────────────┘

Breakdown by Service:
- Full Detail: $25,600 → Platform keeps $3,840
- Exterior Detail: $10,680 → Platform keeps $1,602
- Interior Detail: $5,985 → Platform keeps $897.75

Top Earning Contractors:
1. Carlos Mendoza: $3,892 (28 services)
2. Juan Pérez: $4,245 (32 services)
3. Maria Garcia: $2,789 (19 services)

[Export Financial Report] [Download for Accounting]
```

**6. Dispute Handling & Refunds**
```javascript
// If customer disputes or admin issues refund
async function processRefund(bookingId, refundAmount, reason) {
  const booking = await Booking.findById(bookingId).populate('contractor');
  
  // Issue refund via Stripe
  const refund = await stripe.refunds.create({
    payment_intent: booking.paymentIntentId,
    amount: refundAmount * 100, // Convert to cents
    metadata: { bookingId, reason }
  });
  
  // Adjust contractor earnings
  const commissionToReverse = refundAmount * 0.15;
  const contractorEarningsToReverse = refundAmount * 0.85;
  
  await booking.contractor.update({
    pendingBalance: booking.contractor.pendingBalance - contractorEarningsToReverse
  });
  
  // Create reversal record
  await ContractorEarnings.create({
    contractor: booking.contractor,
    booking: bookingId,
    serviceTotal: -refundAmount,
    platformCommission: -commissionToReverse,
    grossEarnings: -contractorEarningsToReverse,
    netEarnings: -contractorEarningsToReverse,
    status: 'reversed',
    earnedAt: new Date(),
    notes: `Refund: ${reason}`
  });
  
  // Notify contractor
  await sendEmail({
    to: booking.contractor.email,
    template: 'earnings-reversed',
    data: {
      bookingId: booking.id,
      amount: contractorEarningsToReverse,
      reason: reason
    }
  });
}
```

**API Endpoints:**
```
GET /api/contractors/:id/earnings?startDate=2025-01-01&endDate=2025-01-31
Response: {
  summary: {
    totalEarned: 3892.45,
    platformCommissions: 583.87,
    netEarnings: 3308.58,
    pendingPayout: 1847.23,
    nextPayoutDate: "2025-01-22"
  },
  transactions: [...],
  payouts: [...]
}

GET /api/admin/financials?period=month&year=2025&month=1
Response: {
  totalRevenue: 47892.00,
  platformCommissions: 7183.80,
  contractorPayouts: 40708.20,
  stripeFees: 1436.76,
  netRevenue: 5747.04,
  margin: 0.12,
  breakdown: {...}
}

POST /api/bookings/:id/refund
Body: {
  amount: 215.25,
  reason: "Service not completed",
  notifyCustomer: true
}
```

**Strapi Collections:**
```
ContractorEarnings:
├─ contractor (relation)
├─ booking (relation)
├─ service_total (decimal)
├─ platform_commission (decimal)
├─ gross_earnings (decimal)
├─ stripe_fee (decimal)
├─ net_earnings (decimal)
├─ status (enum): pending_transfer/completed/reversed
├─ earned_at (datetime)
├─ notes (text)
└─ created_at (datetime)

Payouts:
├─ contractor (relation)
├─ amount (decimal)
├─ payout_date (datetime)
├─ method (string): "stripe_transfer"
├─ status (enum): pending/completed/failed
├─ bank_account_last_4 (string)
├─ stripe_transfer_id (string)
└─ created_at (datetime)

PlatformFinancials:
├─ period_start (date)
├─ period_end (date)
├─ total_bookings (integer)
├─ total_revenue (decimal)
├─ platform_commissions (decimal)
├─ contractor_payouts (decimal)
├─ payment_processing_fees (decimal)
├─ net_revenue (decimal)
└─ created_at (datetime)
```

---

## ADDITIONAL RECOMMENDATIONS

**1. Bilingual Implementation Strategy**
```javascript
// Using i18n for Next.js
// next.config.js
module.exports = {
  i18n: {
    locales: ['en', 'es'],
    defaultLocale: 'en',
  },
};

// pages/_app.js
import { appWithTranslation } from 'next-i18next';
function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
export default appWithTranslation(MyApp);

// Usage in components
import { useTranslation } from 'next-i18next';

function BookingPage() {
  const { t } = useTranslation('booking');
  return (
    <h1>{t('selectService')}</h1> // "Select Service" or "Selecciona Servicio"
  );
}
```

**Translation File Structure:**
```
/public/locales
├── en/
│   ├── common.json
│   ├── booking.json
│   ├── dashboard.json
│   └── notifications.json
└── es/
    ├── common.json
    ├── booking.json
    ├── dashboard.json
    └── notifications.json
```

**2. Cancellation & Rescheduling Policy System**
```javascript
// Cancellation rules (configurable in admin)
const cancellationPolicy = {
  freeUntilHours: 24, // 24 hours before service
  partialRefundWindow: 12, // 12-24 hours before = 50% refund
  noRefundWindow: 0, // <12 hours = no refund
  noShowFee: 25 // If customer doesn't show, contractor gets $25
};

async function handleCancellation(bookingId, cancelledBy) {
  const booking = await Booking.findById(bookingId);
  const hoursUntilService = (booking.scheduledDate - new Date()) / (1000 * 60 * 60);
  
  let refundAmount = 0;
  
  if (hoursUntilService >= cancellationPolicy.freeUntilHours) {
    // Full refund
    refundAmount = booking.total;
  } else if (hoursUntilService >= cancellationPolicy.partialRefundWindow) {
    // Partial refund (50%)
    refundAmount = booking.total * 0.5;
  } else {
    // No refund - contractor gets paid anyway
    refundAmount = 0;
    await compensateContractorForCancellation(booking, cancellationPolicy.noShowFee);
  }
  
  if (refundAmount > 0) {
    await processRefund(bookingId, refundAmount, 'Customer cancellation');
  }
  
  // Update booking status
  await booking.update({
    status: 'cancelled',
    cancelledBy: cancelledBy,
    cancelledAt: new Date(),
    refundAmount: refundAmount
  });
}
```

**3. Weather-Based Rescheduling**
```javascript
// Integration with weather API
const checkWeatherForBooking = async (booking) => {
  const weatherData = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${booking.zipCode}&date=${booking.date}`
  ).then(res => res.json());
  
  const forecast = weatherData.forecast.forecastday[0];
  
  // If heavy rain or severe weather
  if (forecast.day.condition.text.includes('rain') && forecast.day.totalprecip_mm > 10) {
    // Auto-notify customer and contractor
    await sendWeatherAlert(booking, {
      condition: forecast.day.condition.text,
      precipitation: forecast.day.totalprecip_mm,
      suggestion: 'We recommend rescheduling due to weather conditions'
    });
    
    // Offer free rescheduling
    await booking.update({
      weatherReschedulingAvailable: true
    });
  }
};

// Run every day at 8 PM for next-day bookings
cron.schedule('0 20 * * *', async () => {
  const tomorrowBookings = await Booking.find({
    date: getTomorrowDate(),
    status: 'confirmed'
  });
  
  for (const booking of tomorrowBookings) {
    await checkWeatherForBooking(booking);
  }
});
```

**4. Recurring Services / Subscriptions (Optional Enhancement)**
```javascript
// Allow customers to set up recurring services
const subscriptionPlans = [
  {
    id: 'weekly-exterior',
    name: 'Weekly Exterior Detail',
    frequency: 'weekly',
    service: 'exterior-detail',
    discount: 0.10, // 10% off
    price: 108 // Regular $120
  },
  {
    id: 'monthly-full',
    name: 'Monthly Full Detail',
    frequency: 'monthly',
    service: 'full-detail',
    discount: 0.15, // 15% off
    price: 170 // Regular $200
  }
];

// Create subscription with Stripe
async function createSubscription(customerId, planId) {
  const plan = subscriptionPlans.find(p => p.id === planId);
  
  // Create Stripe subscription
  const subscription = await stripe.subscriptions.create({
    customer: customer.stripeCustomerId,
    items: [{ price: plan.stripePriceId }],
    metadata: {
      customerId: customerId,
      planId: planId
    }
  });
  
  // Auto-book services based on frequency
  await scheduleRecurringBookings(customerId, plan);
}
```

**5. Loyalty/Referral Program**
```javascript
// Customer referral system
const referralRewards = {
  referrerBonus: 25, // $25 credit for referrer
  refereeDiscount: 25 // $25 off first service for new customer
};

async function applyReferralCode(newCustomerId, referralCode) {
  const referrer = await Customer.findOne({ referralCode: referralCode });
  
  if (referrer) {
    // Give referrer credit
    await referrer.update({
      accountCredit: referrer.accountCredit + referralRewards.referrerBonus
    });
    
    // Give new customer discount
    await Customer.findByIdAndUpdate(newCustomerId, {
      accountCredit: referralRewards.refereeDiscount,
      referredBy: referrer.id
    });
    
    // Track referral
    await Referral.create({
      referrer: referrer.id,
      referee: newCustomerId,
      status: 'pending', // Becomes 'completed' after referee's first booking
      rewardAmount: referralRewards.referrerBonus
    });
  }
}
```

---

## DEVELOPMENT WORKFLOW FOR LLM

**Prompt Structure for AI Code Generation:**

When using tools like Cursor, Bolt, or v0, provide prompts in this format:

```
Context: I'm building a mobile car detailing booking platform with [specific feature].

Tech Stack:
- Frontend: Next.js latest, React, Tailwind CSS, i18n
- Backend: Strapi 4.x, Node.js, Supabase PostgreSQL
- Payments: Stripe Connect
- Notifications: Twilio (SMS), SendGrid (Email)

Task: [Specific component/feature to build]

Requirements:
1. [Requirement 1]
2. [Requirement 2]
3. [Requirement 3]

API Endpoints Needed:
- POST /api/bookings/create
- GET /api/bookings/:id
...

Strapi Collections:
- Bookings { ... }
- Contractors { ... }

Expected Output:
- Complete React component with TypeScript
- API route handlers
- Strapi content type definitions
- Unit tests (optional)

Example:
[Provide example of expected result]
```

**Iterative Development Approach:**
1. Start with core booking flow (Components 1-4)
2. Add contractor management (Components 5-6)
3. Implement automation (Components 7, 10)
4. Build dashboards (Component 8)
5. Add quality features (Component 9)
6. Polish UX and test bilingual support
7. Deploy to staging, then production

---

## SUMMARY

This SOP provides LLM-ready specifications for building a complete mobile car detailing booking platform with:
- Geographic-based service availability
- Automated contractor assignment
- Stripe Connect marketplace payments
- Real-time SMS/email notifications
- Bilingual support (English/Spanish)
- Quality control through checklists, photos, and reviews
- Automated commission management and payouts
- Comprehensive dashboards for all user roles

Each component includes technical requirements, API endpoints, data structures, and code examples that AI code generation tools can use to produce production-ready code.

