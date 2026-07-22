import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { repoId, question } = await request.json();
  if (!repoId || !question || typeof question !== "string") {
    return NextResponse.json({ error: "A repo and question are required." }, { status: 400 });
  }

  const repo = await prisma.repo.findFirst({
    where: { id: repoId, userId: session.user.id },
  });

  if (!repo) {
    return NextResponse.json({ error: "Repository not found." }, { status: 404 });
  }

  const chatSession = await prisma.chatSession.create({
    data: {
      repoId: repo.id,
      userId: session.user.id,
      title: question.slice(0, 48),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        sessionId: chatSession.id,
        role: "user",
        content: question,
      },
    ],
  });

  let answer = `I can help answer questions about ${repo.name}. For now this is a local scaffold, but the app is ready to connect to your Python RAG backend at ${process.env.RAG_BACKEND_URL || "http://localhost:8000"}.`;

  if (process.env.RAG_BACKEND_URL) {
    try {
      const backendResponse = await fetch(`${process.env.RAG_BACKEND_URL}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ repo_id: repo.id, question, collection_name: repo.collectionName }),
      });

      if (backendResponse.ok) {
        const backendPayload = await backendResponse.json();
        answer = backendPayload.answer || answer;
      }
    } catch {
      // Fall back to the local answer when the backend is unavailable.
    }
  }

  await prisma.message.create({
    data: {
      sessionId: chatSession.id,
      role: "assistant",
      content: answer,
    },
  });

  return NextResponse.json({ answer, sessionId: chatSession.id });
}
