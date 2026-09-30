import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "AEROS | Air Quality Intelligence & Urban Exposure Observatory",
  description: "Forensic environmental air quality analytics and urban exposure observatory adhering strictly to authoritative CPCB CAAQMS methodology."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[var(--obs-bg)] text-[var(--obs-text-main)]">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-[var(--obs-border)] bg-[var(--obs-surface)] py-6 mt-12 text-xs font-mono text-[var(--obs-text-muted)]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-[var(--obs-text-main)]">
                AEROS ENVIRONMENTAL OBSERVATORY
              </span>
              <span>
                Calculated strictly adhering to official Central Pollution Control Board (CPCB) National Air Quality Index methodology.
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>OPENAQ v3 / CPCB TELEMETRY</span>
              <span className="text-[var(--obs-border)]">|</span>
              <span>OPEN-METEO WEATHER</span>
              <span className="text-[var(--obs-border)]">|</span>
              <span>ACADEMIC PORTFOLIO DEMONSTRATION</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
