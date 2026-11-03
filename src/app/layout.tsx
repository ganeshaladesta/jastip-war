import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "JASTIP WAR — Find It. Claim It. Get It.",
    template: "%s | JASTIP WAR",
  },
  description:
    "Discover exclusive garage sale finds, limited-stock products, and special fixed-price jastip deals in real time. First-come, first-served.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAF9F6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-dvh bg-[#FAF9F6] font-sans text-zinc-900 antialiased selection:bg-orange-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
