import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { articleJsonLd } from "@/lib/seo";

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await db.post.findUnique({ where: { slug: params.slug }, include: { author: true, comments: { include: { user: true } } } });
  if (!post) notFound();
  const jsonLd = articleJsonLd({
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(),
    authorName: post.author.name ?? "Anonymous"
  });

  return (
    <article className="space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="rounded-md border border-border bg-muted p-3 text-sm">Satire disclaimer: This article is a satirical work and not factual reporting.</p>
      <h1 className="text-4xl font-bold">{post.title}</h1>
      <p className="text-muted-foreground">{post.summary}</p>
      <div className="prose max-w-none"><p>{post.content}</p></div>
      <section>
        <h2 className="text-xl font-semibold">Comments</h2>
        <div className="space-y-2">{post.comments.map((comment) => <div className="rounded border border-border p-3 text-sm" key={comment.id}><p>{comment.body}</p><p className="mt-1 text-xs text-muted-foreground">{comment.user.name ?? "Reader"}</p></div>)}</div>
      </section>
    </article>
  );
}
