"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Library, Home, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/storage";
import type { UserProfile } from "@/lib/types";

const navLinks = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/revision", label: "Revision", icon: BookOpen },
  { href: "/library", label: "Library", icon: Library },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    setUser(storage.getUser());
  }, []);

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-sm">K</span>
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight">
            Kosti
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:text-foreground hover:bg-card"
                )}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        {/* User section — always renders same structure; nickname populates after mount */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted hidden sm:block min-w-0">
            {user?.nickname ?? "\u00A0"}
          </span>
          <button
            onClick={() => {
              storage.clearAll();
              router.push("/");
            }}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
