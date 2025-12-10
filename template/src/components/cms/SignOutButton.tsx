"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SignOutButtonProps {
  onSignOut: () => void;
}

export function SignOutButton({ onSignOut }: SignOutButtonProps) {
  return (
    <Button variant="ghost" onClick={onSignOut}>
      <LogOut />
    </Button>
  );
}
