-- ==============================================================================
-- JASTIP WAR — Migration 0001: Core Database Schema, Constraints & Indexes
-- Fixed-Price Real-Time Jastip Marketplace & Inventory Management Platform
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. profiles (Admin & Staff authorization linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('ADMIN', 'STAFF')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. garage_sale_sessions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.garage_sale_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL,
    image_url TEXT NOT NULL DEFAULT '',
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'LIVE', 'COMPLETED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_session_dates CHECK (end_date >= start_date)
);

-- ------------------------------------------------------------------------------
-- 3. categories
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. products (Monetary values stored strictly as BIGINT in IDR)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.garage_sale_sessions(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    condition TEXT NOT NULL DEFAULT 'GOOD' CHECK (condition IN ('NEW', 'LIKE_NEW', 'GOOD', 'USED')),
    original_price BIGINT CHECK (original_price IS NULL OR original_price >= 0),
    jastip_price BIGINT NOT NULL CHECK (jastip_price > 0),
    initial_stock INTEGER NOT NULL DEFAULT 1 CHECK (initial_stock >= 0),
    available_stock INTEGER NOT NULL DEFAULT 1 CHECK (available_stock >= 0),
    reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    sold_stock INTEGER NOT NULL DEFAULT 0 CHECK (sold_stock >= 0),
    image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'PUBLISHED', 'SOLD_OUT', 'ARCHIVED')),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. customers
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. orders
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_reference TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    customer_notes TEXT DEFAULT '',
    total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
    order_status TEXT NOT NULL DEFAULT 'RESERVED' CHECK (
        order_status IN (
            'PENDING',
            'RESERVED',
            'WAITING_PAYMENT',
            'PAID',
            'CONFIRMED',
            'COMPLETED',
            'CANCELLED',
            'EXPIRED'
        )
    ),
    payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (
        payment_status IN ('UNPAID', 'WAITING_VERIFICATION', 'PAID', 'REFUNDED')
    ),
    reservation_expires_at TIMESTAMPTZ NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. order_items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name_snapshot TEXT NOT NULL,
    unit_price BIGINT NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. activity_logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 9. app_settings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- Indexes for High-Performance Queries & Reservation Locking
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_session_id ON public.products(session_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available_stock ON public.products(available_stock);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.garage_sale_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_slug ON public.garage_sale_sessions(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order);
CREATE INDEX IF NOT EXISTS idx_orders_order_reference ON public.orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_reservation_expires_at ON public.orders(reservation_expires_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp_number ON public.customers(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- Automatic updated_at Trigger
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_sessions_updated_at ON public.garage_sale_sessions;
CREATE TRIGGER trg_sessions_updated_at
    BEFORE UPDATE ON public.garage_sale_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable Supabase Realtime on products, orders, and garage_sale_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.garage_sale_sessions;

