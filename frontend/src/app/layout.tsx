import type { Metadata } from "next";
import { SpatialWrapper } from "@/components/SpatialWrapper";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { AnonAadhaarWrapper } from "@/components/AnonAadhaarWrapper";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gigly | Decentralized Freelance Escrow",
  description:
    "Secure, trustless freelance payments powered by on-chain escrow. Fund jobs, verify work, release payments — all protected by smart contracts.",
  keywords: ["freelance", "escrow", "blockchain", "USDC", "smart contracts", "decentralized", "Web3"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.variable} ${spaceGrotesk.variable} ${jetbrains.variable} font-sans bg-white text-[#071014] antialiased min-h-screen relative`}
      >
        <AtmosphericBackground />
        <ThirdwebProvider>
          <AnonAadhaarWrapper>
            <div className="relative z-10 flex min-h-screen flex-col">
              <SpatialWrapper>
                <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
                  {children}
                </main>
              </SpatialWrapper>
            </div>
          </AnonAadhaarWrapper>
        </ThirdwebProvider>
      </body>
    </html>
  );
}
