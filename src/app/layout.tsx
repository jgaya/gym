import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { SiteHeader } from "@/components/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym Meraki — Fitness & Training",
  description: "Plataforma de gestión de gimnasio, rutinas y membresías de Gym Meraki",
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
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>
          <SiteHeader currentUser={currentUser} />
          <main className="flex-1 flex flex-col">{children}</main>

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
