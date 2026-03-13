"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { REVISION_ROUTE_ITEMS, type RevisionRouteId } from "@/lib/revision-routes";

interface RevisionSubnavProps {
  activeRoute?: RevisionRouteId;
}

export function RevisionSubnav({ activeRoute }: RevisionSubnavProps) {
  const pathname = usePathname();

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-2 rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(17,17,19,0.88))] p-2 shadow-[0_16px_40px_-30px_rgba(0,0,0,0.9)]">
        {REVISION_ROUTE_ITEMS.map((item) => {
          const isActive =
            activeRoute
              ? item.id === activeRoute
              : item.href === "/revision"
                ? pathname === "/revision"
                : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "rounded-xl px-3 py-2 text-sm transition-colors",
                isActive
                  ? item.id === "paper-2"
                    ? "bg-warning/15 text-warning"
                    : item.id === "progress"
                      ? "bg-success/15 text-success"
                      : "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <span className="block font-medium">{item.label}</span>
              <span className="mt-0.5 block text-[11px] opacity-70">
                {item.description}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
