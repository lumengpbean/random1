import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

async function login(formData: FormData) {
  "use server";
  await signIn("credentials", {
    email: String(formData.get("email")),
    password: String(formData.get("password")),
    redirectTo: "/en/profile"
  });
}

export default function LoginPage() {
  return (
    <form action={login} className="mx-auto max-w-md space-y-4">
      <h1 className="text-3xl font-bold">Log in</h1>
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="password" type="password" placeholder="Password" required />
      <Button type="submit">Log in</Button>
    </form>
  );
}
