import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-[radial-gradient(circle_at_top_left,rgba(144,194,231,0.16),transparent_45%)]">
      <Navbar />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.24em] text-teal">
              Chat with any codebase
            </p>
            <h1 className="mb-6 font-display text-5xl leading-[1.05] text-ink sm:text-6xl">
              Paste a repo.
              <br />
              Ask it anything.
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate">
              Gitfriend reads a codebase so you don&apos;t have to read it first.
              Drop in a GitHub URL and ask how auth works, where a feature lives,
              or why a function exists ? in plain English.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="rounded-xl bg-teal px-6 py-3 font-medium text-white transition hover:bg-teal-dark"
              >
                Get started free
              </Link>
              <a
                href="#how-it-works"
                className="rounded-xl border border-sky/60 px-6 py-3 font-medium text-ink transition hover:bg-sky/10"
              >
                See how it works ?
              </a>
            </div>
          </div>

          <div className="rounded-4xl border border-sky/60 bg-white/90 p-5 shadow-[0_20px_60px_rgba(9,35,39,0.08)] backdrop-blur sm:p-6">
            <div className="flex items-center gap-3 border-b border-sky/40 bg-sky/10 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-teal" />
              <span className="truncate font-mono text-sm text-slate">
                github.com/your-org/your-repo
              </span>
              <span className="ml-auto rounded-full bg-teal px-2.5 py-1 text-xs font-medium text-white">
                Indexed
              </span>
            </div>
            <div className="space-y-4 px-2 py-5 sm:px-4">
              <div className="flex justify-end">
                <div className="max-w-xs rounded-2xl rounded-tr-sm bg-sky/20 px-4 py-3 text-sm text-ink">
                  How is authentication handled in the backend?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-md rounded-2xl rounded-tl-sm border border-sky/40 bg-white px-4 py-3 text-sm text-slate">
                  JWTs are issued in{" "}
                  <code className="font-mono text-xs text-teal-dark">
                    backend/controllers/auth.js
                  </code>{" "}
                  and verified by middleware on every protected route.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-sky/40 bg-sky/5/70">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.24em] text-teal">
            The process
          </p>
          <h2 className="mb-12 max-w-2xl font-display text-3xl text-ink sm:text-4xl">
            Three steps, from link to conversation.
          </h2>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Paste",
                body: "Drop in the URL of any public GitHub repository.",
              },
              {
                n: "02",
                title: "Index",
                body: "Gitfriend clones it, chunks the code, and embeds it so it's fully searchable.",
              },
              {
                n: "03",
                title: "Chat",
                body: "Ask questions in plain English. Every answer is grounded in the actual code.",
              },
            ].map((step) => (
              <div key={step.n} className="rounded-2xl border border-sky/40 bg-white/80 p-6 shadow-sm">
                <span className="font-display text-3xl text-sky">{step.n}</span>
                <h3 className="mt-3 mb-2 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "History per repo",
              body: "Every conversation is saved and organized by repo, so you can pick up where you left off.",
            },
            {
              title: "Any public repo",
              body: "No setup on the repo's side. Paste a link and start asking questions minutes later.",
            },
            {
              title: "Grounded, not guessed",
              body: "Answers cite the actual files and functions they came from � not a plausible-sounding guess.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-sky/40 bg-white p-6 shadow-sm">
              <h3 className="mb-2 font-semibold text-ink">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-sky/40 bg-white/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-8 text-sm sm:px-8 lg:px-10">
          <span className="font-display italic text-ink">Gitfriend</span>
          <span className="text-slate">� {new Date().getFullYear()} Gitfriend</span>
        </div>
      </footer>
    </div>
  );
}