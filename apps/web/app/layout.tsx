import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "../components/providers";
import { ToastProvider } from "../components/toast-provider";
import { OfflineBanner } from "../components/offline-banner";
import { Inter } from "next/font/google"; // 1. Changed import
import { cn } from "@/lib/utils";
import "./globals.css";

// 2. Setup Inter font
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Lazuar Kanban", // Updated title to match new branding
  description: "Task management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): ReactNode {
  return (
    // 3. Apply the Inter variable to html class
    <html lang="en" className={cn(inter.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <OfflineBanner />
          {children}
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
