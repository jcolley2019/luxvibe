# Luxvibe - Hotel Booking Platform

## Overview

Luxvibe is a full-stack hotel booking web application. It features a clean minimal homepage with recommended hotels loaded immediately (no search required), popular destination chips, sort/filter on results, wishlist heart buttons, and rating labels (Exceptional, Wonderful, etc.). It integrates with the LiteAPI travel service for real-time hotel data, uses Replit Auth for user authentication, and implements the full LiteAPI booking flow: places autocomplete → rates search (destination or AI/vibe) → prebook → LiteAPI Payment SDK → book → confirmation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with routes: `/` (home/search), `/hotel/:id` (details), `/checkout` (guest form + payment), `/booking-confirmation` (post-payment booking), `/my-bookings` (user bookings)
- **State Management**: TanStack React Query for server state (caching, fetching, mutations)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with CSS variables for theming, custom fonts (Plus Jakarta Sans for body, Playfair Display for headings)
- **Animations**: Framer Motion for page transitions and UI element animations
- **Date Handling**: date-fns for formatting, react-day-picker for calendar date selection
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express.js running on Node with TypeScript (compiled via tsx in dev, esbuild for production)
- **API Design**: RESTful JSON API under `/api/` prefix. Route contracts defined in `shared/routes.ts` with Zod schemas for request/response validation
- **Key API Endpoints**:
  - `GET /api/places?q=...` - Places autocomplete via LiteAPI
  - `GET /api/hotels/search` - Search hotels via LiteAPI (supports destination, placeId, aiSearch)
  - `GET /api/hotels/semantic-search?query=...` - AI semantic search via LiteAPI Agentic (returns hotels with tags, persona, style, story)
  - `GET /api/hotels/:id` - Get hotel details + rates via LiteAPI
  - `GET /api/hotels/:id/reviews` - Get hotel reviews with AI sentiment analysis (categories, pros, cons)
  - `POST /api/hotels/prebook` - Prebook a rate via LiteAPI (returns secretKey for Payment SDK)
  - `POST /api/hotels/book` - Complete booking via LiteAPI with transactionId from payment
  - `GET /api/bookings` - Get user's bookings (authenticated)
  - `GET /api/auth/user` - Get current authenticated user
  - `GET /api/login` / `GET /api/logout` - Auth flow endpoints
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js, sessions stored in PostgreSQL via connect-pg-simple
- **Dev Server**: Vite dev server middleware is attached to Express in development for HMR

### Data Storage
- **Database**: PostgreSQL (required, connected via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema** (in `shared/schema.ts` and `shared/models/auth.ts`):
  - `users` - User profiles (managed by Replit Auth, stores id, email, name, profile image)
  - `sessions` - Session storage for express-session (mandatory for Replit Auth)
  - `bookings` - Hotel reservations (userId, hotelId, hotelName, roomType, checkIn, checkOut, guests, totalPrice, status)
- **Migrations**: Use `npm run db:push` (drizzle-kit push) to sync schema to database

### Shared Code
- `shared/schema.ts` - Database table definitions and Zod insert schemas
- `shared/routes.ts` - API route contracts with Zod validation schemas (acts as a typed API contract between frontend and backend)
- `shared/models/auth.ts` - Auth-related table definitions (users, sessions)

### Build & Deploy
- **Dev**: `npm run dev` runs tsx to start the Express server with Vite middleware
- **Build**: `npm run build` runs a custom script (`script/build.ts`) that builds the Vite frontend to `dist/public` and bundles the server with esbuild to `dist/index.cjs`
- **Production**: `npm start` runs the built `dist/index.cjs` which serves the static frontend and API

## External Dependencies

### LiteAPI Travel API
- **Purpose**: Provides real-time hotel search, hotel details, room rates, and availability
- **Base URL**: `https://api.liteapi.travel/v3.0`
- **Booking Base URL**: `https://book.liteapi.travel/v3.0`
- **Authentication**: API key via `X-API-Key` header
- **Environment Variable**: `LITEAPI_KEY` (required)
- **Usage**: Server-side only - the backend proxies requests to LiteAPI and transforms responses for the frontend
- **Agentic AI Features** (LiteAPI Agentic tier):
  - `GET /data/hotels/semantic-search?query=...` — AI-powered natural language hotel discovery with semantic tags, persona, style, and story attributes
  - `GET /data/reviews?hotelId=...&getSentiment=true` — AI sentiment analysis of 1000+ reviews returning category scores (1-10), AI-generated pros and cons lists
  - Powers the floating AI Concierge chat widget (`AiAssistant.tsx`) and "Discover by Vibe" section on home page

### PostgreSQL Database
- **Environment Variable**: `DATABASE_URL` (required, connection string)
- **Used For**: User data, session storage, booking records
- **Session Table**: Must exist for Replit Auth to work (created by drizzle-kit push)

### Replit Auth (OpenID Connect)
- **Environment Variables**: `ISSUER_URL` (defaults to `https://replit.com/oidc`), `REPL_ID`, `SESSION_SECRET`
- **Purpose**: User authentication via Replit's OAuth/OIDC flow
- **Flow**: Login redirects to `/api/login`, callback handled by Passport.js, user info upserted to `users` table

### LiteAPI Payment SDK
- **Script URL**: `https://payment-wrapper.liteapi.travel/dist/liteAPIPayment.js?v=a1`
- **Public Key**: `"sandbox"` for sandbox keys (sand_ prefix), `"live"` for prod keys
- **Flow**: Prebook returns `secretKey` → SDK initialized with secretKey → user pays → redirect to `/booking-confirmation?prebookId=...&transactionId=...` → book API called

### Key npm Packages
- `express` - HTTP server
- `drizzle-orm` + `drizzle-kit` - Database ORM and migration tooling
- `passport` + `openid-client` - Authentication
- `zod` + `drizzle-zod` - Schema validation
- `@tanstack/react-query` - Client-side data fetching
- `framer-motion` - Animations
- `react-day-picker` + `date-fns` - Date selection and formatting
- `wouter` - Client-side routing
- shadcn/ui ecosystem (Radix UI, Tailwind CSS, class-variance-authority)
- `react-i18next` + `i18next` - Internationalization (15 languages: EN, FR, ES, DE, IT, PT, NL, TR, RU, JA, ZH, KO, AR, EL, RO)
- `leaflet` + `@types/leaflet` - Interactive maps for hotel location display
