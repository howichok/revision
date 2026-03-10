"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { storage } from "@/lib/storage";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const user = storage.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    const onboarding = storage.getOnboarding();
    if (!onboarding) {
      router.push("/onboarding");
    } else if (!onboarding.completedAt) {
      router.push("/onboarding/focus");
    }
  }, [router]);

  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}
