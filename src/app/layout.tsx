import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "../components/layout/Header";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Echolink Blockchain Foundations | Echolink Simulation Engine",
  description:
    "Learn blockchain by building and operating it. A hands-on simulation platform from Echolink Solutions, hash real data, link real blocks, break real chains, and prove what you can do.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-lab-950 font-body text-white antialiased">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
