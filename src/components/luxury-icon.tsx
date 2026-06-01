import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type LuxuryIconProps = {
  icon: LucideIcon;
  className?: string;
};

export function LuxuryIcon({ icon: Icon, className }: LuxuryIconProps) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center border border-primary/20 bg-background/70 text-primary transition-[border-color,background-color,transform] duration-300 group-hover:border-primary/40 group-hover:bg-primary/10",
        className,
      )}
    >
      <Icon aria-hidden className="size-4 stroke-[1.5] transition-transform duration-300 group-hover:scale-105" />
    </span>
  );
}
