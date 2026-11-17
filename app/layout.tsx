import type { Metadata, Viewport } from "next";
import PageTransition from "@/components/PageTransition";
import TawkChat from "@/components/support/TawkChat";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.beauraegypt.com"),
  title: {
    default: "Beaura | Find your makeup artist",
    template: "%s | Beaura",
  },
  description: "Discover makeup artists in Egypt, explore real portfolios, compare services and prices, and manage your beauty bookings with Beaura.",
  applicationName: "Beaura",
  openGraph: {
    type: "website",
    siteName: "Beaura",
    title: "Beaura | Find your makeup artist",
    description: "Discover makeup artists, explore portfolios and organise your beauty bookings in one place.",
    url: "https://www.beauraegypt.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Beaura | Find your makeup artist",
    description: "Discover makeup artists in Egypt and organise your beauty bookings with Beaura.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#fffafc",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PageTransition>{children}</PageTransition>
        <TawkChat />
      </body>
    </html>
  );
}
