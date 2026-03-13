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
      <div className="flex min-w-max gap-2 rounded-2xl border border-border bg-card/70 p-2">
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
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-surface/60 hover:text-foreground"
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
