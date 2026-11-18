import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
// @ts-ignore - Next.js handles global CSS imports.
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Eco Monster",
  description: "Clean, recycle and walk to grow your monster.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={fredoka.className}>{children}</body>
    </html>
  );
}