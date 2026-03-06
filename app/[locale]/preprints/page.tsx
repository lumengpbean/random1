import { PostCard } from "@/components/cards/post-card";
import { getPreprints } from "@/lib/content";

export default async function PreprintsPage({ params, searchParams }: { params: { locale: string }; searchParams: { q?: string } }) {
  const posts = await getPreprints(params.locale, searchParams.q);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Preprints</h1>
      <form className="max-w-md"><input name="q" placeholder="Search preprints" className="h-10 w-full rounded-md border border-border px-3" /></form>
      <div className="grid gap-4 md:grid-cols-2">{posts.map((post) => <PostCard key={post.id} post={post} locale={params.locale} />)}</div>
    </section>
  );
}
