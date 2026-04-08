"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { useInviteUser } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ui from "@/content/ui.json";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const inviteUser = useInviteUser();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "user" },
  });

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  }

  function handleFormSubmit(values: InviteFormValues) {
    inviteUser.mutate(values, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ui.users.inviteDialog.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-2">
          <FieldGroup>
            <Field>
              <label
                htmlFor="invite-email"
                className="text-sm font-medium leading-snug"
              >
                {ui.users.inviteDialog.emailLabel}
              </label>
              <Input
                id="invite-email"
                type="email"
                {...register("email")}
                placeholder={ui.users.inviteDialog.emailPlaceholder}
                disabled={inviteUser.isPending}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field>
              <label
                htmlFor="invite-role"
                className="text-sm font-medium leading-snug"
              >
                {ui.users.inviteDialog.roleLabel}
              </label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as "admin" | "user")}
                    disabled={inviteUser.isPending}
                  >
                    <SelectTrigger id="invite-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{ui.users.roles.user}</SelectItem>
                      <SelectItem value="admin">{ui.users.roles.admin}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.role]} />
            </Field>

            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={inviteUser.isPending}
              >
                {inviteUser.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                {inviteUser.isPending
                  ? ui.users.inviteDialog.submitting
                  : ui.users.inviteDialog.submitButton}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  );
}
