import { Syne } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
  variable: "--font-syne",
});

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${syne.variable} font-sans`}>{children}</div>;
}
