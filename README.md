# JASTIP WAR — Real-Time Fixed-Price Jastip Marketplace & Inventory Management Platform

**Tagline**: *"Find It. Claim It. Get It."*

JASTIP WAR is a full-stack, mobile-first personal shopping (Jastip) marketplace and real-time inventory platform designed for garage sales, pop-up clearances, and live shopping events.

## Core Business Rules
- **100% Fixed-Price Jastip**: No bidding, no auctions, no price negotiation, and no highest bidder.
- **First-Come, First-Served Atomic Claims**: Reservations lock inventory atomically on the server with row-level locking (`SELECT ... FOR UPDATE` in PostgreSQL RPC + serialized server mutex), idempotency key deduplication, and automatic expiration of unpaid reservations.
- **Real-Time Live Stock**: Product additions, stock deductions, price updates, and status changes propagate to the public catalog in real time without requiring manual page refreshes.

---

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Framer Motion
- **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Supabase Realtime, Supabase Storage) + Hybrid Persistent Local Transactional Engine (`.data/jastip-store.json`) for instant zero-config local execution
- **Deployment**: Vercel + Supabase

---

## Database Migrations (`supabase/migrations/`)
1. `0001_initial_schema.sql`: Tables (`profiles`, `garage_sale_sessions`, `categories`, `products`, `customers`, `orders`, `order_items`, `activity_logs`, `app_settings`), `BIGINT` monetary columns, constraints, indexes, triggers, and Realtime publications.
2. `0002_rpc_and_rls.sql`: Atomic PostgreSQL RPC functions (`reserve_product_atomic`, `expire_overdue_reservations`, `cancel_order_atomic`, `confirm_order_payment_atomic`) and Row Level Security (RLS) policies.
3. `0003_seed_data.sql`: Realistic Indonesian Rupiah sample data (3 garage sale sessions, 8 default categories, 16 curated products across `AVAILABLE`, `LOW STOCK`, `LAST ITEM`, and `SOLD OUT` states, sample orders, and store settings).

---

## Local Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables** (Optional for local dev; required for cloud Supabase):
   Copy `.env.example` to `.env.local` and configure your Supabase project credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ADMIN_DEFAULT_EMAIL=admin@jastipwar.id
   ADMIN_DEFAULT_PASSWORD=JastipWarAdmin2026!
   ADMIN_SESSION_SECRET=jastip-war-production-hmac-secret-change-me
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` for the Public Marketplace or `http://localhost:3000/admin/login` for the Admin Dashboard.

4. **Run Atomic Inventory & Concurrency Verification**:
   ```bash
   npm run test:inventory
   ```

