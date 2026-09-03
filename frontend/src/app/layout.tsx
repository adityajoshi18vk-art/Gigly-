import type { Metadata } from "next";
import { SpatialWrapper } from "@/components/SpatialWrapper";
import { Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import { AnonAadhaarWrapper } from "@/components/AnonAadhaarWrapper";
import { StarryBackground } from "@/components/StarryBackground";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken-grotesk" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "Gigly | On-Chain Escrow",
  description: "Secure, decentralized freelance escrow built on Polygon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${hanken.variable} ${jetbrains.variable} font-sans bg-background text-on-background antialiased min-h-screen relative`}>
        <StarryBackground />
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
