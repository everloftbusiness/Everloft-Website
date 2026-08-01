"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SectionStatus } from "@/features/properties/services/onboarding.service";

const STATUS_STYLE: Record<SectionStatus, string> = {
  completed: "bg-green-100 text-green-700",
  in_progress: "bg-blue-accent/10 text-blue-accent",
  needs_review: "bg-gold-soft text-foreground",
  not_started: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Record<SectionStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  needs_review: "Needs Review",
  not_started: "Not Started",
};

export function SetupCard({
  icon,
  title,
  description,
  completionPercent,
  status,
  required,
  fieldsCompleted,
  fieldsTotal,
  defaultOpen = false,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  completionPercent: number;
  status: SectionStatus;
  required: boolean;
  fieldsCompleted: number;
  fieldsTotal: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-border bg-card transition-shadow hover:shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-left"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-soft text-primary">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-primary">{title}</p>
            {required && <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive">Required</span>}
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", STATUS_STYLE[status])}>
              {STATUS_LABEL[status]}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-400 ease-out"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {fieldsCompleted}/{fieldsTotal}
            </span>
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="border-t border-border p-5">{children}</div>}
    </div>
  );
}
