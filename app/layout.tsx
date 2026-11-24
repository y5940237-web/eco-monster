import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fredoka, Lilita_One, Nunito } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
// Extra fonts for the egg names and descriptions on the "Choose your egg" page
const lilita = Lilita_One({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Eco Monster",
  description: "Clean, recycle and walk to grow your monster.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fredoka.className} ${lilita.variable} ${nunito.variable}`}>{children}</body>
    </html>
  );
}