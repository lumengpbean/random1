import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function moderate(formData: FormData) {
  "use server";
  const postId = String(formData.get("postId"));
  const action = String(formData.get("action"));
  await db.post.update({
    where: { id: postId },
    data: { state: action === "approve" ? "published_preprint" : "rejected", publishedAt: new Date() }
  });
}

export async function ModerationPanel() {
  const queue = await db.post.findMany({ where: { state: { in: ["submitted", "pending_review"] } }, include: { author: true } });
  return (
    <div className="space-y-4">
      {queue.map((post) => (
        <Card key={post.id} className="space-y-2">
          <h3 className="font-semibold">{post.title}</h3>
          <p className="text-sm text-muted-foreground">{post.summary}</p>
          <form action={moderate} className="flex gap-2">
            <input type="hidden" name="postId" value={post.id} />
            <Button name="action" value="approve" size="sm">Approve</Button>
            <Button name="action" value="reject" variant="outline" size="sm">Reject</Button>
          </form>
        </Card>
      ))}
    </div>
  );
}
