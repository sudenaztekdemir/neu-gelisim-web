// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Sitenin sekme adını ve açıklamasını güncelledim
export const metadata: Metadata = {
  title: "NEÜ Gelişim ve Farkındalık Topluluğu",
  description: "Necmettin Erbakan Üniversitesi Gelişim ve Farkındalık Topluluğu Resmi Web Sitesi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F8FAFC] text-slate-900`}
        style={{ colorScheme: 'light' }} // Tarayıcıya 'burası aydınlık mod' emri veriyoruz
      >
        {children}
      </body>
    </html>
  );
}