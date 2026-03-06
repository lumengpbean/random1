import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.post.findMany({ select: { slug: true, updatedAt: true } });
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticRoutes = ["/en", "/zh", "/en/preprints", "/zh/preprints", "/en/journal", "/zh/journal"];

  return [
    ...staticRoutes.map((route) => ({ url: `${base}${route}`, lastModified: new Date() })),
    ...posts.map((p) => ({ url: `${base}/en/article/${p.slug}`, lastModified: p.updatedAt }))
  ];
}
