import Link from "next/link";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";

export default async function AdminPage({ params }: { params: { locale: string } }) {
  const [queueCount, reportsCount] = await Promise.all([
    db.post.count({ where: { state: { in: ["submitted", "pending_review"] } } }),
    db.report.count({ where: { status: "open" } })
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><p className="font-semibold">Moderation queue</p><p>{queueCount} pending</p><Link href={`/${params.locale}/admin/moderation`} className="text-sm text-primary">Open queue</Link></Card>
        <Card><p className="font-semibold">Reports</p><p>{reportsCount} open</p></Card>
      </div>
    </div>
  );
}
