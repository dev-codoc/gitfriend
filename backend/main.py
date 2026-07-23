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
import uuid

import chromadb
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llama_index.core import Document, VectorStoreIndex, StorageContext, Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.google_genai import GoogleGenAI

load_dotenv()

CHROMA_DB_PATH = "./chroma_db"

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
Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
Settings.llm = GoogleGenAI(model="gemini-2.5-flash", temperature=0.1)
reranker = SentenceTransformerRerank(
    model="cross-encoder/ms-marco-MiniLM-L-6-v2",
    top_n=5,
    keep_retrieval_score=True,
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

        chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        chroma_collection = chroma_client.get_or_create_collection(req.collection_name)
        vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
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
    chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)

    try:
        chroma_collection = chroma_client.get_collection(req.collection_name)
    except Exception:
        raise HTTPException(
            status_code=404,
            detail="This repo hasn't been indexed (or indexing failed). Try re-adding it.",
        )

    vector_store = ChromaVectorStore(chroma_collection=chroma_collection)
    index = VectorStoreIndex.from_vector_store(vector_store)

    query_engine = index.as_query_engine(
        similarity_top_k=15,
        node_postprocessors=[reranker],
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
