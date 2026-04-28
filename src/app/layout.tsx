import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NotificationIA from "@/components/NotificationIA";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: "CondutorPro — Plataforma de Ensino para Autoescolas",
  description: "Prepare-se para a sua CNH com videoaulas, simulados e quizzes interativos. A plataforma de elite da autoescola.",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" data-theme="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <NotificationIA />
        <WhatsAppButton />
      </body>
    </html>
  );
}
