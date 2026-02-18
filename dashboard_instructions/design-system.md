
# **🍎 AutoDetail – Adaptive Apple Design System**

## **Core Rule**

Light and Dark are not themes.

They are environments.

Both must feel native, intentional, and fully designed.

No color inversions.

No lazy dark background swaps.

---

# **1️⃣ Color System**

## **🌤 Light Mode**

Background:

#F5F5F7

Card:

#FFFFFF

Primary Text:

#1D1D1F

Secondary Text:

#6E6E73

Divider:

#E5E5EA

Accent:

#0A84FF

---

## **🌙 Dark Mode**

Background:

#000000

Card:

#1C1C1E

Primary Text:

#FFFFFF

Secondary Text:

#8E8E93

Divider:

#2C2C2E

Accent:

**#0A84FF** (unchanged — Apple keeps accent consistent)

---

# **2️⃣ Elevation System**

Light Mode:

Use soft shadow for depth.

Dark Mode:

No shadow.

Use contrast layering instead.

Card contrast must feel natural, not gray blocks.

---

# **3️⃣ Motion + Transition Rules**

When switching between light/dark:

Use 200ms fade.

No flash.

No abrupt shift.

Respect system preference by default:

prefers-color-scheme

Allow manual override in profile settings.

---

# **4️⃣ Status Color Behavior**

Accent Blue stays identical in both modes.

Success Green slightly softer in dark:

Light: **#34C759**

**Dark: **#30D158

Error Red slightly brighter in dark:

Light: **#FF3B30**

**Dark: **#FF453A

---

# **5️⃣ Typography Behavior**

Never pure white on pure black for long paragraphs.

In dark mode:

Primary Text: **#FFFFFF**

Secondary Body Text: **#E5E5EA**

Maintain comfortable contrast.

---

# **6️⃣ Component Adjustments (Important)**

## **Buttons**

Primary Button:

* Same blue in both modes
* Shadow in light
* No shadow in dark
* Slight brightness increase on press in dark

---

## **Cards**

Light:

White card + shadow

Dark:

#1C1C1E card + subtle border glow

---

## **Status Stepper**

Light:

Inactive: Light gray

Active: Blue

Complete: Green

Dark:

Inactive: Medium gray

Active: Blue

Complete: Softer green

---

# **7️⃣ Emotional Tone Per Mode**

Light Mode:

Professional.

Clean.

Daytime booking.

Dark Mode:

Luxury.

Evening scheduling.

Premium feel.

Dark mode should feel like:

Tesla app at night.

Not hacker mode.

---

# **8️⃣ Dashboard Hierarchy (Adaptive)**

In both modes:

If active request:

Status card dominates top.

If no request:

Book Detail CTA centered and strong.

Dark mode should not reduce clarity of CTA.

---

# **9️⃣ Implementation Rule (Very Important)**

Use CSS variables.

Example:

```
--background
--card
--text-primary
--text-secondary
--accent
--divider
--success
--error
```

Then switch via class:

.light { ... }

.dark { ... }

Never hardcode color in components.

---

# **🔟 Apple-Level Detail**

Dark mode should:

• Slightly increase corner radius perception

• Slightly reduce contrast between layers

• Maintain same spacing

Spacing must remain identical in both modes.

Never shrink padding in dark mode.

---

# **1️⃣1️⃣ UX Behavior**

When request status changes:

Blue glow is slightly more pronounced in dark mode.

Subtle highlight on state transition.

No flashing animations.

---

# **1️⃣2️⃣ System Philosophy Moving Forward**

AutoDetail now becomes:

A premium adaptive service interface.

It feels native whether:

* User is in sunlight
* User is in car at night
* User prefers dark apps
* User prefers light UI
