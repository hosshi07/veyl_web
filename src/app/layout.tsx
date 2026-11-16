import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MotionProvider } from "@/components/ui/motion-provider";
import { getSiteContent } from "@/lib/content";
import "./globals.css";

const site = getSiteContent();
export const metadata: Metadata = {
  title: {
    default: "VEYL — 扉の向こうを、知ってはいけない。",
    template: "%s | VEYL",
  },
  description: site.description,
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <body>
        <MotionProvider>
          <a className="skip-link" href="#main">
            本文へ移動
          </a>
          <SiteHeader />
          {children}
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
