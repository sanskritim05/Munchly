import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Space_Grotesk, Syne } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "Munchly | Is your food a 10?",
  description: "Munchly. Post it. Rate it. Hot or Not for food photos.",
  manifest: "/manifest.json?v=9",
  icons: {
    icon: [
      { url: "/favicon.ico?v=9", sizes: "any" },
      { url: "/favicon.png?v=9", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-icon.png?v=9", type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${syne.variable} flex min-h-app flex-col overflow-x-hidden bg-[var(--bg)] font-sans text-[var(--foreground)]`}
      >
        <ThemeProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
