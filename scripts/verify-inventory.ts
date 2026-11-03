import assert from "node:assert/strict";
import {
  createProductAdmin,
  deleteProductAdmin,
  getAllOrdersAdmin,
  getCategories,
  getProductByIdAdmin,
  getSessions,
  reserveProductAtomic,
  updateOrderStatusAdmin,
} from "@/lib/db/repository";

async function runVerification() {
  console.log("=== JASTIP WAR: Atomic Inventory & Lifecycle Verification ===");

  const [categories, sessions] = await Promise.all([
    getCategories(),
    getSessions(false),
  ]);
  assert(categories.length > 0, "Seed categories must exist");
  assert(sessions.length > 0, "Seed sessions must exist");

  const actorId = "00000000-0000-4000-8000-000000000001";

  // 1. Create product with stock = 3, price = Rp 250.000
  const testProduct = await createProductAdmin(
    {
      name: "Nike Air Force 1 Concurrency Test",
      description: "Automated concurrency test product",
      category_id: categories[0].id,
      session_id: sessions[0].id,
      condition: "NEW",
      original_price: 1500000,
      jastip_price: 250000,
      initial_stock: 3,
      available_stock: 3,
      image_urls: [
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
      ],
      status: "PUBLISHED",
    },
    actorId
  );

  assert.equal(testProduct.available_stock, 3);
  assert.equal(testProduct.status, "PUBLISHED");
  console.log("[PASS] Created test product with stock = 3, price = Rp 250.000");

  // 2. Test Idempotency Key deduplication
  const idemKey = `test-idem-${Date.now()}`;
  const firstClaim = await reserveProductAtomic({
    productId: testProduct.id,
    quantity: 1,
    customerName: "Customer A",
    whatsappNumber: "081211112222",
    idempotencyKey: idemKey,
  });
  const replayClaim = await reserveProductAtomic({
    productId: testProduct.id,
    quantity: 1,
    customerName: "Customer A",
    whatsappNumber: "081211112222",
    idempotencyKey: idemKey,
  });

  assert.equal(firstClaim.order_reference, replayClaim.order_reference);
  assert.equal(replayClaim.idempotent_replay, true);

  let afterIdemProduct = await getProductByIdAdmin(testProduct.id);
  assert.equal(
    afterIdemProduct?.available_stock,
    2,
    "Idempotent replay must only deduct 1 unit total"
  );
  console.log(
    `[PASS] Idempotency verified: Order ${firstClaim.order_reference}, remaining stock = 2`
  );

  // 3. Test Concurrent Reservations (4 customers racing for the remaining 2 items)
  const concurrentAttempts = await Promise.allSettled([
    reserveProductAtomic({
      productId: testProduct.id,
      quantity: 1,
      customerName: "Customer B",
      whatsappNumber: "081233334444",
    }),
    reserveProductAtomic({
      productId: testProduct.id,
      quantity: 1,
      customerName: "Customer C",
      whatsappNumber: "081255556666",
    }),
    reserveProductAtomic({
      productId: testProduct.id,
      quantity: 1,
      customerName: "Customer D",
      whatsappNumber: "081277778888",
    }),
    reserveProductAtomic({
      productId: testProduct.id,
      quantity: 1,
      customerName: "Customer E",
      whatsappNumber: "081299990000",
    }),
  ]);

  const fulfilled = concurrentAttempts.filter(
    (r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof reserveProductAtomic>>> =>
      r.status === "fulfilled"
  );
  const rejected = concurrentAttempts.filter((r) => r.status === "rejected");

  assert.equal(fulfilled.length, 2, "Exactly 2 concurrent claims must succeed");
  assert.equal(rejected.length, 2, "Exactly 2 concurrent claims must be rejected");

  const soldOutProduct = await getProductByIdAdmin(testProduct.id);
  assert.equal(soldOutProduct?.available_stock, 0);
  assert.equal(soldOutProduct?.reserved_stock, 3);
  assert.equal(soldOutProduct?.status, "SOLD_OUT");
  console.log(
    "[PASS] Concurrent race test passed: 0 oversold, available_stock = 0, status = SOLD_OUT"
  );

  // 4. Test Order Cancellation releases stock & restores PUBLISHED status
  await updateOrderStatusAdmin(firstClaim.order_id, "CANCEL_ORDER", actorId);
  const afterCancelProduct = await getProductByIdAdmin(testProduct.id);
  assert.equal(afterCancelProduct?.available_stock, 1);
  assert.equal(afterCancelProduct?.reserved_stock, 2);
  assert.equal(afterCancelProduct?.status, "PUBLISHED");
  console.log(
    "[PASS] Order cancellation released 1 stock & restored PUBLISHED status"
  );

  // 5. Test Payment Confirmation moves reserved_stock -> sold_stock
  const secondOrderId = fulfilled[0].value.order_id;
  await updateOrderStatusAdmin(secondOrderId, "CONFIRM_ORDER", actorId);
  const afterConfirmProduct = await getProductByIdAdmin(testProduct.id);
  assert.equal(afterConfirmProduct?.sold_stock, 1);
  assert.equal(afterConfirmProduct?.reserved_stock, 1);
  console.log(
    "[PASS] Order payment confirmation moved reserved_stock to sold_stock"
  );

  // Clean up test orders & product
  const secondThirdIds = [
    firstClaim.order_id,
    ...fulfilled.map((f) => f.value.order_id),
  ];
  for (const oid of secondThirdIds) {
    await updateOrderStatusAdmin(oid, "CANCEL_ORDER", actorId);
  }
  await deleteProductAdmin(testProduct.id, actorId);

  const orders = await getAllOrdersAdmin();
  assert(orders.length >= 3, "Orders exist in database");
  console.log("=== ALL INVENTORY & ORDER LIFECYCLE TESTS PASSED ===");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
