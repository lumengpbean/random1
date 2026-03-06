import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/cards/post-card";
import { getFeaturedPosts } from "@/lib/content";

export default async function HomePage({ params }: { params: { locale: string } }) {
  const featured = await getFeaturedPosts(params.locale);

  return (
    <div className="space-y-8">
      <section className="rounded-xl bg-muted p-8">
        <h1 className="text-4xl font-bold">Satire with civic intent</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">A bilingual publication where communities publish satirical preprints, debate them, and promote the best pieces into archival journal issues.</p>
        <div className="mt-4 flex gap-3">
          <Link href={`/${params.locale}/submit`}><Button>Submit satire</Button></Link>
          <Link href={`/${params.locale}/preprints`}><Button variant="outline">Browse preprints</Button></Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-2xl font-bold">{featured.length}</p><p className="text-sm text-muted-foreground">Featured now</p></Card>
        <Card><p className="text-2xl font-bold">24h</p><p className="text-sm text-muted-foreground">Moderation SLA</p></Card>
        <Card><p className="text-2xl font-bold">2 locales</p><p className="text-sm text-muted-foreground">English + 中文</p></Card>
      </section>
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Featured posts</h2>
        <div className="grid gap-4 md:grid-cols-2">{featured.map((post) => <PostCard key={post.id} post={post} locale={params.locale} />)}</div>
      </section>
    </div>
  );
}
