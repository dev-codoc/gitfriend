"use client";

import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type RepoItem = {
  id: string;
  name: string;
  githubUrl: string;
  status: string;
  createdAt: string;
};

type MessageItem = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type DashboardClientProps = {
  userName?: string | null;
  userEmail?: string | null;
};

export default function DashboardClient({
  userName,
  userEmail,
}: DashboardClientProps) {
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadRepos();
  }, []);

  async function loadRepos() {
    const res = await fetch("/api/repos");
    if (!res.ok) return;

    const data = await res.json();
    setRepos(data.repos ?? []);

    if (data.repos?.length) {
      setSelectedRepoId((current) => current ?? data.repos[0].id);
    }
  }

  async function handleIngest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const res = await fetch("/api/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubUrl: repoUrl }),
    });
    const data = await res.json();

    setIsSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Unable to ingest that repository.");
      return;
    }

    setRepoUrl("");
    setSelectedRepoId(data.repo.id);
    setMessages([]);
    await loadRepos();
  }

  async function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedRepoId) {
      setError("Add a repository first.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    setMessages((prev) => [...prev, { role: "user", content: question }]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoId: selectedRepoId, question }),
    });
    const data = await res.json();

    setIsSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Unable to ask that question right now.");
      setMessages((prev) => prev.slice(0, -1));
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.answer },
    ]);
    setQuestion("");
    await loadRepos();
  }

  return (
    <div className="flex-1 flex flex-col bg-sky/5">
      <header className="border-b border-sky/40 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div>
            <p className="font-display text-xl italic text-ink">Gitfriend</p>
            <p className="text-sm text-slate">Dashboard</p>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md border border-sky/40 px-4 py-2 text-sm text-ink transition hover:bg-sky/10"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-sky/40 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-teal">
                Welcome back
              </p>
              <h1 className="mt-2 font-display text-3xl text-ink">
                {userName || userEmail || "Developer"}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate">
                Paste any public GitHub repository and start a grounded chat about the codebase.
              </p>
            </div>

            <div className="rounded-3xl border border-sky/40 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl text-ink">Add a repository</h2>
                <span className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-teal">
                  New
                </span>
              </div>

              <form onSubmit={handleIngest} className="mt-4 space-y-3">
                <input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full rounded-xl border border-sky/50 px-3 py-3 text-sm text-ink placeholder:text-slate/70 focus:border-teal focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !repoUrl.trim()}
                  className="w-full rounded-xl bg-teal px-4 py-3 text-sm font-medium text-white transition hover:bg-teal-dark disabled:opacity-50"
                >
                  {isSubmitting ? "Indexing..." : "Ingest repository"}
                </button>
              </form>

              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            </div>

            <div className="rounded-3xl border border-sky/40 bg-white p-6 shadow-sm">
              <h2 className="font-display text-2xl text-ink">Your repos</h2>
              <div className="mt-4 space-y-3">
                {repos.length === 0 ? (
                  <p className="text-sm text-slate">No repositories yet. Add one to start chatting.</p>
                ) : (
                  repos.map((repo) => (
                    <button
                      key={repo.id}
                      type="button"
                      onClick={() => setSelectedRepoId(repo.id)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        selectedRepoId === repo.id
                          ? "border-teal bg-teal/10"
                          : "border-sky/40 bg-sky/5 hover:bg-sky/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-ink">{repo.name}</span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-slate">
                          {repo.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate">{repo.githubUrl}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-sky/40 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink">Repo chat</h2>
              <span className="text-sm text-slate">
                {repos.find((repo) => repo.id === selectedRepoId)?.name || "Select a repo"}
              </span>
            </div>

            <div className="mt-5 flex h-105 flex-col rounded-2xl border border-sky/40 bg-sky/5 p-4">
              <div className="flex-1 space-y-3 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-sky/40 bg-white p-4 text-sm text-slate">
                    Ask a question like “How is authentication handled here?” to start the conversation.
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "assistant"
                          ? "bg-white text-slate"
                          : "ml-auto bg-teal text-white"
                      }`}
                    >
                      {message.content}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="mt-4 space-y-3">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about the repo..."
                  rows={3}
                  className="w-full rounded-2xl border border-sky/50 px-3 py-3 text-sm text-ink placeholder:text-slate/70 focus:border-teal focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !question.trim()}
                  className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-slate disabled:opacity-50"
                >
                  {isSubmitting ? "Thinking..." : "Send message"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
