import { signIn } from "@/auth";
import Navbar from "@/components/Navbar";
import { AuthError } from "next-auth";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/dashboard";

  async function googleSignIn() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl });
  }

  async function credentialsSignIn(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: callbackUrl,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.type === "CredentialsSignin") {
          throw new Error("Invalid email or password.");
        }
      }
      throw error;
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
                <p className="text-sm text-ink">“How is auth handled here?”</p>
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

              <form action={googleSignIn}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky/60 bg-white px-4 py-3 text-sm font-medium text-ink transition hover:bg-sky/10"
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

              <form action={credentialsSignIn} className="space-y-3">
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
                  className="w-full rounded-xl bg-teal px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-dark"
                >
                  Log in
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
