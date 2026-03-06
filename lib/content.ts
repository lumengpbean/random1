import { Prisma, PostState } from "@prisma/client";
import { db } from "@/lib/db";

export async function getFeaturedPosts(locale: string) {
  return db.post.findMany({
    where: { locale: { in: [locale, "bilingual"] }, featured: true, state: { in: [PostState.published_preprint, PostState.promoted_to_journal] } },
    include: { author: true, _count: { select: { votes: true, comments: true } } },
    orderBy: { publishedAt: "desc" },
    take: 3
  });
}

export async function getPreprints(locale: string, query?: string) {
  const where: Prisma.PostWhereInput = {
    locale: { in: [locale, "bilingual"] },
    state: PostState.published_preprint,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } }
          ]
        }
      : {})
  };
  return db.post.findMany({ where, include: { author: true, _count: { select: { votes: true, comments: true } } }, orderBy: [{ featured: "desc" }, { publishedAt: "desc" }] });
}
