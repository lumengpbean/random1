"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function SubmitForm({ locale }: { locale: string }) {
  const [status, setStatus] = useState<string>("");

  async function onSubmit(formData: FormData) {
    const res = await fetch("/api/submit", { method: "POST", body: formData });
    setStatus(res.ok ? "Submitted for moderation." : "Submission failed.");
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Input name="title" placeholder="Satirical title" required />
      <Input name="summary" placeholder="Short abstract" required />
      <Textarea name="content" placeholder="Your satire article text" required />
      <select name="locale" className="h-10 w-full rounded-md border border-border px-3" defaultValue={locale}>
        <option value="en">English</option>
        <option value="zh">中文</option>
        <option value="bilingual">Bilingual</option>
      </select>
      <Button type="submit">Submit</Button>
      {status && <p className="text-sm text-muted-foreground">{status}</p>}
    </form>
  );
}
