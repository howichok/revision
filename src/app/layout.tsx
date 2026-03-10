import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kosti — Smart Revision Platform",
  description:
    "A focused, modern revision platform that adapts to your weak areas and helps you study smarter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased relative`}>
        {/* Ambient violet light — fixed, non-interactive */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden>
          <div
            className="absolute -top-[40%] -right-[20%] w-[70%] aspect-square rounded-full opacity-[0.12] blur-[140px]"
            style={{ background: "radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-[30%] -left-[15%] w-[50%] aspect-square rounded-full opacity-[0.08] blur-[120px]"
            style={{ background: "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)" }}
          />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
