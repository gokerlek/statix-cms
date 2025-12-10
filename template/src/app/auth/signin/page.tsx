"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";

import { Github } from "lucide-react";

import ui from "@/content/ui.json";
import { ROUTES } from "@/lib/constants";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-primary to-slate-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex flex-col justify-center items-center gap-5 mb-8">
            <Image
              src="/logo-label.svg"
              alt="Logo"
              width={136}
              height={33}
              priority
            />

            <p className="text-primary-foreground/80">{ui.auth.signInTitle}</p>
          </div>

          <button
            onClick={() => signIn("github", { callbackUrl: ROUTES.ADMIN.ROOT })}
            className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Github className="w-5 h-5" />

            {ui.auth.signInWithGithub}
          </button>

          <p className="text-xs text-primary-foreground/80 text-center mt-6">
            {ui.auth.whitelistWarning}
          </p>
        </div>
      </div>
    </div>
  );
}
