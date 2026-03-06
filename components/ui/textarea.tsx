import { cn } from "@/lib/utils";
import * as React from "react";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("min-h-32 w-full rounded-md border border-border px-3 py-2 text-sm", props.className)} />;
}
