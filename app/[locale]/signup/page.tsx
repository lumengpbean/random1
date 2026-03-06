import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  return (
    <form action="/api/register" method="post" className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-bold">Sign up</h1>
      <Input name="name" placeholder="Display name" required />
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="password" type="password" placeholder="Password" required />
      <Button type="submit">Create account</Button>
      <p className="text-sm text-muted-foreground">Already have an account? <Link href="/en/login" className="text-primary">Log in</Link></p>
    </form>
  );
}
