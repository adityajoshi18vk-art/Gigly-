import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThirdwebProvider } from "thirdweb/react";
import { AnonAadhaarWrapper } from "@/components/AnonAadhaarWrapper";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Gigly - Web3 Freelance Escrow",
  description: "Secure, gasless freelance payments on Polygon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#F9FAFB] text-slate-900`}>
        <ThirdwebProvider>
          <AnonAadhaarWrapper>
            {children}
          </AnonAadhaarWrapper>
        </ThirdwebProvider>
      </body>
    </html>
  );
}

