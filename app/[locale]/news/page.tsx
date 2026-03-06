import { db } from "@/lib/db";

export default async function NewsPage({ params }: { params: { locale: string } }) {
  const items = await db.announcement.findMany({ where: { locale: params.locale, published: true }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Announcements</h1>
      {items.map((item) => <article key={item.id} className="rounded-lg border border-border p-4"><h2 className="font-semibold">{item.title}</h2><p className="text-sm text-muted-foreground">{item.body}</p></article>)}
    </div>
  );
}
