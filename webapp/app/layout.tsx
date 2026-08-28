import type { Metadata } from "next";
import { PT_Serif, Golos_Text } from "next/font/google";
import "./globals.css";

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "700"],
});

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AI ҰСТАЗ — сервис",
  description: "AI ҰСТАЗ платформасының жұмыс кабинеттері",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="kk" className={`${ptSerif.variable} ${golos.variable} h-full antialiased`}>
      <body className="min-h-full bg-cream text-ink-800">{children}</body>
    </html>
  );
}
