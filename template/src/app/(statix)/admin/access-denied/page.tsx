import Link from "next/link";
import { IconLock } from "@tabler/icons-react";
import { Button } from "@/statix/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="rounded-full bg-destructive/10 p-4">
        <IconLock className="w-8 h-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground text-center max-w-md">
        You don&apos;t have permission to access this page. Contact an administrator
        if you believe this is an error.
      </p>
      <Button asChild variant="outline">
        <Link href="/admin">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
