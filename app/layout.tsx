import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/context";
import { CartProvider } from "@/lib/hooks/use-cart";
import { SNEHA } from "@/components/voice-assistant/sneha";
import { ProactiveAlerts } from "@/components/proactive-assistance/proactive-alerts";

export const metadata: Metadata = {
  title: "CampusIQ - MPSTME | Your Campus Intelligence System",
  description: "AI-powered academic operating system for MPSTME college students",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CampusIQ",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/campusiq-logo.png",
    apple: "/campusiq-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CampusIQ" />
      </head>
      <body className="antialiased relative">
        <AuthProvider>
          <CartProvider>
            {children}
            <SNEHA />
            <ProactiveAlerts />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
