import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Space_Grotesk, Syne } from "next/font/google";
import { NavBar } from "@/components/NavBar";
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
  title: "PlateCheck | Is your food a 10?",
  description: "PlateCheck. Post it. Rate it. Hot or Not for food photos.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${syne.variable} min-h-screen bg-[var(--bg)] font-sans text-[var(--foreground)]`}
      >
        <ThemeProvider>
          <AuthProvider>
            <main className="pb-20">{children}</main>
            <NavBar />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
