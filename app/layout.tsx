import type { Metadata } from "next";
import { Familjen_Grotesk, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { NavLinks } from "@/components/NavLinks";

const display = Familjen_Grotesk({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "OpenTrade — Track Record",
  description: "Every thesis, timestamped. Every call, scored. The receipts on OpenTrade's agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
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
