import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ocean Ledger",
  description: "Blockchain-Powered Freelance Escrow Ecosystem",
};

import { Providers } from "@/components/Providers";
import { TransparencyPanel } from "@/components/TransparencyPanel";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <TransparencyPanel />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
