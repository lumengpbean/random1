import { cn } from "@/lib/utils";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground", className)}>{children}</span>;
}
