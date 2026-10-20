import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AnnouncementBanner } from "@/components/layout/AnnouncementBanner";
import { FeedbackFab } from "@/components/feedback/FeedbackFab";
import { Providers } from "@/components/providers/Providers";
import { getActiveMonthlyTheme } from "@/lib/experience/monthly-theme";
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
  metadataBase: new URL("https://traffic.glitteruniverse.quest"),
  title: {
    default: "Glitter Traffic — Come Get Your Traffic",
    template: "%s | Glitter Traffic",
  },
  description:
    "Trade visits. Discover websites. Have a little fun while you're at it. A playful traffic exchange for the Queerdom — honest labels, real discovery.",
  keywords: [
    "traffic exchange",
    "website discovery",
    "Glitter Traffic",
    "Queerdom",
    "promotional credits",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://traffic.glitteruniverse.quest",
    siteName: "Glitter Traffic",
    title: "Glitter Traffic — Come Get Your Traffic",
    description:
      "Trade visits. Discover websites. Have a little fun while you're at it. A playful traffic exchange for the Queerdom — honest labels, real discovery.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getActiveMonthlyTheme();

  return (
    <html
      lang="en"
      data-month-theme={theme.cssAttr}
      className={`${outfit.variable} ${syne.variable} h-full`}
    >
      <body className="relative flex min-h-full flex-col font-sans text-foreground antialiased">
        <div className="gh-stars" aria-hidden />
        <Providers>
          <AnnouncementBanner />
          <Header />
          <main className="relative z-10 flex-1">{children}</main>
          <Footer />
          <FeedbackFab />
        </Providers>
      </body>
    </html>
  );
}
