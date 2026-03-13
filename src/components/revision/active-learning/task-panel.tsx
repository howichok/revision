"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TaskPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
}

export function TaskPanel({
  className,
  title,
  subtitle,
  children,
  ...props
}: TaskPanelProps) {
  return (
    <section className={cn("al-task-panel", className)} {...props}>
      {title || subtitle ? (
        <header className="space-y-2">
          {title ? <h2 className="text-2xl font-semibold leading-tight text-foreground sm:text-3xl">{title}</h2> : null}
          {subtitle ? <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">{subtitle}</p> : null}
        </header>
      ) : null}

      {children}
    </section>
  );
}

export type { TaskPanelProps };
