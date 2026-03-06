import { cn } from "@/lib/utils";
import * as React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-10 w-full rounded-md border border-border px-3 text-sm", props.className)} />;
}
