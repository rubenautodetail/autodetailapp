
/docs/ui-contractor-dashboard.md

🧰 AutoDetail – Contractor Dashboard

Phase 1 – Solo Founder MVP
Design System: Apple Adaptive (Light + Dark)
See /docs/design-system.md for all visual rules.

⸻

1️⃣ Design Philosophy

The Contractor Dashboard must feel:
	•	Calm
	•	Structured
	•	Efficient
	•	Predictable

It is not a marketplace control panel.

It is a clean operational interface for one professional.

If something looks busy, reduce it.

If something requires explanation, simplify it.

⸻

2️⃣ Core Conceptual Model

This dashboard operates as the control center for the request lifecycle:

pending → confirmed → in_progress → completed → cancelled

Every screen reflects this state model.

No hidden transitions.
No secondary state logic.

The system is state-driven.

⸻

3️⃣ Primary Navigation (Mobile First)

Bottom navigation (MVP minimal):
	•	Inbox
	•	Active
	•	History
	•	Settings

Desktop → left sidebar.

Only 4 sections.

⸻

4️⃣ Inbox (Default Screen)

Purpose

Review new requests and decide quickly.

⸻

Layout

Header:
“Inbox”

Segmented control:
	•	Pending
	•	Confirmed

⸻

Request Card (Apple Style)

Each card shows:
	•	Customer name
	•	Service name
	•	Vehicle
	•	Address (1 line)
	•	Estimated total
	•	Timestamp (“3 min ago”)

Primary actions (Pending only):
	•	Accept (Primary blue button)
	•	Decline (Text button)

Secondary:
	•	Tap card → View details

⸻

Accept Behavior

Tap Accept:
	•	Button shows loading state
	•	Status updates to confirmed
	•	Card moves to Confirmed tab
	•	Toast: “Request confirmed.”

⸻

Decline Behavior

Tap Decline:
	•	Confirmation sheet
	•	Confirm decline
	•	Status updates to cancelled
	•	Toast: “Request declined.”

⸻

5️⃣ Active (Execution Screen)

Shows:
	•	Confirmed
	•	In Progress

⸻

Confirmed Job Card

Displays:
	•	Customer
	•	Address
	•	Service
	•	Start Job button

Primary Action:
Start Job

⸻

In Progress Job Card

Displays:
	•	Customer
	•	Service
	•	Duration since started

Primary Action:
Complete Job

⸻

6️⃣ Job Detail Screen

Accessible from any request.

Displays:
	•	Customer info
	•	Vehicle
	•	Full address
	•	Service breakdown
	•	Notes
	•	Status timeline

Timeline:

• Pending
• Confirmed
• In Progress
• Completed

Current state highlighted.

Contextual button at bottom:

Pending → Accept
Confirmed → Start Job
In Progress → Complete Job

One primary action only.

⸻

7️⃣ History

Shows:
	•	Completed
	•	Cancelled

Sorted by most recent.

Each card:
	•	Customer
	•	Service
	•	Status badge
	•	Completion date

Tap → Detail view (read-only).

⸻

8️⃣ Settings

Minimal:

Profile
	•	Name
	•	Email
	•	Logout

Service Availability
	•	Toggle service active/inactive

That’s it for MVP.

⸻

9️⃣ UX Rules (Same as User App)
	•	One primary action per screen
	•	Every action gives feedback
	•	No stacked buttons
	•	No clutter
	•	Generous whitespace
	•	Calm copy tone

Example tone:

“Job started.”
“Job completed.”
“Request confirmed.”

Not:

“Let’s go!”
“Awesome!”

⸻

🔟 Empty States

Inbox empty:
“No new requests.”

Active empty:
“No active jobs.”

History empty:
“No completed jobs yet.”

⸻

1️⃣1️⃣ Performance Rules

Owner must be able to:

Open dashboard → Accept request
Within 5 seconds.

That is success.

⸻

⸻

/docs/contractor-dashboard-data.md

🗄 Contractor Dashboard – Supabase Spec (MVP)

⸻

1️⃣ Roles

profiles.role:
	•	customer
	•	contractor
	•	admin

Phase 1:
One contractor user.

⸻

2️⃣ Tables Used

profiles
vehicles
services
requests

⸻

3️⃣ requests Table (Authoritative State)

Fields required:
	•	id
	•	customer_id
	•	vehicle_id
	•	service_id
	•	address_text
	•	notes
	•	estimated_total
	•	status
	•	created_at
	•	updated_at
	•	confirmed_at
	•	completed_at

Status values:

pending
confirmed
in_progress
completed
cancelled


⸻

4️⃣ Realtime Logic

Contractor subscribes to:

requests table

Events:

INSERT → New pending request
UPDATE (status change) → Move card between sections

⸻

5️⃣ State Transitions (Enforced)

Allowed:

pending → confirmed
pending → cancelled

confirmed → in_progress
confirmed → cancelled

in_progress → completed

No other transitions.

⸻

6️⃣ Permissions (RLS Simplified)

Customers:
	•	Insert their own request
	•	View their own requests

Contractor:
	•	View all requests
	•	Update status on any request

⸻

7️⃣ UI Assumptions

UI reads only:

requests.status

All rendering decisions are driven by that single field.

No additional client-side state machine.

⸻

🎯 Consistency Check

Both dashboards now:
	•	Use identical lifecycle states
	•	Follow Apple adaptive design
	•	Are mobile-first
	•	Are minimal MVP
	•	Are state-driven
	•	Avoid feature creep

We are fully consistent.

