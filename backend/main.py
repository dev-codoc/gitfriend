"""
MAIN.PY — The RAG "engine" for Gitfriend. Generalizes today's
chat-with-repo project: instead of one hardcoded repo, ANY user can submit
ANY public GitHub URL, and each gets its own isolated ChromaDB collection.

Two endpoints:
  POST /ingest  { repo_url, collection_name } -> clones, chunks, embeds, stores
  POST /chat    { collection_name, question } -> retrieves, re-ranks, answers

Next.js calls this service server-to-server (never directly from the
browser) — same reason you wouldn't expose a raw DB connection to the
client in a normal web app. Next.js owns auth + the user-facing database;
this service just does the AI work.
"""

import os
import shutil
import subprocess
import tempfile

from qdrant_client import QdrantClient
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_index.core import Document, VectorStoreIndex, StorageContext, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.fastembed import FastEmbedEmbedding
from llama_index.llms.google_genai import GoogleGenAI

load_dotenv()

# Broad language coverage — a real product can't assume every repo is JS.
INCLUDE_EXTS = {
    ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".go", ".rb", ".php",
    ".c", ".cpp", ".h", ".hpp", ".rs", ".cs", ".md", ".json", ".yml", ".yaml",
}
EXCLUDE_DIRS = {
    "node_modules", ".git", "dist", "build", ".vite", "venv", ".venv",
    "__pycache__", "target", "vendor", ".next",
}

# Loaded ONCE at process startup — same reasoning as the FastAPI lifespan
# pattern from earlier: expensive model loads happen once, not per request.
#
# FastEmbedEmbedding instead of the sentence-transformers/HuggingFace
# version: same model (BAAI/bge-small-en-v1.5), but runs on ONNX Runtime
# instead of PyTorch. torch alone commonly uses 300-500MB+ just being
# imported — on a memory-capped host (e.g. Render's free 512MB tier),
# that's the difference between fitting or getting OOM-killed. This is a
# genuine "pick your trade-off" moment: ONNX is lighter but has a
# narrower model selection than the full HuggingFace/sentence-transformers
# ecosystem.
Settings.embed_model = FastEmbedEmbedding(model_name="BAAI/bge-small-en-v1.5")
# Gemini 3.5 Flash (GA). Per Google's own 3.x migration guidance,
# temperature/top_p/top_k are no longer recommended — the model's
# reasoning is tuned around its defaults, so we don't pass them.
Settings.llm = GoogleGenAI(model="gemini-3.5-flash")

# NOTE: the cross-encoder re-ranker from earlier (SentenceTransformerRerank)
# is intentionally removed here — it also depends on sentence-transformers
# -> torch, and re-introducing it would bring the same OOM risk right
# back. Retrieval quality takes a step down without it (no second-pass
# re-scoring), but the service actually stays up on a memory-capped host.
# If you move to a host with more RAM later, this is the first thing
# worth adding back — see today's chat-with-repo project for the
# exact code.

# One shared client for the whole process, reused across requests — same
# "connect once, reuse everywhere" rule as the embedding/LLM models above.
# QDRANT_URL/QDRANT_API_KEY come from your Qdrant Cloud cluster's
# connection details (Cloud dashboard -> your cluster -> "Connect").
qdrant_client = QdrantClient(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
)

app = FastAPI(title="Gitfriend RAG Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class IngestRequest(BaseModel):
    repo_url: str
    collection_name: str


class IngestResponse(BaseModel):
    status: str
    file_count: int


class ChatRequest(BaseModel):
    collection_name: str
    question: str


class SourceInfo(BaseModel):
    file_path: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceInfo]


@app.post("/ingest", response_model=IngestResponse)
def ingest(req: IngestRequest):
    # Clone into a UNIQUE temp directory per request — this service could
    # get concurrent ingest calls for different repos, and they must never
    # share a clone folder. tempfile.mkdtemp() guarantees a fresh, unique
    # path every time (same idea as not reusing a variable name across
    # concurrent requests — isolation matters).
    clone_dir = tempfile.mkdtemp(prefix="gitfriend_clone_")

    try:
        try:
            subprocess.run(
                ["git", "clone", "--quiet", "--depth", "1", req.repo_url, clone_dir],
                check=True,
                capture_output=True,
                timeout=120,  # protect against a clone hanging forever
                text=True,
            )
        except subprocess.CalledProcessError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Could not clone repo (is it public and does it exist?): {e.stderr.strip()}",
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=400, detail="Cloning the repo took too long.")

        documents = []
        for root, dirs, files in os.walk(clone_dir):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for filename in files:
                ext = os.path.splitext(filename)[1]
                if ext not in INCLUDE_EXTS:
                    continue
                filepath = os.path.join(root, filename)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        text = f.read()
                except (UnicodeDecodeError, OSError):
                    continue
                if not text.strip():
                    continue
                rel_path = os.path.relpath(filepath, clone_dir)
                documents.append(Document(text=text, metadata={"file_path": rel_path}))

        if not documents:
            raise HTTPException(
                status_code=400,
                detail="No readable code/doc files found in this repo (check it isn't empty or entirely binary).",
            )

        vector_store = QdrantVectorStore(client=qdrant_client, collection_name=req.collection_name)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)

        splitter = SentenceSplitter(chunk_size=512, chunk_overlap=50)
        VectorStoreIndex.from_documents(
            documents,
            storage_context=storage_context,
            transformations=[splitter],
        )

        return IngestResponse(status="ready", file_count=len(documents))

    finally:
        # Always clean up the clone, even if ingestion failed partway —
        # otherwise every failed/successful ingest leaks disk space forever.
        shutil.rmtree(clone_dir, ignore_errors=True)


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    if not qdrant_client.collection_exists(req.collection_name):
        raise HTTPException(
            status_code=404,
            detail="This repo hasn't been indexed (or indexing failed). Try re-adding it.",
        )

    vector_store = QdrantVectorStore(client=qdrant_client, collection_name=req.collection_name)
    index = VectorStoreIndex.from_vector_store(vector_store)

    query_engine = index.as_query_engine(
        similarity_top_k=6,
        response_mode="tree_summarize",
    )

    try:
        response = query_engine.query(req.question)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"The AI backend failed: {e}")

    sources = [
        SourceInfo(
            file_path=node.node.metadata.get("file_path", "unknown"),
            score=float(node.score) if node.score is not None else 0.0,
        )
        for node in response.source_nodes
    ]
    return ChatResponse(answer=str(response), sources=sources)


@app.get("/health")
def health():
    return {"status": "ok"}