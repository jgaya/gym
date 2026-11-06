import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { SiteHeader } from "@/components/SiteHeader";
import { PwaManager } from "@/components/PwaManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Meraki Centro de Entrenamiento — Fitness & Training",
  description: "Plataforma de gestión de gimnasio, rutinas y membresías de Meraki Centro de Entrenamiento",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meraki",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

const themeInitScript = `
  (function() {
    try {
      var storedTheme = localStorage.getItem('gym-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      var storedFont = localStorage.getItem('gym-font-size');
      if (storedFont) {
        document.documentElement.style.fontSize = storedFont;
      }
    } catch (e) {}
  })();
`;

import { getCurrentUser } from "@/lib/auth";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const currentUser = await getCurrentUser();

  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>
          <SiteHeader currentUser={currentUser} />
          <main className="flex-1 flex flex-col">{children}</main>
          <PwaManager />

          <footer className="border-t border-border bg-surface transition-colors duration-200">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 text-center text-sm text-content-muted sm:px-6">
              <a
                href="https://mintorksoft.com.ar"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:text-content transition-colors"
              >
                Mintork Soft
              </a>
              &nbsp;(c) {new Date().getFullYear()} - Gym Meraki - Plataforma de gestión y entrenamiento.
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
