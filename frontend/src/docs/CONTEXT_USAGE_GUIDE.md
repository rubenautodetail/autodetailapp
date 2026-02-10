# 📘 Context API Usage Guide
## How to Use the State Management (Adapted from Uber Clone)

**Created:** February 9, 2026
**Based On:** Uber clone's Zustand stores → Context API pattern

---

## 🎯 Overview

We've adapted the Uber clone's state management pattern from **Zustand** to **React Context API** with Strapi integration. The structure mirrors their approach but uses Context instead.

### What We Have:

1. **BookingContext** - Service selection, location, scheduling, pricing
2. **ContractorContext** - Available contractors, selection, assignment
3. **AuthContext** - Strapi authentication, user management

---

## 🚀 Quick Start

### 1. Wrap Your App with Providers

**File:** `app/layout.tsx`

```tsx
import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 2. Use Contexts in Your Components

```tsx
"use client";

import { useBooking, useContractor, useAuth } from "@/contexts";

export default function BookingPage() {
  const {
    selectedService,
    setService,
    addAddOn,
    total,
  } = useBooking();

  const {
    availableContractors,
    selectedContractor,
    setSelectedContractor,
  } = useContractor();

  const { user, isAuthenticated } = useAuth();

  return (
    <div>
      <h1>Book a Detail - {user?.email}</h1>
      <p>Total: ${total}</p>
    </div>
  );
}
```

---

## 📦 BookingContext

**Adapted from:** Uber clone's `useLocationStore` + ride selection logic

### Usage Examples:

#### Select a Service
```tsx
"use client";

import { useBooking } from "@/contexts";

export default function ServiceSelection() {
  const { setService, selectedService } = useBooking();

  const services = [
    {
      id: "interior",
      name: "Interior Detail",
      nameEs: "Detalle Interior",
      basePrice: 100,
      duration: 90,
      description: "Deep clean of interior",
      descriptionEs: "Limpieza profunda del interior",
    },
    // ... more services
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {services.map((service) => (
        <div
          key={service.id}
          className={`p-4 border rounded ${
            selectedService?.id === service.id ? "border-blue-500" : ""
          }`}
          onClick={() => setService(service)}
        >
          <h3>{service.name}</h3>
          <p>${service.basePrice}</p>
        </div>
      ))}
    </div>
  );
}
```

#### Add/Remove Add-Ons
```tsx
"use client";

import { useBooking } from "@/contexts";

export default function AddOnSelection() {
  const { selectedAddOns, addAddOn, removeAddOn, subtotal } = useBooking();

  const addOns = [
    { id: "pet-hair", name: "Pet Hair Removal", nameEs: "Remoción de Pelo de Mascotas", price: 25 },
    { id: "stain", name: "Stain Treatment", nameEs: "Tratamiento de Manchas", price: 30 },
  ];

  const isSelected = (addOnId: string) => {
    return selectedAddOns.some((a) => a.id === addOnId);
  };

  return (
    <div>
      <h3>Add-ons (Optional)</h3>
      {addOns.map((addOn) => (
        <div key={addOn.id}>
          <input
            type="checkbox"
            checked={isSelected(addOn.id)}
            onChange={(e) => {
              if (e.target.checked) {
                addAddOn(addOn);
              } else {
                removeAddOn(addOn.id);
              }
            }}
          />
          <label>{addOn.name} (+${addOn.price})</label>
        </div>
      ))}
      <p>Subtotal: ${subtotal}</p>
    </div>
  );
}
```

#### Set Customer Location
```tsx
"use client";

import { useBooking } from "@/contexts";

export default function AddressInput() {
  const { setLocation, customerLocation } = useBooking();

  const handleAddressSelect = (address: string, zipCode: string, lat: number, lng: number) => {
    setLocation({
      address,
      zipCode,
      latitude: lat,
      longitude: lng,
    });
  };

  return (
    <div>
      <p>Current: {customerLocation?.address || "No address selected"}</p>
      {/* Google Maps Autocomplete component will go here */}
    </div>
  );
}
```

#### Schedule Booking
```tsx
"use client";

import { useBooking } from "@/contexts";

export default function SchedulePicker() {
  const { setSchedule, selectedDate, selectedTimeWindow } = useBooking();

  const timeWindows = [
    { slot: "morning", label: "Morning", labelEs: "Mañana", range: "9AM-12PM" },
    { slot: "afternoon", label: "Afternoon", labelEs: "Tarde", range: "1PM-4PM" },
    { slot: "evening", label: "Evening", labelEs: "Noche", range: "4PM-7PM" },
  ];

  const handleSchedule = (date: Date, timeWindow: any) => {
    setSchedule(date, timeWindow);
  };

  return (
    <div>
      {/* Date picker */}
      <input
        type="date"
        onChange={(e) => {
          const date = new Date(e.target.value);
          if (selectedTimeWindow) {
            handleSchedule(date, selectedTimeWindow);
          }
        }}
      />

      {/* Time windows */}
      <div className="grid grid-cols-3 gap-2">
        {timeWindows.map((tw) => (
          <button
            key={tw.slot}
            className={selectedTimeWindow?.slot === tw.slot ? "bg-blue-500" : ""}
            onClick={() => {
              if (selectedDate) {
                handleSchedule(selectedDate, tw);
              }
            }}
          >
            {tw.label}
            <br />
            {tw.range}
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### View Pricing
```tsx
"use client";

import { useBooking } from "@/contexts";

export default function PricingSummary() {
  const { selectedService, selectedAddOns, subtotal, serviceFee, total } = useBooking();

  return (
    <div className="border p-4 rounded">
      <h3>Pricing Summary</h3>

      <div className="flex justify-between">
        <span>{selectedService?.name}</span>
        <span>${selectedService?.basePrice}</span>
      </div>

      {selectedAddOns.map((addOn) => (
        <div key={addOn.id} className="flex justify-between text-sm">
          <span>{addOn.name}</span>
          <span>+${addOn.price}</span>
        </div>
      ))}

      <hr className="my-2" />

      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>${subtotal}</span>
      </div>

      <div className="flex justify-between text-sm text-gray-600">
        <span>Service Fee (5%)</span>
        <span>${serviceFee.toFixed(2)}</span>
      </div>

      <hr className="my-2" />

      <div className="flex justify-between font-bold text-lg">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}
```

---

## 👷 ContractorContext

**Adapted from:** Uber clone's `useDriverStore`

### Usage Examples:

#### Fetch Available Contractors
```tsx
"use client";

import { useBooking, useContractor } from "@/contexts";
import { useEffect } from "react";

export default function ContractorSelection() {
  const { customerLocation, selectedDate, selectedTimeWindow } = useBooking();
  const {
    availableContractors,
    fetchAvailableContractors,
    isLoadingContractors,
    selectedContractor,
    setSelectedContractor,
  } = useContractor();

  useEffect(() => {
    if (customerLocation && selectedDate && selectedTimeWindow) {
      fetchAvailableContractors(
        customerLocation.zipCode,
        selectedDate,
        selectedTimeWindow.slot
      );
    }
  }, [customerLocation, selectedDate, selectedTimeWindow]);

  if (isLoadingContractors) {
    return <p>Finding available contractors...</p>;
  }

  if (availableContractors.length === 0) {
    return <p>No contractors available for selected time</p>;
  }

  return (
    <div>
      <h3>Available Contractors</h3>
      <div className="grid grid-cols-2 gap-4">
        {availableContractors.map((contractor) => (
          <div
            key={contractor.id}
            className={`p-4 border rounded cursor-pointer ${
              selectedContractor?.id === contractor.id ? "border-blue-500" : ""
            }`}
            onClick={() => setSelectedContractor(contractor)}
          >
            <img
              src={contractor.profileImage || "/default-avatar.png"}
              alt={contractor.name}
              className="w-16 h-16 rounded-full"
            />
            <h4>{contractor.name}</h4>
            <p>⭐ {contractor.rating} ({contractor.totalJobs} jobs)</p>
            {contractor.distance && (
              <p className="text-sm text-gray-600">
                {contractor.distance.toFixed(1)} miles away
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔐 AuthContext

**Adapted from:** Uber clone's Clerk auth → Strapi auth

### Usage Examples:

#### Login Form
```tsx
"use client";

import { useAuth } from "@/contexts";
import { useState } from "react";

export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      // Redirect to dashboard after successful login
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

#### Protected Route
```tsx
"use client";

import { useAuth } from "@/contexts";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1>Welcome, {user?.firstName || user?.email}!</h1>
      <p>Role: {user?.role}</p>
    </div>
  );
}
```

#### Register Form
```tsx
"use client";

import { useAuth } from "@/contexts";
import { useState } from "react";

export default function RegisterForm() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "contractor">("customer");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register(email, password, role);
      window.location.href = "/dashboard";
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select value={role} onChange={(e) => setRole(e.target.value as any)}>
        <option value="customer">Customer</option>
        <option value="contractor">Contractor</option>
      </select>

      <button type="submit">Register</button>
    </form>
  );
}
```

---

## 🔄 Complete Booking Flow Example

**This shows how all contexts work together (like Uber clone's flow)**

```tsx
"use client";

import { useBooking, useContractor, useAuth } from "@/contexts";

export default function BookingFlowPage() {
  const {
    currentStep,
    nextStep,
    previousStep,
    selectedService,
    selectedAddOns,
    customerLocation,
    selectedDate,
    selectedTimeWindow,
    total,
    resetBooking,
  } = useBooking();

  const { selectedContractor, assignedContractor } = useContractor();
  const { user, isAuthenticated } = useAuth();

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: // Service selection
        return selectedService !== null;
      case 2: // Location
        return customerLocation !== null;
      case 3: // Schedule
        return selectedDate !== null && selectedTimeWindow !== null;
      case 4: // Contractor selection
        return selectedContractor !== null;
      case 5: // Payment
        return isAuthenticated;
      default:
        return false;
    }
  };

  const handlePaymentSuccess = async () => {
    // Create booking in Strapi
    const response = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService?.id,
        addOnIds: selectedAddOns.map((a) => a.id),
        customerLocation,
        date: selectedDate,
        timeWindow: selectedTimeWindow?.slot,
        contractorId: selectedContractor?.id,
        total,
        customerId: user?.id,
      }),
    });

    if (response.ok) {
      // Redirect to confirmation page
      window.location.href = "/booking/confirmation";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              currentStep >= step ? "bg-blue-500 text-white" : "bg-gray-300"
            }`}
          >
            {step}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-96">
        {currentStep === 1 && <ServiceSelectionComponent />}
        {currentStep === 2 && <AddressInputComponent />}
        {currentStep === 3 && <SchedulePickerComponent />}
        {currentStep === 4 && <ContractorSelectionComponent />}
        {currentStep === 5 && <PaymentComponent onSuccess={handlePaymentSuccess} />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <button
          onClick={previousStep}
          disabled={currentStep === 1}
          className="px-6 py-2 bg-gray-200 rounded"
        >
          Back
        </button>

        <button
          onClick={nextStep}
          disabled={!canProceedToNextStep()}
          className="px-6 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {currentStep === 5 ? "Confirm & Pay" : "Next"}
        </button>
      </div>
    </div>
  );
}
```

---

## 🎯 Key Differences from Uber Clone

| Feature | Uber Clone (Zustand) | Our Implementation (Context) |
|---------|---------------------|------------------------------|
| Store creation | `create<Store>((set) => ...)` | `createContext<Type>()` + `Provider` |
| Usage | `const { state } = useStore()` | `const { state } = useContext()` |
| Updates | `set(() => ({ ... }))` | `setState(...)` |
| Cross-store | `useStore.getState()` | Pass via props or context |
| Performance | Optimized by default | Use `useMemo` if needed |

---

## ✅ Testing Your Setup

**Create a test page to verify contexts work:**

```tsx
// app/test-contexts/page.tsx
"use client";

import { useBooking, useContractor, useAuth } from "@/contexts";

export default function TestContexts() {
  const booking = useBooking();
  const contractor = useContractor();
  const auth = useAuth();

  return (
    <div className="p-8">
      <h1>Context Test Page</h1>

      <div className="space-y-4">
        <div>
          <h2>Booking Context</h2>
          <pre>{JSON.stringify(booking, null, 2)}</pre>
        </div>

        <div>
          <h2>Contractor Context</h2>
          <pre>{JSON.stringify(contractor, null, 2)}</pre>
        </div>

        <div>
          <h2>Auth Context</h2>
          <pre>{JSON.stringify({ user: auth.user, isAuthenticated: auth.isAuthenticated }, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
```

Navigate to `/test-contexts` to verify all contexts are working!

---

**Next Steps:**
1. ✅ Contexts are set up
2. ⏭️ Integrate Google Maps address input
3. ⏭️ Build service selection page
4. ⏭️ Connect to Strapi API
