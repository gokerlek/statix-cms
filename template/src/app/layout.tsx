import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "sonner";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QueryProvider } from "@/components/providers/query-provider";

import type { Metadata } from "next";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Statix",
  description: "Statix - The headless CMS for GitHub",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <ErrorBoundary>{children}</ErrorBoundary>

          <Toaster richColors position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
