# **🚗 AutoDetail – User App UX & UI System Specification**

**Phase 1 – Owner Controlled (Miami Launch)**

**Mobile-First Web App**

---

# **1️⃣ DESIGN PHILOSOPHY**

This application follows Human-Centered Design principles:

* Discoverability
* Clear Signifiers
* Immediate Feedback
* Natural Mapping
* Error Prevention
* Clear Conceptual Model
* Emotional Trust & Simplicity

If a user must think about how to use a feature, the design must be simplified.

If system status is unclear, feedback must be added.

---

# **2️⃣ CORE CONCEPTUAL MODEL**

The system must feel like:

**Uber for Auto Detailing**

User mental model:

1. Select service
2. Confirm location
3. Send request
4. Owner approves
5. Detailer arrives
6. Service completed
7. Payment processed

Every screen must reinforce this flow.

---

# **3️⃣ AUTHENTICATION FLOW (Email Verification Only)**

## **3.1 Welcome Screen**

### **Purpose:**

Entry point. Clean. Trustworthy.

### **Layout:**

* Centered Logo
* Tagline: “Premium Auto Detailing. On Demand.”
* Primary CTA: Create Account
* Secondary CTA: Login

### **Signifiers:**

Buttons must look tappable:

* Rounded-xl
* Shadow-md
* Color contrast
* 44px minimum height

---

## **3.2 Create Account Screen**

### **Fields:**

* Full Name
* Email
* Password
* Confirm Password

### **Primary CTA:**

Create Account

### **Feedback:**

* Inline validation
* Password strength indicator
* Button loading animation on submit

---

## **3.3 Email Verification Gate**

### **Trigger:**

user.emailVerified === false

### **Layout:**

* Envelope Icon
* Title: Verify Your Email
* Text: “We sent a link to {email}”
* Resend Email
* I’ve Verified
* Back to Login

### **Feedback:**

* Resend shows toast: “Verification email sent.”
* I’ve Verified re-checks auth state.

---

# **4️⃣ USER DASHBOARD (HOME)**

## **Purpose:**

Primary action hub.

## **Layout Structure:**

```
Top: Greeting + Profile
Middle: Service Selection
Bottom: Location + CTA
```

---

## **4.1 Top Section**

Left:

Good Morning, {FirstName} 👋

Right:

Circular Profile Avatar

Tap → Bottom Drawer Menu

### **Drawer Menu:**

* My Vehicles
* My Orders
* Payment Methods
* Logout

---

# **5️⃣ SERVICE SELECTION**

## **5.1 Service Cards**

Horizontal scrollable list.

Each card includes:

* Service Name
* Starting Price
* 1-line Description
* Arrow icon (→)

### **Signifiers:**

* Partial peek of next card
* Dots indicator under carousel
* Subtle hover/tap animation

No hidden swipe-only actions.

---

## **5.2 Service Card Tap Behavior**

Tap → Bottom Sheet Modal

---

# **6️⃣ SERVICE DETAIL MODAL**

## **Layout:**

Top:

* Service Title
* Close (X)

Middle:

* Before/After Image Slider
* Duration
* Price Range

Bottom:

Add-ons (checkbox style)

Sticky Bottom Button:

Continue

---

## **Add-ons:**

* Engine Bay
* Pet Hair
* Odor Treatment
* Headlight Restoration

---

## **Feedback:**

* Checkbox toggles animate
* Price updates dynamically
* Continue button disabled until vehicle selected

---

# **7️⃣ LOCATION SELECTION SCREEN**

## **Purpose:**

Confirm where service happens.

---

## **Layout:**

Top:

Back Button

Title: Confirm Location

Middle:

Google Map

Draggable Pin

Use My Location Button

Below Map:

Editable Address Field

Apartment / Gate Code

Notes

Bottom Sticky CTA:

Request Service

---

## **Signifiers:**

* Pin pulse animation
* “Drag to adjust location” text
* Map zoom indicator

---

# **8️⃣ REQUEST CONFIRMATION SCREEN (ERROR PREVENTION)**

Before final submission:

Show summary:

* Service
* Add-ons
* Vehicle
* Address
* Estimated total

Primary CTA:

Confirm Request

Secondary:

Back to Edit

---

# **9️⃣ REQUEST STATUS FLOW**

---

## **9.1 State: Pending Approval**

Title:

Request Sent

Show:

* Service
* Address
* Estimated Price

Visual:

Status Timeline (Step 1 highlighted)

CTA:

Cancel Request

---

## **9.2 State: Confirmed**

Title:

Your Detail is Confirmed ✅

Show:

* Detailer Name
* ETA
* Status Tracker

Status Steps:

1. Confirmed
2. On The Way
3. Arrived
4. In Progress
5. Completed

Color coding:

Gray → Blue → Green

---

## **9.3 State: Declined**

Title:

We’re unavailable right now.

Buttons:

Try Different Time

Contact Support

---

# **🔟 MY VEHICLES**

Card-based layout.

Fields:

* Make
* Model
* Year
* Color
* Plate
* Type

Add Vehicle button always visible.

---

# **1️⃣1️⃣ MY ORDERS**

List format.

Order Card:

* Service Name
* Date
* Status Badge
* Price

Tap → Order Detail View

Includes:

* Breakdown
* Payment Status
* Leave Review (if completed)

---

# **1️⃣2️⃣ PAYMENTS**

Stripe integration.

Users can:

* Add card
* Remove card
* Set default

On completion:

* Auto-charge
* Receipt emailed

---

# **1️⃣3️⃣ MICROINTERACTIONS & FEEDBACK RULES**

Every tap must produce:

* Visual change
* Animation
* State update
* Or confirmation message

Never allow dead taps.

---

# **1️⃣4️⃣ ERROR STATES**

Design for:

* Network failure
* Owner delayed approval
* Payment failure
* Location detection error

Each must show:

* Clear explanation
* Retry button
* Calm tone

---

# **1️⃣5️⃣ MOBILE-FIRST REQUIREMENTS**

* Sticky bottom CTA
* 44px tap targets
* Thumb-zone optimization
* Avoid text overload
* Icon + Label (never icon alone)

---

# **1️⃣6️⃣ SYSTEM STATES MUST ALWAYS BE VISIBLE**

User must always know:

* What step they’re in
* What’s happening
* What happens next

No ambiguity.

---

# **1️⃣7️⃣ COMPONENT LIBRARY REQUIRED**

You should build reusable components:

* ServiceCard
* BottomSheetModal
* StatusStepper
* StickyCTAButton
* LoadingOverlay
* ToastNotification
* AddressSelector
* VehicleCard
* OrderCard

---

# **1️⃣8️⃣ PHASE 1 BACKEND LOGIC**

When user confirms:

```
Create Request
status = pending
Notify Owner
```

Owner accepts:

```
status = confirmed
```

Owner rejects:

```
status = declined
```

Frontend listens in real-time.

---

# **1️⃣9️⃣ USER EXPERIENCE STANDARD**

The app must feel:

* Premium
* Calm
* Trustworthy
* Simple
* Predictable
* Fast

If any screen feels confusing, redesign it.

---

# **2️⃣0️⃣ UX VALIDATION CHECKLIST**

Before release, verify:

* Can a new user request service in under 60 seconds?
* Is every primary action visually dominant?
* Does every state have feedback?
* Can user recover from mistakes?
* Is status always visible?
