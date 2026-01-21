# Rubens Auto Detail Platform

A bilingual (EN/ES) on-demand mobile car detailing marketplace built with Next.js 16 and Strapi v5.

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.4 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules
- **State Management**: Zustand
- **i18n**: Custom middleware with dynamic routing

### Backend
- **CMS**: Strapi v5.33.3
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Payment**: Stripe Connect

## Project Structure

```
rubens-auto-detail/
├── backend/          # Strapi CMS
├── frontend/         # Next.js application
├── context/          # Design mockups and documentation
└── docs/            # Technical guidelines
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase database credentials

4. Start Strapi:
   ```bash
   npm run develop
   ```

5. Access admin panel at `http://localhost:1337/admin`

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Strapi URL and API tokens

4. Start development server:
   ```bash
   npm run dev
   ```

5. Access application at:
   - English: `http://localhost:3000/en`
   - Spanish: `http://localhost:3000/es`

## Features

- ✓ Bilingual support (English/Spanish)
- ✓ Service zone management (ZIP code coverage)
- ✓ Service packages with add-ons
- ✓ Contractor management
- ✓ Booking system
- ✓ Customer profiles
- ✓ Premium dark theme design

## License

Proprietary
