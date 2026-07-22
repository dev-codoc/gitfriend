"use client";

import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
  }

  async function handleGoogleSignUp() {
    setError("");
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setError("Unable to continue with Google right now.");
      setLoading(false);
    }
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
                Start with a repo
              </div>
              <div className="mt-4 rounded-2xl border border-sky/40 bg-sky/10 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate">New here?</p>
                <p className="mt-2 font-display text-2xl text-ink">Create your account.</p>
                <p className="mt-3 text-sm text-slate">
                  Sign up and start asking questions about any GitHub codebase.
                </p>
              </div>
              <div className="mt-4 rounded-2xl border border-sky/40 bg-white p-4 text-sm text-slate">
                Paste a repository link and get answers grounded in the code.
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-8 sm:p-10 lg:p-12">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center lg:text-left">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-teal">
                  Create account
                </p>
                <h1 className="mt-2 font-display text-3xl text-ink">Sign up</h1>
                <p className="mt-2 text-sm text-slate">
                  Use Google or your email to get started.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky/60 bg-white px-4 py-3 text-sm font-medium text-ink transition hover:bg-sky/10 disabled:opacity-50"
              >
                <span className="text-base">G</span>
                Sign up with Google
              </button>

              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate">
                <div className="h-px flex-1 bg-sky/40" />
                Or create with email
                <div className="h-px flex-1 bg-sky/40" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  name="name"
                  type="text"
                  placeholder="Name"
                  className="w-full rounded-xl border border-sky/50 px-3 py-3 text-sm text-ink placeholder:text-slate/70 focus:border-teal focus:outline-none"
                />
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
                  placeholder="Password (min 8 characters)"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-sky/50 px-3 py-3 text-sm text-ink placeholder:text-slate/70 focus:border-teal focus:outline-none"
                />

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-teal px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-dark disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Sign up"}
                </button>
              </form>

              <p className="text-center text-sm text-slate lg:text-left">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-teal hover:text-teal-dark">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
