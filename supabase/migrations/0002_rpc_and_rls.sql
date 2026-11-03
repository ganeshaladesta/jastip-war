-- ==============================================================================
-- JASTIP WAR — Migration 0002: Atomic Inventory RPCs & Row Level Security (RLS)
-- Prevents overselling, race conditions, negative stock, and duplicate claims.
-- ==============================================================================

-- Helper: Check if current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('ADMIN', 'STAFF')
    );
$$;

-- ------------------------------------------------------------------------------
-- 1. RPC: expire_overdue_reservations
-- Atomically finds unpaid reservations past reservation_expires_at and releases
-- their reserved stock back into available_stock. Idempotent and safe.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_overdue_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_expired_count INTEGER := 0;
BEGIN
    FOR v_order IN
        SELECT id, order_reference
        FROM public.orders
        WHERE order_status IN ('PENDING', 'RESERVED', 'WAITING_PAYMENT')
          AND payment_status != 'PAID'
          AND reservation_expires_at < NOW()
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Release stock for each item in this order
        FOR v_item IN
            SELECT product_id, quantity
            FROM public.order_items
            WHERE order_id = v_order.id
        LOOP
            UPDATE public.products
            SET available_stock = available_stock + v_item.quantity,
                reserved_stock = GREATEST(0, reserved_stock - v_item.quantity),
                status = CASE
                    WHEN status = 'SOLD_OUT' AND (available_stock + v_item.quantity) > 0 THEN 'PUBLISHED'
                    ELSE status
                END,
                updated_at = NOW()
            WHERE id = v_item.product_id;
        END LOOP;

        UPDATE public.orders
        SET order_status = 'EXPIRED',
            updated_at = NOW()
        WHERE id = v_order.id;

        INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, details)
        VALUES (
            NULL,
            'RESERVATION_EXPIRED',
            'ORDER',
            v_order.id,
            jsonb_build_object('order_reference', v_order.order_reference, 'reason', 'Reservation timer elapsed')
        );

        v_expired_count := v_expired_count + 1;
    END LOOP;

    RETURN v_expired_count;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. RPC: reserve_product_atomic
-- First-come-first-served atomic claim with row-level FOR UPDATE locking and
-- idempotency key deduplication.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_product_atomic(
    p_product_id UUID,
    p_quantity INTEGER,
    p_customer_name TEXT,
    p_whatsapp_number TEXT,
    p_customer_notes TEXT DEFAULT '',
    p_idempotency_key TEXT DEFAULT NULL,
    p_reservation_minutes INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_existing_order RECORD;
    v_product RECORD;
    v_session RECORD;
    v_customer_id UUID;
    v_order_id UUID;
    v_order_reference TEXT;
    v_total_amount BIGINT;
    v_expires_at TIMESTAMPTZ;
    v_new_available INTEGER;
    v_new_status TEXT;
    v_clean_key TEXT;
BEGIN
    -- Step 0: Run opportunistic expiration sweep first so expired holds are freed
    PERFORM public.expire_overdue_reservations();

    -- Validate basic inputs
    IF p_quantity IS NULL OR p_quantity < 1 THEN
        RAISE EXCEPTION 'INVALID_QUANTITY: Quantity must be at least 1.';
    END IF;

    IF TRIM(COALESCE(p_customer_name, '')) = '' THEN
        RAISE EXCEPTION 'INVALID_NAME: Customer name is required.';
    END IF;

    IF TRIM(COALESCE(p_whatsapp_number, '')) = '' THEN
        RAISE EXCEPTION 'INVALID_WHATSAPP: Valid WhatsApp number is required.';
    END IF;

    v_clean_key := COALESCE(NULLIF(TRIM(p_idempotency_key), ''), gen_random_uuid()::text);

    -- Step 1: Idempotency check (return existing reservation if already processed)
    SELECT o.id, o.order_reference, o.total_amount, o.order_status, o.payment_status, o.reservation_expires_at
    INTO v_existing_order
    FROM public.orders o
    WHERE o.idempotency_key = v_clean_key
    LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'idempotent_replay', TRUE,
            'order_id', v_existing_order.id,
            'order_reference', v_existing_order.order_reference,
            'total_amount', v_existing_order.total_amount,
            'order_status', v_existing_order.order_status,
            'reservation_expires_at', v_existing_order.reservation_expires_at
        );
    END IF;

    -- Step 2: Acquire row-level exclusive lock on the product row
    SELECT *
    INTO v_product
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PRODUCT_NOT_FOUND: Product does not exist.';
    END IF;

    IF v_product.status != 'PUBLISHED' THEN
        RAISE EXCEPTION 'OUT_OF_STOCK: Yah, stok barang sudah habis atau berhasil direbut customer lain.';
    END IF;

    -- Step 3: Validate session eligibility
    SELECT *
    INTO v_session
    FROM public.garage_sale_sessions
    WHERE id = v_product.session_id;

    IF NOT FOUND OR v_session.status NOT IN ('LIVE', 'UPCOMING') THEN
        RAISE EXCEPTION 'SESSION_INACTIVE: Sesi garage sale untuk produk ini sudah berakhir.';
    END IF;

    -- Step 4: Validate available stock under lock
    IF v_product.available_stock < p_quantity THEN
        RAISE EXCEPTION 'OUT_OF_STOCK: Yah, stok barang sudah habis atau berhasil direbut customer lain.';
    END IF;

    -- Step 5: Compute new stock & status
    v_new_available := v_product.available_stock - p_quantity;
    v_new_status := CASE WHEN v_new_available = 0 THEN 'SOLD_OUT' ELSE 'PUBLISHED' END;

    UPDATE public.products
    SET available_stock = v_new_available,
        reserved_stock = reserved_stock + p_quantity,
        status = v_new_status,
        updated_at = NOW()
    WHERE id = p_product_id;

    -- Step 6: Find or create customer record
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE whatsapp_number = TRIM(p_whatsapp_number)
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_customer_id IS NULL THEN
        INSERT INTO public.customers (full_name, whatsapp_number)
        VALUES (TRIM(p_customer_name), TRIM(p_whatsapp_number))
        RETURNING id INTO v_customer_id;
    ELSE
        UPDATE public.customers
        SET full_name = TRIM(p_customer_name),
            updated_at = NOW()
        WHERE id = v_customer_id;
    END IF;

    -- Step 7: Generate unique human-friendly Order Reference (e.g. JW-000123 / JW-XXXXXX)
    v_order_reference := 'JW-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 6));
    v_total_amount := v_product.jastip_price * p_quantity;
    v_expires_at := NOW() + (GREATEST(5, COALESCE(p_reservation_minutes, 30)) || ' minutes')::interval;

    INSERT INTO public.orders (
        order_reference,
        customer_id,
        customer_notes,
        total_amount,
        order_status,
        payment_status,
        reservation_expires_at,
        idempotency_key
    )
    VALUES (
        v_order_reference,
        v_customer_id,
        COALESCE(p_customer_notes, ''),
        v_total_amount,
        'WAITING_PAYMENT',
        'UNPAID',
        v_expires_at,
        v_clean_key
    )
    RETURNING id INTO v_order_id;

    INSERT INTO public.order_items (
        order_id,
        product_id,
        product_name_snapshot,
        unit_price,
        quantity,
        subtotal
    )
    VALUES (
        v_order_id,
        v_product.id,
        v_product.name,
        v_product.jastip_price,
        p_quantity,
        v_total_amount
    );

    INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, details)
    VALUES (
        NULL,
        'CUSTOMER_CLAIMED_PRODUCT',
        'ORDER',
        v_order_id,
        jsonb_build_object(
            'order_reference', v_order_reference,
            'product_id', v_product.id,
            'product_name', v_product.name,
            'quantity', p_quantity,
            'total_amount', v_total_amount,
            'remaining_stock', v_new_available
        )
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'idempotent_replay', FALSE,
        'order_id', v_order_id,
        'order_reference', v_order_reference,
        'product_id', v_product.id,
        'product_name', v_product.name,
        'quantity', p_quantity,
        'unit_price', v_product.jastip_price,
        'total_amount', v_total_amount,
        'remaining_stock', v_new_available,
        'order_status', 'WAITING_PAYMENT',
        'reservation_expires_at', v_expires_at
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. RPC: cancel_order_atomic
-- Releases reserved or sold stock idempotently when an order is cancelled.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_order_atomic(
    p_order_id UUID,
    p_actor_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT 'Cancelled by admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
BEGIN
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Order does not exist.';
    END IF;

    -- Idempotent check: if already cancelled or expired, do not double-release stock
    IF v_order.order_status IN ('CANCELLED', 'EXPIRED') THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'already_released', TRUE,
            'order_status', v_order.order_status
        );
    END IF;

    FOR v_item IN
        SELECT product_id, quantity
        FROM public.order_items
        WHERE order_id = v_order.id
    LOOP
        IF v_order.order_status IN ('PAID', 'CONFIRMED', 'COMPLETED') OR v_order.payment_status = 'PAID' THEN
            UPDATE public.products
            SET available_stock = available_stock + v_item.quantity,
                sold_stock = GREATEST(0, sold_stock - v_item.quantity),
                status = CASE WHEN status = 'SOLD_OUT' THEN 'PUBLISHED' ELSE status END,
                updated_at = NOW()
            WHERE id = v_item.product_id;
        ELSE
            UPDATE public.products
            SET available_stock = available_stock + v_item.quantity,
                reserved_stock = GREATEST(0, reserved_stock - v_item.quantity),
                status = CASE WHEN status = 'SOLD_OUT' THEN 'PUBLISHED' ELSE status END,
                updated_at = NOW()
            WHERE id = v_item.product_id;
        END IF;
    END LOOP;

    UPDATE public.orders
    SET order_status = 'CANCELLED',
        payment_status = CASE WHEN payment_status = 'PAID' THEN 'REFUNDED' ELSE payment_status END,
        updated_at = NOW()
    WHERE id = v_order.id;

    INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, details)
    VALUES (
        p_actor_id,
        'ORDER_CANCELLED',
        'ORDER',
        v_order.id,
        jsonb_build_object('order_reference', v_order.order_reference, 'reason', p_reason)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', v_order.id,
        'order_status', 'CANCELLED'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. RPC: confirm_order_payment_atomic
-- Transitions an order to PAID / CONFIRMED / COMPLETED and converts
-- reserved_stock into sold_stock without double-counting.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_order_payment_atomic(
    p_order_id UUID,
    p_target_status TEXT,
    p_actor_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_was_already_paid BOOLEAN;
BEGIN
    IF p_target_status NOT IN ('PAID', 'CONFIRMED', 'COMPLETED') THEN
        RAISE EXCEPTION 'INVALID_STATUS: Target status must be PAID, CONFIRMED, or COMPLETED.';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND: Order does not exist.';
    END IF;

    IF v_order.order_status IN ('CANCELLED', 'EXPIRED') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot confirm a cancelled or expired order.';
    END IF;

    v_was_already_paid := (v_order.payment_status = 'PAID' OR v_order.order_status IN ('PAID', 'CONFIRMED', 'COMPLETED'));

    IF NOT v_was_already_paid THEN
        FOR v_item IN
            SELECT product_id, quantity
            FROM public.order_items
            WHERE order_id = v_order.id
        LOOP
            UPDATE public.products
            SET reserved_stock = GREATEST(0, reserved_stock - v_item.quantity),
                sold_stock = sold_stock + v_item.quantity,
                updated_at = NOW()
            WHERE id = v_item.product_id;
        END LOOP;
    END IF;

    UPDATE public.orders
    SET order_status = p_target_status,
        payment_status = 'PAID',
        updated_at = NOW()
    WHERE id = v_order.id;

    INSERT INTO public.activity_logs (actor_id, action, entity_type, entity_id, details)
    VALUES (
        p_actor_id,
        'ORDER_' || p_target_status,
        'ORDER',
        v_order.id,
        jsonb_build_object('order_reference', v_order.order_reference, 'new_status', p_target_status)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', v_order.id,
        'order_status', p_target_status,
        'payment_status', 'PAID'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_sale_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Admins can read/write
CREATE POLICY "Admins can view profiles"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Admins can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin());

-- Garage Sale Sessions: Public can view non-archived sessions; Admins full access
CREATE POLICY "Public can view active and upcoming sessions"
    ON public.garage_sale_sessions FOR SELECT
    USING (status IN ('LIVE', 'UPCOMING', 'COMPLETED') OR public.is_admin());

CREATE POLICY "Admins can manage sessions"
    ON public.garage_sale_sessions FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Categories: Public can view; Admins full access
CREATE POLICY "Public can view categories"
    ON public.categories FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Products: Public can view PUBLISHED and SOLD_OUT products; Admins full access
CREATE POLICY "Public can view published and sold out products"
    ON public.products FOR SELECT
    USING (status IN ('PUBLISHED', 'SOLD_OUT') OR public.is_admin());

CREATE POLICY "Admins can manage products"
    ON public.products FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Customers: Strictly protected (Admins only; public reservations go through SECURITY DEFINER RPC)
CREATE POLICY "Admins can manage customers"
    ON public.customers FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Orders & Order Items: Admins only for direct table queries; public order lookup uses controlled server endpoint
CREATE POLICY "Admins can manage orders"
    ON public.orders FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage order_items"
    ON public.order_items FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Activity Logs: Admins only
CREATE POLICY "Admins can view and insert activity logs"
    ON public.activity_logs FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- App Settings: Public can read public store settings; Admins can manage all
CREATE POLICY "Public can read app settings"
    ON public.app_settings FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage app settings"
    ON public.app_settings FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

