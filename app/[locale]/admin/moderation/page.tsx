import { ModerationPanel } from "@/components/admin/moderation-panel";

export default function ModerationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Submission moderation</h1>
      <ModerationPanel />
    </div>
  );
}
