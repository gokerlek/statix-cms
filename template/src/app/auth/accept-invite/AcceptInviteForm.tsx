"use client";

import { useFormStatus } from "react-dom";
import { IconLoader2, IconUserCheck } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <IconUserCheck className="w-4 h-4 mr-2" />
      )}
      Daveti kabul et
    </Button>
  );
}

interface AcceptInviteFormProps {
  email: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (formData: FormData) => Promise<any>;
  error?: string;
}

export function AcceptInviteForm({ email, action, error }: AcceptInviteFormProps) {
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="email" value={email} />

      <div className="rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-sm text-white/80">
        <span className="block text-xs text-white/50 mb-0.5">Davet edilen adres</span>
        <span className="font-medium text-white">{email}</span>
      </div>

      <p className="text-xs text-primary-foreground/60 text-center">
        Daveti kabul ettikten sonra giriş için bir kod gönderilecektir.
      </p>

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <SubmitButton />
    </form>
  );
}
