# 🏗️ Rubens Auto Detail Platform - Architecture & Functionality

## 🌟 Executive Summary
**Rubens Auto Detail Platform** is an on-demand marketplace connecting vehicle owners (**Customers**) with professional auto detailers (**Contractors**). The platform handles booking, scheduling, payments, and job tracking, functioning as the "Uber for Auto Detailing."

---

## 👥 User Roles & Capabilities

### 1. Customer (Vehicle Owner)
**Goal:** Effortless booking of premium detailing services.
- **Service Selection:** Browse and select from curated packages (e.g., *Full Detail*, *Interior Only*) and specific add-ons (e.g., *Pet Hair Removal*).
- **Scheduling:** Select flexible time windows (Morning, Afternoon, Evening) for service at their home or office.
- **Profile Management:** Save vehicle details (Type, Color, Plate) and addresses for 1-click booking.
- **Payments:** Securely pay via Credit/Debit card (powered by Stripe).
- **Job Tracking:** Real-time visibility into booking status (*Pending* → *En Route* → *In Progress* → *Completed*).
- **History & Reviews:** View past services and re-book efficiently.

### 2. Contractor (Service Provider)
**Goal:** Receive job assignments, perform work, and get paid.
- **Onboarding:** Automated registration flow including document submission (ID, Insurance) and Service Zone selection.
- **Dashboard:** Central hub to view assigned jobs, earnings, and performance metrics.
- **Job Execution:** Step-by-step workflow:
    1.  **Accept/View Job:** See customer details, vehicle info, and requested services.
    2.  **En Route:** Notify customer they are on the way.
    3.  **Start Job:** Upload **Before Photos** and begin work.
    4.  **Complete Job:** Upload **After Photos** and mark valuable completion.
- **Payouts:** Direct deposit to their bank account via **Stripe Connect** (Platform fee is automatically deducted).

### 3. Admin (Platform Owner)
**Goal:** Manage operations, quality, and revenue.
- **Service Management:** Define service packages, pricing, durations, and add-ons via Strapi Admin.
- **Contractor Oversight:** Review applications, approve documents, set performance tiers (Standard, Preferred, Elite), and manage service zones.
- **Booking Oversight:** Global view of all bookings, ability to reassign jobs or handle disputes/refunds.
- **Analytics:** Insight into total revenue, active contractors, and customer growth.

---

## 🔄 Core Workflows

### 🏎️ The Booking Flow
1.  **Select Service:** Customer picks a base package (e.g., "Full Detail").
2.  **Customize:** Customer adds extras (e.g., "Headlight Restoration").
3.  **Schedule:** Customer picks a Date and Time Window.
4.  **Details:** Customer enters Vehicle Info and Service Address.
5.  **Payment:** Customer enters card details. System authorizes the hold.
6.  **Confirmation:** Booking is created with status `pending`.

### 🤝 Contractor Assignment & Job Loop
1.  **Assignment:** System matches booking to available Contractor in the Service Zone.
2.  **Notification:** Contractor receives job details.
3.  **Execution:** Contractor updates status:
    -   `en_route` - Customer notified.
    -   `in_progress` - Job starts.
    -   `completed` - Job finishes, photos uploaded.
4.  **Payment Capture:** Upon specific triggers (or manual review), the payment is captured.
5.  **Payout:** Funds are split: Platform Fee to Admin, Net Earnings to Contractor.

### 📝 Contractor Onboarding
1.  **Register:** Sign up with Name, Email, Phone.
2.  **Profile:** Upload ID, Insurance, and select Service Zones.
3.  **Stripe Connect:** Link bank account for payouts.
4.  **Approval:** Admin reviews documents and activates account.
5.  **Active:** Contractor is now eligible for jobs.

---

## 💾 Detailed Data Models (Schema)

| Model | Key Fields | Purpose |
| :--- | :--- | :--- |
| **User** (Auth) | `username`, `email`, `role` | Core authentication identity. |
| **Customer** | `name`, `phone`, `savedVehicles`, `stripeCustomerId` | Extended profile for vehicle owners. |
| **Contractor** | `status`, `serviceZones`, `stripeAccountId`, `performanceTier` | Profile for detailers, linked to Stripe Connect. |
| **Service** | `name`, `basePrice`, `duration`, `checklist` | The base product offering (e.g., "Full Detail"). |
| **AddOn** | `name`, `price`, `duration` | Upsells attached to a service. |
| **Booking** | `status`, `totalAmount`, `scheduledDate`, `photos`, `paymentIntentId` | The central transaction record linking all entities. |
| **ServiceZone** | `name`, `zipCodes` | Geographic areas where contractors operate. |

---

## 🛠️ Technology Stack

-   **Frontend:** Next.js 16 (App Router), Tailwind CSS, TypeScript.
-   **Backend:** Strapi v4 (Headless CMS), customized controllers.
-   **Database:** PostgreSQL (Production) / SQLite (Dev).
-   **Payments:** Stripe (Custom Connect for platforms).
-   **Media:** Supabase Storage.
-   **Emails:** Resend / Strapi Email Plugin.

---

## 🌍 Strategic Features
-   **Internationalization (i18n):** Full English/Spanish support for diverse customer/contractor base in target markets.
-   **Geo-Fencing:** Service Zones ensure efficient routing and prevent out-of-area bookings.
-   **Split Payments:** Automated revenue sharing simplifies accounting and builds trust with contractors.
