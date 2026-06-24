import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PWAProvider } from "@/components/pwa/firebase-provider";
import InstallPrompt from "@/components/pwa/install-prompt";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Contact Bulk Notification",
  description: "Send bulk notifications to your contacts - Install this PWA to stay connected",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ContactNotif",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0f1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ContactNotif" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="ContactNotif" />
        <meta name="msapplication-TileColor" content="#0a0f1a" />
        <meta name="msapplication-config" content="none" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-40">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-center">
            <img
              src="/images/logo.png"
              alt="Contact Bulk Notification"
              className="h-14 md:h-16 w-auto max-w-full brightness-110"
            />
          </div>
        </header>

        <ServiceWorkerRegistration>
          <PWAProvider>
            <div className="pt-20">
              {children}
            </div>
            <InstallPrompt />
          </PWAProvider>
        </ServiceWorkerRegistration>
      </body>
    </html>
  );
}
