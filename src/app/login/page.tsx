"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Navbar from "@/components/Navbar";
import Link from "next/link";

const authErrorMessages: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  OAuthSignin: "Unable to sign in with that provider.",
  OAuthCallback: "There was an issue signing you in with Google.",
  OAuthCreateAccount: "Unable to create an account with that provider.",
  EmailCreateAccount: "Unable to create an account with that email.",
  Callback: "There was an issue signing you in.",
  OAuthAccountNotLinked: "This account is already linked to another login method.",
  EmailSignin: "Unable to sign in with email.",
  Default: "Unable to sign in. Please try again.",
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  const queryError = searchParams?.get("error");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  async function googleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setLoading(true);

    // redirect: false here for the same reason as credentialsSignIn below:
    // without it, TypeScript can't type the result with `.error` at all
    // (that's exactly what caused the build failure), AND your error
    // handling never actually ran — the browser redirected away before
    // this code could check anything.
    const result = await signIn("google", { redirect: false, callbackUrl });

    setLoading(false);

    if (result?.error) {
      setFormError(authErrorMessages[result.error] || authErrorMessages.Default);
      return;
    }

    if (result?.url) {
      // Full browser navigation, not router.push — router.push is for
      // internal app routes; this URL points to Google's own consent
      // screen (an external domain), which needs a real page load.
      window.location.href = result.url;
    }
  }

  async function credentialsSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setFormError(authErrorMessages[result.error] || authErrorMessages.Default);
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <div className="flex-1 flex flex-col bg-[radial-gradient(circle_at_top_left,rgba(144,194,231,0.16),transparent_45%)]">
      <Navbar showAuthLinks={false} />

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl overflow-hidden rounded-4xl border border-sky/60 bg-white shadow-[0_20px_60px_rgba(9,35,39,0.08)] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden lg:flex relative items-center justify-center overflow-hidden bg-linear-to-br from-sky/20 via-white to-teal/10 p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,169,165,0.16),transparent_40%)]" />
            <div className="relative w-full max-w-md rounded-3xl border border-sky/60 bg-white/90 p-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-2 text-sm font-medium text-slate">
                <span className="h-2.5 w-2.5 rounded-full bg-teal" />
                Repo ready to inspect
              </div>
              <div className="mt-4 rounded-2xl border border-sky/40 bg-sky/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate">Paste a repo</p>
                <p className="mt-2 font-display text-2xl text-ink">Ask it anything.</p>
                <div className="mt-4 rounded-xl border border-sky/40 bg-white p-3 text-sm text-slate">
                  github.com/your-org/your-repo
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-sky/40 bg-white p-4">
                <p className="text-sm text-ink">"How is auth handled here?"</p>
                <p className="mt-3 text-sm text-slate">
                  Gitfriend reads the codebase and answers in plain English.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-8 sm:p-10 lg:p-12">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center lg:text-left">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-teal">
                  Welcome back
                </p>
                <h1 className="mt-2 font-display text-3xl text-ink">Log in</h1>
                <p className="mt-2 text-sm text-slate">
                  Chat with any GitHub repo in seconds.
                </p>
              </div>

              <form onSubmit={googleSignIn}>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky/60 bg-white px-4 py-3 text-sm font-medium text-ink transition hover:bg-sky/10 disabled:opacity-50"
                >
                  <span className="text-base">G</span>
                  Continue with Google
                </button>
              </form>

              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate">
                <div className="h-px flex-1 bg-sky/40" />
                Or continue with email
                <div className="h-px flex-1 bg-sky/40" />
              </div>

              {(formError || queryError) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formError ||
                    (queryError && authErrorMessages[queryError]) ||
                    authErrorMessages.Default}
                </div>
              )}

              <form onSubmit={credentialsSignIn} className="space-y-3">
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  required
                  className="w-full rounded-xl border border-sky/50 px-3 py-3 text-sm text-ink placeholder:text-slate/70 focus:border-teal focus:outline-none"
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                  className="w-full rounded-xl border border-sky/50 px-3 py-3 text-sm text-ink placeholder:text-slate/70 focus:border-teal focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-teal px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-dark disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Log in"}
                </button>
              </form>

              <p className="text-center text-sm text-slate lg:text-left">
                No account?{" "}
                <Link href="/signup" className="font-medium text-teal hover:text-teal-dark">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}