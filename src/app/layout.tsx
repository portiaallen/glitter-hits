import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/components/providers/Providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Glitter Hits — Get Seen. Get Hits. Get Glitter.",
    template: "%s | Glitter Hits",
  },
  description:
    "A modern traffic exchange and discovery network. Earn Glitter Hits by discovering websites, then spend them to promote your own — transparently.",
  keywords: [
    "traffic exchange",
    "website discovery",
    "Glitter Hits",
    "Queerdom",
    "promotional credits",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${syne.variable} h-full`}>
      <body className="relative flex min-h-full flex-col font-sans text-foreground antialiased">
        <div className="gh-stars" aria-hidden />
        <Providers>
          <Header />
          <main className="relative z-10 flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
