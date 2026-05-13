import { env } from "@/statix/lib/env";

import { SignInForm } from "./SignInForm";

/**
 * Server component wrapper for the sign-in page.
 *
 * Reads OAuth configuration server-side (env values aren't shipped to the
 * client) and tells the form which social-provider buttons it may render.
 * Buttons whose env vars are unset stay hidden so users never click into
 * a 500.
 */
export default function SignInPage() {
  return (
    <SignInForm
      githubEnabled={!!env.GITHUB_CLIENT_ID && !!env.GITHUB_CLIENT_SECRET}
      googleEnabled={!!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET}
    />
  );
}
