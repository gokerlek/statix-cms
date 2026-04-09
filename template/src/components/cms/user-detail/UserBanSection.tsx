"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { IconLoader2 } from "@tabler/icons-react";

import { useBanUser, useUnbanUser, type BanPayload } from "@/hooks/use-users";
import { useUserDetailStore } from "@/stores/useUserDetailStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CMSUser } from "@/app/admin/users/page";
import ui from "@/content/ui.json";

const banSchema = z.object({
  banReason: z
    .string()
    .max(500, ui.users.ban.reasonValidation)
    .optional()
    .or(z.literal("")),
  banDuration: z.enum(["permanent", "1", "7", "30"]),
});

type BanFormValues = z.infer<typeof banSchema>;
type BanDuration = "permanent" | "1" | "7" | "30";

interface UserBanSectionProps {
  user: CMSUser;
  anyLoading: boolean;
}

export function UserBanSection({ user, anyLoading }: UserBanSectionProps) {
  const { banFormOpen } = useUserDetailStore();
  const { setBanFormOpen } = useUserDetailStore();

  const ban = useBanUser(user.id);
  const unban = useUnbanUser(user.id);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BanFormValues>({
    resolver: zodResolver(banSchema),
    defaultValues: { banReason: "", banDuration: "permanent" },
  });

  function handleBanSubmit(values: BanFormValues) {
    const payload: BanPayload = { banReason: values.banReason || undefined };
    if (values.banDuration !== "permanent") {
      const days = parseInt(values.banDuration, 10);
      payload.banExpiresAt = new Date(Date.now() + days * 86400_000).toISOString();
    }
    ban.mutate(payload, {
      onSuccess: () => { setBanFormOpen(false); reset(); },
    });
  }

  return (
    <section className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {ui.users.ban.sectionTitle}
      </p>

      {user.banned ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="destructive" className="text-xs">
              {ui.users.status.banned}
            </Badge>
            {user.banExpires && (
              <span className="text-xs text-muted-foreground">
                {ui.users.status.bannedUntil.replace(
                  "{date}",
                  new Date(user.banExpires).toLocaleDateString("en-US", {
                    day: "2-digit", month: "short", year: "numeric",
                  }),
                )}
              </span>
            )}
          </div>
          {user.banReason && (
            <p className="text-xs text-muted-foreground">
              {ui.users.ban.banReason.replace("{reason}", user.banReason)}
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => unban.mutate()}
            disabled={anyLoading}
          >
            {unban.isPending && <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
            {ui.users.ban.unbanButton}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Badge variant="secondary" className="text-xs text-green-700 bg-green-50 border-green-200">
            {ui.users.status.active}
          </Badge>

          {!banFormOpen ? (
            <div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={() => setBanFormOpen(true)}
                disabled={anyLoading}
              >
                {ui.users.ban.banButton}
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(handleBanSubmit)}
              className="border rounded-md p-3 bg-muted/30"
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="ban-reason">
                    {ui.users.ban.reasonLabel}{" "}
                    <span className="text-muted-foreground font-normal">
                      {ui.users.ban.reasonOptional}
                    </span>
                  </FieldLabel>
                  <Input
                    id="ban-reason"
                    {...register("banReason")}
                    placeholder={ui.users.ban.reasonPlaceholder}
                    maxLength={500}
                    className="h-8 text-sm"
                    disabled={ban.isPending}
                  />
                  <FieldError errors={[errors.banReason]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="ban-duration">{ui.users.ban.durationLabel}</FieldLabel>
                  <Controller
                    control={control}
                    name="banDuration"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v as BanDuration)}
                        disabled={ban.isPending}
                      >
                        <SelectTrigger id="ban-duration" className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">{ui.users.ban.durations["1"]}</SelectItem>
                          <SelectItem value="7">{ui.users.ban.durations["7"]}</SelectItem>
                          <SelectItem value="30">{ui.users.ban.durations["30"]}</SelectItem>
                          <SelectItem value="permanent">{ui.users.ban.durations.permanent}</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.banDuration]} />
                </Field>

                <Field orientation="horizontal">
                  <Button
                    type="submit"
                    size="sm"
                    variant="destructive"
                    className="h-8 text-xs"
                    disabled={ban.isPending}
                  >
                    {ban.isPending && <IconLoader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                    {ui.users.ban.confirmButton}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={() => { setBanFormOpen(false); reset(); }}
                    disabled={ban.isPending}
                  >
                    {ui.users.ban.cancelButton}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
