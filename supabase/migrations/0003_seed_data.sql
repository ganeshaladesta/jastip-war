-- ==============================================================================
-- JASTIP WAR — Migration 0003: Development & Production Seed Data
-- Includes Sessions, Default Categories, 16 Products, Orders, and App Settings.
-- ==============================================================================

-- 1. Seed Default Categories
INSERT INTO public.categories (id, name, slug, display_order)
VALUES
    ('11111111-1111-4111-8111-111111111101', 'Fashion', 'fashion', 1),
    ('11111111-1111-4111-8111-111111111102', 'Shoes', 'shoes', 2),
    ('11111111-1111-4111-8111-111111111103', 'Bags', 'bags', 3),
    ('11111111-1111-4111-8111-111111111104', 'Electronics', 'electronics', 4),
    ('11111111-1111-4111-8111-111111111105', 'Beauty', 'beauty', 5),
    ('11111111-1111-4111-8111-111111111106', 'Accessories', 'accessories', 6),
    ('11111111-1111-4111-8111-111111111107', 'Home & Living', 'home-living', 7),
    ('11111111-1111-4111-8111-111111111108', 'Other', 'other', 8)
ON CONFLICT (slug) DO NOTHING;

-- 2. Seed Garage Sale Sessions
INSERT INTO public.garage_sale_sessions (id, name, slug, description, location, image_url, start_date, end_date, status)
VALUES
    (
        '22222222-2222-4222-8222-222222222201',
        'Jakarta Weekend Garage Sale',
        'jakarta-weekend-garage-sale',
        'Live curation from Kemang & Senopati weekend pop-up garage sale. Handpicked sneakers, pre-loved luxury bags, and streetwear steals.',
        'Kemang Village & Senopati, Jakarta Selatan',
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85',
        NOW() - INTERVAL '1 day',
        NOW() + INTERVAL '5 days',
        'LIVE'
    ),
    (
        '22222222-2222-4222-8222-222222222202',
        'Premium Fashion Clearance',
        'premium-fashion-clearance',
        'Brand outlet clearance & private wardrobe sale in SCBD. Limited sizes, fixed jastip prices, first-come-first-served.',
        'SCBD District 8, Jakarta Selatan',
        'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1400&q=85',
        NOW() - INTERVAL '6 hours',
        NOW() + INTERVAL '3 days',
        'LIVE'
    ),
    (
        '22222222-2222-4222-8222-222222222203',
        'BSD Tech & Home Living Bazaar',
        'bsd-tech-home-living-bazaar',
        'Upcoming weekend warehouse sale featuring audio gear, lifestyle gadgets, and Japanese home essentials.',
        'ICE BSD Hall 3, Tangerang',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=85',
        NOW() + INTERVAL '3 days',
        NOW() + INTERVAL '7 days',
        'UPCOMING'
    )
ON CONFLICT (slug) DO NOTHING;

-- 3. Seed 16 Sample Products
INSERT INTO public.products (
    id, session_id, category_id, name, slug, description, condition,
    original_price, jastip_price, initial_stock, available_stock, reserved_stock, sold_stock,
    image_urls, status, is_featured
)
VALUES
    (
        '33333333-3333-4333-8333-333333333301',
        '22222222-2222-4222-8222-222222222201',
        '11111111-1111-4111-8111-111111111102',
        'Nike Air Force 1 ''07 Triple White',
        'nike-air-force-1-07-triple-white',
        'Authentic Nike Air Force 1 ''07 in crisp white leather. Size EUR 42 / US 8.5. Complete with original box from Kemang garage sale.',
        'LIKE_NEW',
        1549000,
        650000,
        3, 3, 0, 0,
        '["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        TRUE
    ),
    (
        '33333333-3333-4333-8333-333333333302',
        '22222222-2222-4222-8222-222222222201',
        '11111111-1111-4111-8111-111111111102',
        'Adidas Samba OG Cloud White Core Black',
        'adidas-samba-og-cloud-white-core-black',
        'Full-grain leather upper with suede T-toe overlay and gum sole. Size EUR 40.5. Grabbed directly from display rack.',
        'NEW',
        2200000,
        1150000,
        3, 1, 1, 1,
        '["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=1000&q=85", "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        TRUE
    ),
    (
        '33333333-3333-4333-8333-333333333303',
        '22222222-2222-4222-8222-222222222202',
        '11111111-1111-4111-8111-111111111101',
        'Uniqlo U Oversized Airism Cotton Shirt',
        'uniqlo-u-oversized-airism-cotton-shirt',
        'Brand new with tag Uniqlo U crew neck oversized tee in Earth Olive. Size L. Super breathable heavyweight feel.',
        'NEW',
        299000,
        150000,
        6, 5, 0, 1,
        '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        FALSE
    ),
    (
        '33333333-3333-4333-8333-333333333304',
        '22222222-2222-4222-8222-222222222202',
        '11111111-1111-4111-8111-111111111103',
        'Charles & Keith Gabine Leather Saddle Bag',
        'charles-keith-gabine-leather-saddle-bag',
        'Iconic curved saddle bag with gold-tone buckle accent in Classic Black. Includes dustbag and both short & long straps.',
        'LIKE_NEW',
        1199000,
        525000,
        2, 2, 0, 0,
        '["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        TRUE
    ),
    (
        '33333333-3333-4333-8333-333333333305',
        '22222222-2222-4222-8222-222222222201',
        '11111111-1111-4111-8111-111111111104',
        'Sony WH-1000XM4 Wireless Noise Cancelling Headphones',
        'sony-wh-1000xm4-wireless-headphones',
        'Industry-leading ANC headphones in Platinum Silver. Tested on-site: battery health 100%, includes hard carrying case & cables.',
        'LIKE_NEW',
        4299000,
        2150000,
        2, 1, 0, 1,
        '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        TRUE
    ),
    (
        '33333333-3333-4333-8333-333333333306',
        '22222222-2222-4222-8222-222222222202',
        '11111111-1111-4111-8111-111111111101',
        'Zara Water-Repellent Cropped Trench Jacket',
        'zara-water-repellent-cropped-trench-jacket',
        'Structured beige double-breasted cropped trench jacket. Size M. Perfect condition from SCBD fashion clearance rack.',
        'LIKE_NEW',
        1399000,
        490000,
        3, 2, 0, 1,
        '["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        FALSE
    ),
    (
        '33333333-3333-4333-8333-333333333307',
        '22222222-2222-4222-8222-222222222201',
        '11111111-1111-4111-8111-111111111106',
        'Casio Vintage A168WG-9WDF Gold Digital Watch',
        'casio-vintage-a168wg-gold-watch',
        'Original Casio Vintage series with Electro-Luminescence backlight and adjustable stainless steel clasp. Includes tin box.',
        'NEW',
        849000,
        420000,
        4, 4, 0, 0,
        '["https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        FALSE
    ),
    (
        '33333333-3333-4333-8333-333333333308',
        '22222222-2222-4222-8222-222222222202',
        '11111111-1111-4111-8111-111111111106',
        'Coach Compact ID Signature Canvas Wallet',
        'coach-compact-id-signature-canvas-wallet',
        'Refined calf leather and signature coated canvas in Charcoal/Black with removable ID window insert.',
        'NEW',
        2490000,
        980000,
        2, 1, 1, 0,
        '["https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        TRUE
    ),
    (
        '33333333-3333-4333-8333-333333333309',
        '22222222-2222-4222-8222-222222222201',
        '11111111-1111-4111-8111-111111111102',
        'New Balance 530 White Silver Navy',
        'new-balance-530-white-silver-navy',
        'ABZORB midsole cushioning retro running sneakers. Size EUR 39. Super clean mesh and metallic silver overlays.',
        'GOOD',
        1799000,
        750000,
        2, 0, 0, 2,
        '["https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'SOLD_OUT',
        FALSE
    ),
    (
        '33333333-3333-4333-8333-333333333310',
        '22222222-2222-4222-8222-222222222201',
        '11111111-1111-4111-8111-111111111104',
        'Anker Zolo 20,000mAh 30W Fast Charge Powerbank',
        'anker-zolo-20000mah-30w-powerbank',
        'Built-in USB-C braided cable, 30W two-way fast charging, digital percentage display. Sealed box clearance unit.',
        'NEW',
        599000,
        310000,
        5, 4, 0, 1,
        '["https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        FALSE
    ),
    (
        '33333333-3333-4333-8333-333333333311',
        '22222222-2222-4222-8222-222222222202',
        '11111111-1111-4111-8111-111111111106',
        'Gentle Monster Lilit 01 Flatba Sunglasses',
        'gentle-monster-lilit-01-flatba-sunglasses',
        'Square black acetate frame with 99.9% UV protection green-tint lenses. Complete with leather pouch & authenticity card.',
        'LIKE_NEW',
        3850000,
        1850000,
        1, 1, 0, 0,
        '["https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        TRUE
    ),
    (
        '33333333-3333-4333-8333-333333333312',
        '22222222-2222-4222-8222-222222222201',
        '11111111-1111-4111-8111-111111111107',
        'Stanley Quencher H2.0 FlowState Tumbler 40oz',
        'stanley-quencher-h20-flowstate-40oz',
        'Double-wall vacuum insulation in Cream Gloss. Keeps drinks iced for 48 hours. Brand new in box.',
        'NEW',
        850000,
        480000,
        4, 2, 0, 2,
        '["https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        FALSE
    ),
    (
        '33333333-3333-4333-8333-333333333313',
        '22222222-2222-4222-8222-222222222202',
        '11111111-1111-4111-8111-111111111105',
        'Dior Addict Lip Glow Oil #001 Pink (Sealed)',
        'dior-addict-lip-glow-oil-001-pink',
        'Nourishing glossy lip oil infused with cherry oil. Duty-free clearance batch, 100% sealed box.',
        'NEW',
        695000,
        435000,
        3, 2, 0, 1,
        '["https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        FALSE
    ),
    (
        '33333333-3333-4333-8333-333333333314',
        '22222222-2222-4222-8222-222222222201',
        '11111111-1111-4111-8111-111111111103',
        'Porter Yoshida & Co. Tanker Shoulder Bag S',
        'porter-yoshida-tanker-shoulder-bag-s',
        'Made in Japan flight nylon twill in Sage Green with rescue-orange interior lining. Zero scratches on snap buttons.',
        'LIKE_NEW',
        3400000,
        1690000,
        1, 0, 0, 1,
        '["https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'SOLD_OUT',
        FALSE
    ),
    (
        '33333333-3333-4333-8333-333333333315',
        '22222222-2222-4222-8222-222222222202',
        '11111111-1111-4111-8111-111111111105',
        'La Mer Crème de la Mer Moisturizing Cream 30ml',
        'la-mer-creme-de-la-mer-30ml',
        'Sealed luxury skincare clearance find with spatula and outer sleeve. Expiration date 2028.',
        'NEW',
        3150000,
        1750000,
        2, 1, 0, 1,
        '["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        FALSE
    ),
    (
        '33333333-3333-4333-8333-333333333316',
        '22222222-2222-4222-8222-222222222201',
        '11111111-1111-4111-8111-111111111107',
        'Muji Ultrasonic Aroma Diffuser Large + Lavender Oil',
        'muji-ultrasonic-aroma-diffuser-large',
        'Warm LED ambient lamp + ultrasonic mist diffuser for rooms up to 25m². Includes unopened 10ml Muji French Lavender essential oil.',
        'GOOD',
        1190000,
        540000,
        3, 3, 0, 0,
        '["https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=85"]'::jsonb,
        'PUBLISHED',
        FALSE
    )
ON CONFLICT (slug) DO NOTHING;

-- 4. Seed Sample Customers
INSERT INTO public.customers (id, full_name, whatsapp_number)
VALUES
    ('44444444-4444-4444-8444-444444444401', 'Nadya Putri Pratama', '6281288990011'),
    ('44444444-4444-4444-8444-444444444402', 'Rizky Ramadhan', '6281377665544'),
    ('44444444-4444-4444-8444-444444444403', 'Clarissa Wijaya', '6281122334455')
ON CONFLICT (id) DO NOTHING;

-- 5. Seed Sample Orders
INSERT INTO public.orders (
    id, order_reference, customer_id, customer_notes, total_amount,
    order_status, payment_status, reservation_expires_at, idempotency_key
)
VALUES
    (
        '55555555-5555-4555-8555-555555555501',
        'JW-000123',
        '44444444-4444-4444-8444-444444444401',
        'Tolong dicek bagian sol dan box aman ya kak',
        1150000,
        'WAITING_PAYMENT',
        'UNPAID',
        NOW() + INTERVAL '25 minutes',
        'seed-idem-000123'
    ),
    (
        '55555555-5555-4555-8555-555555555502',
        'JW-000124',
        '44444444-4444-4444-8444-444444444402',
        'Kirim via GoSend Instant sore ini',
        980000,
        'RESERVED',
        'WAITING_VERIFICATION',
        NOW() + INTERVAL '20 minutes',
        'seed-idem-000124'
    ),
    (
        '55555555-5555-4555-8555-555555555503',
        'JW-000125',
        '44444444-4444-4444-8444-444444444403',
        'Sudah transfer BCA a/n Clarissa',
        1500000,
        'CONFIRMED',
        'PAID',
        NOW() - INTERVAL '2 hours',
        'seed-idem-000125'
    )
ON CONFLICT (order_reference) DO NOTHING;

-- 6. Seed Order Items
INSERT INTO public.order_items (
    id, order_id, product_id, product_name_snapshot, unit_price, quantity, subtotal
)
VALUES
    (
        '66666666-6666-4666-8666-666666666601',
        '55555555-5555-4555-8555-555555555501',
        '33333333-3333-4333-8333-333333333302',
        'Adidas Samba OG Cloud White Core Black',
        1150000,
        1,
        1150000
    ),
    (
        '66666666-6666-4666-8666-666666666602',
        '55555555-5555-4555-8555-555555555502',
        '33333333-3333-4333-8333-333333333308',
        'Coach Compact ID Signature Canvas Wallet',
        980000,
        1,
        980000
    ),
    (
        '66666666-6666-4666-8666-666666666603',
        '55555555-5555-4555-8555-555555555503',
        '33333333-3333-4333-8333-333333333309',
        'New Balance 530 White Silver Navy',
        750000,
        2,
        1500000
    )
ON CONFLICT (id) DO NOTHING;

-- 7. Seed App Settings
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES
    (
        'general',
        jsonb_build_object(
            'store_name', 'JASTIP WAR',
            'tagline', 'Find It. Claim It. Get It.',
            'store_description', 'Platform Jastip Garage Sale & Pop-Up Clearance Real-Time. Harga Pasti (Fixed Price), Siapa Cepat Dia Dapat.',
            'whatsapp_number', '6281299887766',
            'store_logo', '',
            'reservation_duration_minutes', 30,
            'currency', 'IDR',
            'contact_email', 'hello@jastipwar.id',
            'contact_instagram', '@jastipwar.id',
            'public_announcement', 'LIVE SEKARANG: Jakarta Weekend Garage Sale & SCBD Fashion Clearance! Stok terbatas, claim sebelum kehabisan.',
            'terms_and_conditions', '1. Semua produk di JASTIP WAR menggunakan harga tetap (Fixed Price) yang sudah termasuk jasa titip.\n2. Sistem pemesanan adalah First-Come-First-Served (Siapa Cepat Dia Dapat).\n3. Reservasi stok berlaku selama 30 menit sejak klaim berhasil dibuat. Jika pembayaran belum dikonfirmasi via WhatsApp melewati batas waktu, stok otomatis dilepas kembali ke katalog publik.\n4. Kondisi barang dijelaskan secara transparan sesuai pengecekan langsung di lokasi event.'
        )
    )
ON CONFLICT (setting_key) DO NOTHING;

