import { z } from "zod";

export const submitPostSchema = z.object({
  title: z.string().min(8).max(140),
  summary: z.string().min(20).max(300),
  content: z.string().min(120),
  locale: z.enum(["en", "zh", "bilingual"])
});
