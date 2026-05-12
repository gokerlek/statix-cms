"use client";

import { useRouter } from "next/navigation";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslation } from "@/statix/hooks/use-translation";
import { authClient } from "@/statix/lib/auth-client";
import { ROUTES } from "@/statix/lib/constants";

/**
 * Sign-in mutations wrapping the Better Auth client.
 *
 * Why mutations: Better Auth's React client returns `{ data, error }`
 * without throwing on auth/business errors. A naive try/catch around
 * `await authClient.signIn.emailOtp(...)` never catches anything —
 * which is exactly the bug the signin page had. By throwing inside
 * `mutationFn`, the React Query mutation cycle fires `onError`/`onSuccess`
 * correctly, lets the page bind to `isPending` / `error.message`, and
 * keeps a single source of truth for redirect/toast logic.
 *
 * router.push (no router.refresh): the admin layout is a server component
 * that calls getSession() on every navigation, so the just-set Better
 * Auth cookie is read on the next request. router.refresh() would
 * invalidate the CURRENT route's RSC cache, which we're navigating away
 * from anyway.
 */

export function useSendOtp() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      if (error) {
        throw new Error(
          error.message ?? t("signin.toasts.error.codeSendFailed"),
        );
      }
      return { email };
    },
    onSuccess: ({ email }) => {
      toast.success(t("signin.toasts.success.codeSent", { email }));
    },
    onError: (err) => {
      toast.error(err.message || t("signin.toasts.error.codeSendFailed"));
    },
  });
}

export function useVerifyOtp() {
  const router = useRouter();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      const { error } = await authClient.signIn.emailOtp({ email, otp });
      if (error) {
        throw new Error(
          error.message ?? t("signin.toasts.error.invalidCode"),
        );
      }
    },
    onSuccess: () => {
      toast.success(t("signin.toasts.success.signedIn"));
      router.push(ROUTES.ADMIN.ROOT);
    },
    onError: (err) => {
      toast.error(err.message || t("signin.toasts.error.invalidCode"));
    },
  });
}

export function useSocialSignIn() {
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (provider: "github" | "google") => {
      const { error } = await authClient.signIn.social({
        provider,
        callbackURL: ROUTES.ADMIN.ROOT,
      });
      if (error) {
        throw new Error(error.message ?? t("signin.toasts.error.socialFailed"));
      }
    },
    onError: (err) => {
      toast.error(err.message || t("signin.toasts.error.socialFailed"));
    },
  });
}
