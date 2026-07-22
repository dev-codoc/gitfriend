import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function normalizeRepoName(githubUrl: string) {
  try {
    const url = new URL(githubUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  } catch {
    // fall back to raw input below
  }

  return githubUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repos = await prisma.repo.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ repos });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { githubUrl } = await request.json();
  if (!githubUrl || typeof githubUrl !== "string") {
    return NextResponse.json({ error: "A GitHub URL is required." }, { status: 400 });
  }

  const repoName = normalizeRepoName(githubUrl);
  const collectionName = `repo_${crypto.randomUUID()}`;

  const repo = await prisma.repo.create({
    data: {
      userId: session.user.id,
      githubUrl,
      name: repoName,
      collectionName,
      status: "ready",
    },
  });

  if (process.env.RAG_BACKEND_URL) {
    try {
      await fetch(`${process.env.RAG_BACKEND_URL}/ingest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ repo_url: githubUrl, collection_name: collectionName }),
      });
    } catch {
      // The backend may not be running yet. The UI can still function with the local scaffold.
    }
  }

  return NextResponse.json({ repo });
}
