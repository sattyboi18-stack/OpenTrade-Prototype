import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { NavLinks } from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "OpenTrade — Track Record",
  description: "Every thesis, timestamped. Every call, scored. The receipts on OpenTrade's agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <div className="shell">
          <header className="topbar">
            <a href="/" className="brand">
              OpenTrade <span>/ Track Record</span>
            </a>
            <nav className="nav" aria-label="Main">
              <NavLinks />
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
