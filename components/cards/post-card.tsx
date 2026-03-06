import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function PostCard({ post, locale }: { post: any; locale: string }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <Badge>{post.state.replaceAll("_", " ")}</Badge>
        <span className="text-xs text-muted-foreground">▲ {post._count?.votes ?? 0} · 💬 {post._count?.comments ?? 0}</span>
      </div>
      <Link href={`/${locale}/article/${post.slug}`} className="text-lg font-semibold hover:underline">{post.title}</Link>
      <p className="text-sm text-muted-foreground">{post.summary}</p>
      <p className="text-xs text-muted-foreground">{post.author?.name ?? "Anonymous"}</p>
    </Card>
  );
}
