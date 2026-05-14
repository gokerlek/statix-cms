"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconLoader2 } from "@tabler/icons-react";

import { useInviteUser } from "@/statix/hooks/use-users";
import { Button } from "@/statix/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/statix/components/ui/dialog";
import { Field, FieldError, FieldGroup } from "@/statix/components/ui/field";
import { Input } from "@/statix/components/ui/input";
import ui from "@/statix/content/ui.json";

const inviteSchema = z.object({
  email: z.string().email(),
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
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  }

  function handleFormSubmit(values: InviteFormValues) {
    // Always invite with editor (minimum) permissions
    inviteUser.mutate({ ...values, role: "editor" }, {
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
              <p className="text-xs text-muted-foreground">
                User will be invited with Editor permissions. You can customize their permissions after they join.
              </p>
            </Field>

            <Field>
              <Button
                type="submit"
                className="w-full"
                disabled={inviteUser.isPending}
              >
                {inviteUser.isPending && (
                  <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
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
