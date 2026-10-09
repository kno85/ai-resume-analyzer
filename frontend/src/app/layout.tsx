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

export const metadata: Metadata = {
  title: "AI Resume Analyzer | Auditor ATS con Inteligencia Artificial - 100% Gratuito",
  description: "Audita y optimiza tu currículum gratis con IA. Detecta fallos de formato ATS, descubre habilidades que faltan y multiplica tus entrevistas laborales. Sin registros ni límites.",
  keywords: ["analizador cv", "ats resume checker", "curriculum inteligencia artificial", "ia cv gratis", "auditor ats"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
