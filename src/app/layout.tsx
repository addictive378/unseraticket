import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibrant Pulse | E-Ticket Platform",
  description: "The future of live events. Experience the pulse of tomorrow with premium ticketing and event management.",
  keywords: ["e-ticket", "events", "concerts", "festivals", "ticketing platform", "Vibrant Pulse"],
  authors: [{ name: "Adi Saputra" }],
  openGraph: {
    title: "Vibrant Pulse | E-Ticket Platform",
    description: "The future of live events. Experience the pulse of tomorrow.",
    url: "https://vibrantpulse.com",
    siteName: "Vibrant Pulse",
    images: [
      {
        url: "/og-image.jpg", // Make sure this exists or suggest creating it
        width: 1200,
        height: 630,
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibrant Pulse | E-Ticket Platform",
    description: "The future of live events. Experience the pulse of tomorrow.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
        <Providers>
          <Navbar />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
