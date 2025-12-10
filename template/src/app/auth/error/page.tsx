"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AlertCircle } from "lucide-react";

import { SectionLoading } from "@/components/ui/loading";
import ui from "@/content/ui.json";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let errorMessage = ui.auth.error.default;

  if (error === "AccessDenied") {
    errorMessage = ui.auth.error.accessDenied;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-red-500/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">
              {ui.auth.error.title}
            </h1>

            <p className="text-slate-300">{errorMessage}</p>
          </div>

          <Link
            href="/auth/signin"
            className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {ui.auth.error.tryAgain}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-900 to-slate-900">
          <SectionLoading className="text-white" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
