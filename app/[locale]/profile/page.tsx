import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) return <p>Please sign in.</p>;
  const user = await db.user.findUnique({ where: { email: session.user.email }, include: { posts: true } });
  if (!user) return <p>User not found.</p>;
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold">{user.name ?? "Profile"}</h1>
      <p className="text-sm text-muted-foreground">{user.bio ?? "No bio yet"}</p>
      <p className="text-sm">Posts: {user.posts.length}</p>
    </div>
  );
}
