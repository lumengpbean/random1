import { db } from "@/lib/db";
import { PostCard } from "@/components/cards/post-card";

export default async function JournalPage({ params }: { params: { locale: string } }) {
  const posts = await db.post.findMany({ where: { state: "promoted_to_journal", locale: { in: [params.locale, "bilingual"] } }, include: { author: true, _count: { select: { votes: true, comments: true } } } });
  return <div className="grid gap-4 md:grid-cols-2">{posts.map((post) => <PostCard key={post.id} post={post} locale={params.locale} />)}</div>;
}
