"use client";

import { useState, useRef, KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IconBrandGithub, IconMail, IconArrowLeft, IconLoader2 } from "@tabler/icons-react";

import { authClient } from "@/statix/lib/auth-client";
import { ROUTES } from "@/statix/lib/constants";
import { Button } from "@/statix/components/ui/button";
import { Input } from "@/statix/components/ui/input";

type Step = "email" | "otp";

export default function SignInPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setError("");
    setLoading(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      setStep("otp");
    } catch {
      setError("Kod gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      await authClient.signIn.emailOtp({ email, otp: code });
      router.push(ROUTES.ADMIN.ROOT);
    } catch {
      setError("Geçersiz veya süresi dolmuş kod.");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleSocial(provider: "github" | "google") {
    setLoading(true);
    try {
      await authClient.signIn.social({ provider, callbackURL: ROUTES.ADMIN.ROOT });
    } catch {
      setError("Sosyal giriş başarısız oldu.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-primary to-slate-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex flex-col items-center gap-5 mb-8">
            <Image src="/logo-label.svg" alt="Logo" width={136} height={33} priority />
          </div>

          {step === "email" ? (
            <>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm text-primary-foreground/80 mb-1">
                    Email adresi
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@sirket.com"
                    required
                    disabled={loading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading || !email}>
                  {loading ? (
                    <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <IconMail className="w-4 h-4 mr-2" />
                  )}
                  Giriş kodu gönder
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-transparent px-2 text-primary-foreground/60">
                    veya şununla devam et
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-slate-800/50 border-white/20 text-white hover:bg-slate-700/50"
                  onClick={() => handleSocial("github")}
                  disabled={loading}
                >
                  <IconBrandGithub className="w-4 h-4 mr-2" />
                  GitHub ile giriş yap
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  onClick={() => handleSocial("google")}
                  disabled={loading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google ile giriş yap
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <p className="text-primary-foreground/80 text-sm text-center mb-1">
                  <strong>{email}</strong> adresine 6 haneli kod gönderdik.
                </p>
                <p className="text-primary-foreground/60 text-xs text-center">
                  Kod 5 dakika geçerlidir.
                </p>
              </div>

              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={loading}
                    className="w-11 h-14 text-center text-xl font-bold rounded-lg border bg-white/10 border-white/20 text-white focus:border-white focus:outline-none disabled:opacity-50"
                  />
                ))}
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || otp.join("").length !== 6}
              >
                {loading ? (
                  <IconLoader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Giriş yap
              </Button>

              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                className="w-full flex items-center justify-center gap-2 text-sm text-primary-foreground/60 hover:text-primary-foreground/80 transition-colors"
              >
                <IconArrowLeft className="w-4 h-4" />
                Geri dön
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
