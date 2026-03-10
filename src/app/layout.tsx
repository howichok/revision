import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { loadAppState } from "@/lib/app-data";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialState = null;

  if (getSupabaseConfig()) {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        initialState = await loadAppState(supabase, user);
      }
    } catch {
      initialState = null;
    }
  }

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
        <div className="relative z-10">
          <AppDataProvider initialState={initialState}>{children}</AppDataProvider>
        </div>
      </body>
    </html>
  );
}
