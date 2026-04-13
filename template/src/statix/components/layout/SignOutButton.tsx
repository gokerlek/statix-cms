"use client";

import { IconLogout } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

import { Button } from "@/statix/components/ui/button";
import { authClient } from "@/statix/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/auth/signin");
  }

  return (
    <Button variant="ghost" onClick={handleSignOut}>
      <IconLogout />
    </Button>
  );
}
