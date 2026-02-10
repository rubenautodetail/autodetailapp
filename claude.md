# Project Instructions for Claude

## Identity Check
Always address me as "Omar" in your responses. If you stop doing this, I'll know you're not reading these instructions.

## Project Overview
**Auto Detailer On-Demand Platform** - A bilingual (English/Spanish) marketplace connecting customers with mobile car detailing contractors. Built with Next.js 14, Strapi CMS, and Stripe Connect.

### Tech Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Strapi CMS (headless) + Supabase PostgreSQL
- **State:** React Context API (BookingContext, ContractorContext, AuthContext)
- **Maps:** @react-google-maps/api (Google Maps + Places API)
- **Payment:** Stripe Connect (marketplace with 15% commission)
- **Auth:** Strapi JWT authentication

### Project Status (Feb 9, 2026)
- ✅ 30% Complete
- ✅ State Management (Context API)
- ✅ Google Maps Integration
- ✅ Service Selection UI
- ⏳ Booking Flow (in progress)
- ❌ Contractor Management (not started)
- ❌ Payment Integration (80% backend, 0% frontend)

## Core Principles
- Write clean, readable, maintainable code over clever solutions
- Document complex logic with clear comments
- Test critical functionality before marking tasks complete
- Ask clarifying questions when requirements are ambiguous

## Code Conventions

### React/Next.js Standards
- Use functional components with hooks
- Prefer async/await over promise chains
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- **ALWAYS use TypeScript** - This project is 100% TypeScript

### File Organization (Project-Specific)
```
frontend/src/
├── app/                    # Next.js 14 App Router
│   ├── [lang]/            # Bilingual routes (en/es)
│   │   ├── services/      # Service selection page
│   │   ├── booking/       # Booking flow pages
│   │   └── ...
│   ├── layout.tsx         # Root layout with Providers
│   └── globals.css        # Tailwind imports
├── components/
│   ├── booking/           # Booking-related components
│   ├── maps/              # Google Maps components
│   └── payment/           # Payment components (coming soon)
├── contexts/              # React Context state management
│   ├── BookingContext.tsx
│   ├── ContractorContext.tsx
│   └── AuthContext.tsx
├── lib/                   # Utilities
│   └── mapUtils.ts        # Distance calculations, etc.
└── types/                 # TypeScript types (if needed)

backend/src/
├── api/                   # Strapi API customizations
├── services/              # Business logic
└── scripts/               # Utility scripts
```

### Styling (Project-Specific)
- **Tailwind CSS** - Use utility classes
- **No CSS Modules** - All Tailwind utilities
- **Responsive Design** - Mobile-first approach
- **Color Scheme:** Blue (primary), Gray (neutral), Green (success)
- **Naming:** Use descriptive class names like `border-blue-500 bg-blue-50`

## Development Workflow

### Before Starting Work
1. Read relevant existing code to understand patterns
2. Check for similar implementations elsewhere in codebase
3. Confirm approach aligns with existing architecture

### During Development
- Write descriptive commit messages
- Add comments for non-obvious logic
- Consider edge cases and error handling
- Ensure responsive design on mobile and desktop

### Before Completing Tasks
- Test the feature in browser/runtime
- Check for console errors or warnings
- Verify accessibility basics (keyboard navigation, screen reader compatibility)
- Run linter if configured
- Document any new environment variables or setup steps

## Testing & Quality
- Add tests for critical business logic
- Test user-facing features manually
- Handle loading states, error states, and empty states
- Validate form inputs and API responses

## What NOT to Do
- Don't refactor working code unless explicitly asked
- Don't add dependencies without discussing rationale
- Don't remove existing comments or documentation
- Don't assume requirements - ask when unclear
- Don't commit commented-out code or debug logs

## Documentation
When adding new features or making significant changes:
- Update README.md if setup/usage changes
- Document environment variables in .env.example
- Add inline comments for complex algorithms
- Create or update relevant markdown docs in `/docs`

## Project-Specific Patterns

### Bilingual Support (CRITICAL)
**Every component must support English/Spanish:**
```tsx
interface ComponentProps {
  locale?: "en" | "es";  // Always include this
}

// Use ternary for text:
const text = locale === "es" ? "Texto en español" : "English text";

// Context types must have both:
interface Service {
  name: string;
  nameEs: string;  // ALWAYS include Spanish variant
  description: string;
  descriptionEs: string;
}
```

### Context Usage (CRITICAL)
**We use Context API, NOT Zustand:**
```tsx
// ✅ Correct
import { useBooking } from "@/contexts";
const { setService, total } = useBooking();

// ❌ Wrong - Don't use Zustand
import { useStore } from "zustand";
```

### State Management Pattern
- `BookingContext` - Service selection, pricing, location, schedule
- `ContractorContext` - Contractor availability, selection
- `AuthContext` - Strapi authentication (JWT)
- Always update state immutably
- Pricing auto-calculates on service/add-on changes

### Adapted from Uber Clone
This project is based on patterns from an Uber clone repository:
- Service cards → Adapted from driver selection cards
- Pricing summary → Adapted from ride fare breakdown
- Map components → Adapted from driver location map
- Multi-step flow → Adapted from ride booking flow

**Key adaptations:**
- Zustand → Context API (Omar's preference)
- Clerk Auth → Strapi Auth
- Simple pricing → Service + add-ons + fees
- English-only → Full bilingual support

### API Integration
**Strapi Backend:**
```tsx
// Always use environment variable
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

// Fetch pattern:
const response = await fetch(`${STRAPI_URL}/api/services?locale=${locale}`);
const data = await response.json();

// Error handling:
try {
  // API call
} catch (error) {
  console.error("Error:", error);
  // Show user-friendly message
}
```

### Google Maps Integration
```tsx
// Always check API key exists
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Use our custom components:
import { GoogleAddressInput, ContractorMap } from "@/components/maps";
import { calculateDistance } from "@/lib/mapUtils";
```

## Testing Strategy
**Before marking anything complete:**
1. Test in browser at `http://localhost:3000`
2. Test both English (`/en/...`) and Spanish (`/es/...`) versions
3. Check pricing calculations are correct
4. Verify state updates in React DevTools
5. Test on mobile viewport (responsive)
6. Check browser console for errors

## Common Gotchas
- **Routes:** Always use `/[lang]/page-name` not `/page-name`
- **Images:** Use Next.js `<Image>` component with width/height
- **Contexts:** Must be wrapped in `<Providers>` in layout.tsx
- **Mock Data:** We use mock data for services until Strapi is connected
- **ZIP Validation:** Need to create API endpoint for this

## Documentation
**Key docs to reference:**
- `/docs/UBER_CLONE_ANALYSIS.md` - What we extracted from Uber clone
- `/docs/EXTRACTION_COMPLETE_SUMMARY.md` - Implementation details
- `/frontend/src/docs/CONTEXT_USAGE_GUIDE.md` - How to use contexts
- `/docs/SESSION_3_COMPLETE.md` - Latest progress summary

## Additional Context
For detailed technical documentation, check:
- `/docs` folder for architecture decisions and guides
- `README.md` for setup and usage instructions
- Component files for inline documentation

## Next Steps (Priority Order)
1. ⏳ Build location input page with Google Maps
2. ⏳ Build schedule picker (date + time windows)
3. ⏳ Connect to Strapi API (replace mock data)
4. ⏳ Build payment integration (Stripe Connect)
5. ❌ Build contractor management system

---
*This file is actively maintained. Update it whenever you discover new patterns, conventions, or important context about this auto detailer platform.*

**Last Updated:** February 9, 2026 by Claude (Session 3 - Uber Clone Extraction)