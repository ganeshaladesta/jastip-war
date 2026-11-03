import type {
  ActivityLog,
  Category,
  Customer,
  GarageSaleSession,
  Order,
  OrderItem,
  Product,
  StoreSettings,
} from "@/types/database";

export interface DatabaseState {
  sessions: GarageSaleSession[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  orders: Order[];
  order_items: OrderItem[];
  activity_logs: ActivityLog[];
  settings: StoreSettings;
}

export function createInitialSeedState(): DatabaseState {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const in25Min = new Date(now.getTime() + 25 * 60 * 1000).toISOString();
  const in20Min = new Date(now.getTime() + 20 * 60 * 1000).toISOString();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const categories: Category[] = [
    { id: "11111111-1111-4111-8111-111111111101", name: "Fashion", slug: "fashion", display_order: 1, created_at: oneDayAgo },
    { id: "11111111-1111-4111-8111-111111111102", name: "Shoes", slug: "shoes", display_order: 2, created_at: oneDayAgo },
    { id: "11111111-1111-4111-8111-111111111103", name: "Bags", slug: "bags", display_order: 3, created_at: oneDayAgo },
    { id: "11111111-1111-4111-8111-111111111104", name: "Electronics", slug: "electronics", display_order: 4, created_at: oneDayAgo },
    { id: "11111111-1111-4111-8111-111111111105", name: "Beauty", slug: "beauty", display_order: 5, created_at: oneDayAgo },
    { id: "11111111-1111-4111-8111-111111111106", name: "Accessories", slug: "accessories", display_order: 6, created_at: oneDayAgo },
    { id: "11111111-1111-4111-8111-111111111107", name: "Home & Living", slug: "home-living", display_order: 7, created_at: oneDayAgo },
    { id: "11111111-1111-4111-8111-111111111108", name: "Other", slug: "other", display_order: 8, created_at: oneDayAgo },
  ];

  const sessions: GarageSaleSession[] = [
    {
      id: "22222222-2222-4222-8222-222222222201",
      name: "Jakarta Weekend Garage Sale",
      slug: "jakarta-weekend-garage-sale",
      description:
        "Live curation from Kemang & Senopati weekend pop-up garage sale. Handpicked sneakers, pre-loved luxury bags, and streetwear steals.",
      location: "Kemang Village & Senopati, Jakarta Selatan",
      image_url:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=85",
      start_date: oneDayAgo,
      end_date: in5Days,
      status: "LIVE",
      created_at: oneDayAgo,
      updated_at: sixHoursAgo,
    },
    {
      id: "22222222-2222-4222-8222-222222222202",
      name: "Premium Fashion Clearance",
      slug: "premium-fashion-clearance",
      description:
        "Brand outlet clearance & private wardrobe sale in SCBD. Limited sizes, fixed jastip prices, first-come-first-served.",
      location: "SCBD District 8, Jakarta Selatan",
      image_url:
        "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1400&q=85",
      start_date: sixHoursAgo,
      end_date: in3Days,
      status: "LIVE",
      created_at: sixHoursAgo,
      updated_at: sixHoursAgo,
    },
    {
      id: "22222222-2222-4222-8222-222222222203",
      name: "BSD Tech & Home Living Bazaar",
      slug: "bsd-tech-home-living-bazaar",
      description:
        "Upcoming weekend warehouse sale featuring audio gear, lifestyle gadgets, and Japanese home essentials.",
      location: "ICE BSD Hall 3, Tangerang",
      image_url:
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=85",
      start_date: in3Days,
      end_date: in7Days,
      status: "UPCOMING",
      created_at: sixHoursAgo,
      updated_at: sixHoursAgo,
    },
  ];

  const products: Product[] = [
    {
      id: "33333333-3333-4333-8333-333333333301",
      session_id: "22222222-2222-4222-8222-222222222201",
      category_id: "11111111-1111-4111-8111-111111111102",
      name: "Nike Air Force 1 '07 Triple White",
      slug: "nike-air-force-1-07-triple-white",
      description:
        "Authentic Nike Air Force 1 '07 in crisp white leather. Size EUR 42 / US 8.5. Complete with original box from Kemang garage sale. Condition inspected directly on-site.",
      condition: "LIKE_NEW",
      original_price: 1549000,
      jastip_price: 650000,
      initial_stock: 3,
      available_stock: 3,
      reserved_stock: 0,
      sold_stock: 0,
      image_urls: [
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: true,
      created_at: oneDayAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333302",
      session_id: "22222222-2222-4222-8222-222222222201",
      category_id: "11111111-1111-4111-8111-111111111102",
      name: "Adidas Samba OG Cloud White Core Black",
      slug: "adidas-samba-og-cloud-white-core-black",
      description:
        "Full-grain leather upper with suede T-toe overlay and classic gum sole. Size EUR 40.5. Grabbed directly from display rack, complete with original box & tag.",
      condition: "NEW",
      original_price: 2200000,
      jastip_price: 1150000,
      initial_stock: 3,
      available_stock: 1,
      reserved_stock: 1,
      sold_stock: 1,
      image_urls: [
        "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=1000&q=85",
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: true,
      created_at: oneDayAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333303",
      session_id: "22222222-2222-4222-8222-222222222202",
      category_id: "11111111-1111-4111-8111-111111111101",
      name: "Uniqlo U Oversized Airism Cotton Shirt",
      slug: "uniqlo-u-oversized-airism-cotton-shirt",
      description:
        "Brand new with tag Uniqlo U crew neck oversized tee in Earth Olive. Size L. Super breathable heavyweight feel.",
      condition: "NEW",
      original_price: 299000,
      jastip_price: 150000,
      initial_stock: 6,
      available_stock: 5,
      reserved_stock: 0,
      sold_stock: 1,
      image_urls: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: false,
      created_at: sixHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333304",
      session_id: "22222222-2222-4222-8222-222222222202",
      category_id: "11111111-1111-4111-8111-111111111103",
      name: "Charles & Keith Gabine Leather Saddle Bag",
      slug: "charles-keith-gabine-leather-saddle-bag",
      description:
        "Iconic curved saddle bag with gold-tone buckle accent in Classic Black. Includes dustbag and both short & long straps.",
      condition: "LIKE_NEW",
      original_price: 1199000,
      jastip_price: 525000,
      initial_stock: 2,
      available_stock: 2,
      reserved_stock: 0,
      sold_stock: 0,
      image_urls: [
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: true,
      created_at: sixHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333305",
      session_id: "22222222-2222-4222-8222-222222222201",
      category_id: "11111111-1111-4111-8111-111111111104",
      name: "Sony WH-1000XM4 Wireless Noise Cancelling Headphones",
      slug: "sony-wh-1000xm4-wireless-headphones",
      description:
        "Industry-leading ANC headphones in Platinum Silver. Tested on-site: battery health 100%, includes hard carrying case & cables.",
      condition: "LIKE_NEW",
      original_price: 4299000,
      jastip_price: 2150000,
      initial_stock: 2,
      available_stock: 1,
      reserved_stock: 0,
      sold_stock: 1,
      image_urls: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: true,
      created_at: sixHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333306",
      session_id: "22222222-2222-4222-8222-222222222202",
      category_id: "11111111-1111-4111-8111-111111111101",
      name: "Zara Water-Repellent Cropped Trench Jacket",
      slug: "zara-water-repellent-cropped-trench-jacket",
      description:
        "Structured beige double-breasted cropped trench jacket. Size M. Perfect condition from SCBD fashion clearance rack.",
      condition: "LIKE_NEW",
      original_price: 1399000,
      jastip_price: 490000,
      initial_stock: 3,
      available_stock: 2,
      reserved_stock: 0,
      sold_stock: 1,
      image_urls: [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: false,
      created_at: sixHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333307",
      session_id: "22222222-2222-4222-8222-222222222201",
      category_id: "11111111-1111-4111-8111-111111111106",
      name: "Casio Vintage A168WG-9WDF Gold Digital Watch",
      slug: "casio-vintage-a168wg-gold-watch",
      description:
        "Original Casio Vintage series with Electro-Luminescence backlight and adjustable stainless steel clasp. Includes tin box.",
      condition: "NEW",
      original_price: 849000,
      jastip_price: 420000,
      initial_stock: 4,
      available_stock: 4,
      reserved_stock: 0,
      sold_stock: 0,
      image_urls: [
        "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: false,
      created_at: sixHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333308",
      session_id: "22222222-2222-4222-8222-222222222202",
      category_id: "11111111-1111-4111-8111-111111111106",
      name: "Coach Compact ID Signature Canvas Wallet",
      slug: "coach-compact-id-signature-canvas-wallet",
      description:
        "Refined calf leather and signature coated canvas in Charcoal/Black with removable ID window insert.",
      condition: "NEW",
      original_price: 2490000,
      jastip_price: 980000,
      initial_stock: 2,
      available_stock: 1,
      reserved_stock: 1,
      sold_stock: 0,
      image_urls: [
        "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: true,
      created_at: sixHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333309",
      session_id: "22222222-2222-4222-8222-222222222201",
      category_id: "11111111-1111-4111-8111-111111111102",
      name: "New Balance 530 White Silver Navy",
      slug: "new-balance-530-white-silver-navy",
      description:
        "ABZORB midsole cushioning retro running sneakers. Size EUR 39. Super clean mesh and metallic silver overlays.",
      condition: "GOOD",
      original_price: 1799000,
      jastip_price: 750000,
      initial_stock: 2,
      available_stock: 0,
      reserved_stock: 0,
      sold_stock: 2,
      image_urls: [
        "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "SOLD_OUT",
      is_featured: false,
      created_at: oneDayAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333310",
      session_id: "22222222-2222-4222-8222-222222222201",
      category_id: "11111111-1111-4111-8111-111111111104",
      name: "Anker Zolo 20,000mAh 30W Fast Charge Powerbank",
      slug: "anker-zolo-20000mah-30w-powerbank",
      description:
        "Built-in USB-C braided cable, 30W two-way fast charging, digital percentage display. Sealed box clearance unit.",
      condition: "NEW",
      original_price: 599000,
      jastip_price: 310000,
      initial_stock: 5,
      available_stock: 4,
      reserved_stock: 0,
      sold_stock: 1,
      image_urls: [
        "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: false,
      created_at: sixHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333311",
      session_id: "22222222-2222-4222-8222-222222222202",
      category_id: "11111111-1111-4111-8111-111111111106",
      name: "Gentle Monster Lilit 01 Flatba Sunglasses",
      slug: "gentle-monster-lilit-01-flatba-sunglasses",
      description:
        "Square black acetate frame with 99.9% UV protection green-tint lenses. Complete with leather pouch & authenticity card.",
      condition: "LIKE_NEW",
      original_price: 3850000,
      jastip_price: 1850000,
      initial_stock: 1,
      available_stock: 1,
      reserved_stock: 0,
      sold_stock: 0,
      image_urls: [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: true,
      created_at: twoHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333312",
      session_id: "22222222-2222-4222-8222-222222222201",
      category_id: "11111111-1111-4111-8111-111111111107",
      name: "Stanley Quencher H2.0 FlowState Tumbler 40oz",
      slug: "stanley-quencher-h20-flowstate-40oz",
      description:
        "Double-wall vacuum insulation in Cream Gloss. Keeps drinks iced for 48 hours. Brand new in box.",
      condition: "NEW",
      original_price: 850000,
      jastip_price: 480000,
      initial_stock: 4,
      available_stock: 2,
      reserved_stock: 0,
      sold_stock: 2,
      image_urls: [
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: false,
      created_at: twoHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333313",
      session_id: "22222222-2222-4222-8222-222222222202",
      category_id: "11111111-1111-4111-8111-111111111105",
      name: "Dior Addict Lip Glow Oil #001 Pink (Sealed)",
      slug: "dior-addict-lip-glow-oil-001-pink",
      description:
        "Nourishing glossy lip oil infused with cherry oil. Duty-free clearance batch, 100% sealed box.",
      condition: "NEW",
      original_price: 695000,
      jastip_price: 435000,
      initial_stock: 3,
      available_stock: 2,
      reserved_stock: 0,
      sold_stock: 1,
      image_urls: [
        "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: false,
      created_at: twoHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333314",
      session_id: "22222222-2222-4222-8222-222222222201",
      category_id: "11111111-1111-4111-8111-111111111103",
      name: "Porter Yoshida & Co. Tanker Shoulder Bag S",
      slug: "porter-yoshida-tanker-shoulder-bag-s",
      description:
        "Made in Japan flight nylon twill in Sage Green with rescue-orange interior lining. Zero scratches on snap buttons.",
      condition: "LIKE_NEW",
      original_price: 3400000,
      jastip_price: 1690000,
      initial_stock: 1,
      available_stock: 0,
      reserved_stock: 0,
      sold_stock: 1,
      image_urls: [
        "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "SOLD_OUT",
      is_featured: false,
      created_at: oneDayAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333315",
      session_id: "22222222-2222-4222-8222-222222222202",
      category_id: "11111111-1111-4111-8111-111111111105",
      name: "La Mer Crème de la Mer Moisturizing Cream 30ml",
      slug: "la-mer-creme-de-la-mer-30ml",
      description:
        "Sealed luxury skincare clearance find with spatula and outer sleeve. Expiration date 2028.",
      condition: "NEW",
      original_price: 3150000,
      jastip_price: 1750000,
      initial_stock: 2,
      available_stock: 1,
      reserved_stock: 0,
      sold_stock: 1,
      image_urls: [
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: false,
      created_at: twoHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "33333333-3333-4333-8333-333333333316",
      session_id: "22222222-2222-4222-8222-222222222201",
      category_id: "11111111-1111-4111-8111-111111111107",
      name: "Muji Ultrasonic Aroma Diffuser Large + Lavender Oil",
      slug: "muji-ultrasonic-aroma-diffuser-large",
      description:
        "Warm LED ambient lamp + ultrasonic mist diffuser for rooms up to 25m². Includes unopened 10ml Muji French Lavender essential oil.",
      condition: "GOOD",
      original_price: 1190000,
      jastip_price: 540000,
      initial_stock: 3,
      available_stock: 3,
      reserved_stock: 0,
      sold_stock: 0,
      image_urls: [
        "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=85",
      ],
      status: "PUBLISHED",
      is_featured: false,
      created_at: twoHoursAgo,
      updated_at: twoHoursAgo,
    },
  ];

  const customers: Customer[] = [
    {
      id: "44444444-4444-4444-8444-444444444401",
      full_name: "Nadya Putri Pratama",
      whatsapp_number: "6281288990011",
      created_at: twoHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "44444444-4444-4444-8444-444444444402",
      full_name: "Rizky Ramadhan",
      whatsapp_number: "6281377665544",
      created_at: twoHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "44444444-4444-4444-8444-444444444403",
      full_name: "Clarissa Wijaya",
      whatsapp_number: "6281122334455",
      created_at: sixHoursAgo,
      updated_at: twoHoursAgo,
    },
  ];

  const orders: Order[] = [
    {
      id: "55555555-5555-4555-8555-555555555501",
      order_reference: "JW-000123",
      customer_id: "44444444-4444-4444-8444-444444444401",
      customer_notes: "Tolong dicek bagian sol dan box aman ya kak",
      total_amount: 1150000,
      order_status: "WAITING_PAYMENT",
      payment_status: "UNPAID",
      reservation_expires_at: in25Min,
      idempotency_key: "seed-idem-000123",
      created_at: twoHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "55555555-5555-4555-8555-555555555502",
      order_reference: "JW-000124",
      customer_id: "44444444-4444-4444-8444-444444444402",
      customer_notes: "Kirim via GoSend Instant sore ini",
      total_amount: 980000,
      order_status: "RESERVED",
      payment_status: "WAITING_VERIFICATION",
      reservation_expires_at: in20Min,
      idempotency_key: "seed-idem-000124",
      created_at: twoHoursAgo,
      updated_at: twoHoursAgo,
    },
    {
      id: "55555555-5555-4555-8555-555555555503",
      order_reference: "JW-000125",
      customer_id: "44444444-4444-4444-8444-444444444403",
      customer_notes: "Sudah transfer BCA a/n Clarissa",
      total_amount: 1500000,
      order_status: "CONFIRMED",
      payment_status: "PAID",
      reservation_expires_at: twoHoursAgo,
      idempotency_key: "seed-idem-000125",
      created_at: sixHoursAgo,
      updated_at: twoHoursAgo,
    },
  ];

  const order_items: OrderItem[] = [
    {
      id: "66666666-6666-4666-8666-666666666601",
      order_id: "55555555-5555-4555-8555-555555555501",
      product_id: "33333333-3333-4333-8333-333333333302",
      product_name_snapshot: "Adidas Samba OG Cloud White Core Black",
      unit_price: 1150000,
      quantity: 1,
      subtotal: 1150000,
      created_at: twoHoursAgo,
    },
    {
      id: "66666666-6666-4666-8666-666666666602",
      order_id: "55555555-5555-4555-8555-555555555502",
      product_id: "33333333-3333-4333-8333-333333333308",
      product_name_snapshot: "Coach Compact ID Signature Canvas Wallet",
      unit_price: 980000,
      quantity: 1,
      subtotal: 980000,
      created_at: twoHoursAgo,
    },
    {
      id: "66666666-6666-4666-8666-666666666603",
      order_id: "55555555-5555-4555-8555-555555555503",
      product_id: "33333333-3333-4333-8333-333333333309",
      product_name_snapshot: "New Balance 530 White Silver Navy",
      unit_price: 750000,
      quantity: 2,
      subtotal: 1500000,
      created_at: sixHoursAgo,
    },
  ];

  const activity_logs: ActivityLog[] = [
    {
      id: "77777777-7777-4777-8777-777777777701",
      actor_id: "00000000-0000-4000-8000-000000000001",
      action: "SESSION_ACTIVATED",
      entity_type: "SESSION",
      entity_id: "22222222-2222-4222-8222-222222222201",
      details: { session_name: "Jakarta Weekend Garage Sale", status: "LIVE" },
      created_at: oneDayAgo,
    },
    {
      id: "77777777-7777-4777-8777-777777777702",
      actor_id: "00000000-0000-4000-8000-000000000001",
      action: "PRODUCT_CREATED",
      entity_type: "PRODUCT",
      entity_id: "33333333-3333-4333-8333-333333333311",
      details: {
        product_name: "Gentle Monster Lilit 01 Flatba Sunglasses",
        jastip_price: 1850000,
        stock: 1,
      },
      created_at: twoHoursAgo,
    },
    {
      id: "77777777-7777-4777-8777-777777777703",
      actor_id: "00000000-0000-4000-8000-000000000001",
      action: "ORDER_CONFIRMED",
      entity_type: "ORDER",
      entity_id: "55555555-5555-4555-8555-555555555503",
      details: { order_reference: "JW-000125", total_amount: 1500000 },
      created_at: twoHoursAgo,
    },
  ];

  const settings: StoreSettings = {
    store_name: "JASTIP WAR",
    tagline: "Find It. Claim It. Get It.",
    store_description:
      "Platform Jastip Garage Sale & Pop-Up Clearance Real-Time. Harga Pasti (Fixed Price), Siapa Cepat Dia Dapat.",
    whatsapp_number: "6281299887766",
    store_logo: "",
    reservation_duration_minutes: 30,
    currency: "IDR",
    contact_email: "hello@jastipwar.id",
    contact_instagram: "@jastipwar.id",
    public_announcement:
      "LIVE SEKARANG: Jakarta Weekend Garage Sale & SCBD Fashion Clearance! Harga tetap (Fixed Price), stok terbatas, siapa cepat dia dapat.",
    terms_and_conditions:
      "1. Semua produk di JASTIP WAR menggunakan harga tetap (Fixed Price) yang sudah termasuk biaya jasa titip (Tidak ada lelang/bidding atau tawar-menawar).\n2. Sistem pemesanan menggunakan mekanisme First-Come-First-Served (Siapa Cepat Dia Dapat).\n3. Reservasi stok berlaku sesuai durasi batas waktu (default 30 menit) sejak klaim dibuat. Apabila pembayaran belum dikonfirmasi melewati batas waktu tersebut, reservasi otomatis kedaluwarsa (EXPIRED) dan stok kembali tersedia bagi pembeli lain.\n4. Kondisi produk dijelaskan secara transparan sesuai hasil kurasi langsung di lokasi garage sale.",
  };

  return {
    sessions,
    categories,
    products,
    customers,
    orders,
    order_items,
    activity_logs,
    settings,
  };
}

