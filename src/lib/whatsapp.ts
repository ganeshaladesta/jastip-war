import { formatRupiah, normalizeWhatsAppNumber } from "@/lib/utils";

export interface WhatsAppOrderClaimPayload {
  adminWhatsApp: string;
  orderReference: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  customerName?: string;
  customerNotes?: string;
}

/**
 * Generates an encoded WhatsApp deep link for confirming a claimed order with the admin.
 */
export function buildOrderConfirmationWhatsAppUrl(payload: WhatsAppOrderClaimPayload): string {
  const cleanPhone = normalizeWhatsAppNumber(payload.adminWhatsApp || "6281299887766");
  const lines = [
    "Halo, saya sudah claim barang melalui JASTIP WAR.",
    "",
    `Order ID: ${payload.orderReference}`,
    "",
    `Produk: ${payload.productName}`,
    `Qty: ${payload.quantity}`,
    `Total: ${formatRupiah(payload.totalAmount)}`,
  ];

  if (payload.customerName) {
    lines.push(`Nama: ${payload.customerName}`);
  }
  if (payload.customerNotes && payload.customerNotes.trim()) {
    lines.push(`Catatan: ${payload.customerNotes.trim()}`);
  }

  lines.push("", "Mohon informasi pembayaran selanjutnya.");

  const encodedText = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Generates an encoded WhatsApp link for the Admin to contact a Customer directly about their order.
 */
export function buildAdminToCustomerWhatsAppUrl(params: {
  customerWhatsApp: string;
  customerName: string;
  orderReference: string;
  productName: string;
  totalAmount: number;
  orderStatus: string;
}): string {
  const cleanPhone = normalizeWhatsAppNumber(params.customerWhatsApp);
  const message = [
    `Halo Kak ${params.customerName}, kami dari Admin JASTIP WAR.`,
    "",
    `Terkait pesanan Kakak:`,
    `Order ID: ${params.orderReference}`,
    `Produk: ${params.productName}`,
    `Total: ${formatRupiah(params.totalAmount)}`,
    `Status Saat Ini: ${params.orderStatus}`,
    "",
    `Silakan konfirmasi pembayaran agar barang segera kami amankan dan proses pengiriman ya Kak. Terima kasih!`,
  ].join("\n");

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

