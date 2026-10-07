# Organization AI Assistant

A complete, working reference implementation of an **Organization AI Assistant** powered by **Angular**, **NestJS**, **PostgreSQL with pgvector**, and an **external LLM + embedding provider**.

This project demonstrates the complete end-to-end RAG (Retrieval-Augmented Generation) lifecycle:

```text
Upload document → extract text → chunk → generate embeddings → store vectors →
ask question → retrieve relevant chunks → send context to LLM → stream answer → display answer with sources.
```

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               ANGULAR SPA (apps/web)                            │
│                                                                                 │
│  ┌────────────────────────┐                   ┌──────────────────────────────┐  │
│  │     Knowledge Base     │                   │          Chat Window         │  │
│  │  - DocumentList        │                   │  - ChatMessage (Markdown)    │  │
│  │  - DocumentUpload      │                   │  - SourceCitation            │  │
│  │  - Status Badges       │                   │  - LoadingIndicator          │  │
│  └───────────┬────────────┘                   └──────────────▲───────────────┘  │
│              │ Upload File                                   │ SSE Stream       │
│              │ (multipart)                                   │ (tokens+sources) │
└──────────────┼───────────────────────────────────────────────┼──────────────────┘
               │                                               │
               ▼                                               │
┌──────────────────────────────────────────────────────────────┴──────────────────┐
│                               NESTJS API (apps/api)                             │
│                                                                                 │
│  ┌────────────────────────┐  Text Extraction  ┌──────────────────────────────┐  │
│  │    DocumentsService    │──────────────────▶│  Parsers: TXT, PDF, DOCX     │  │
│  │    (Upload & Pipeline) │                   └──────────────┬───────────────┘  │
│  └────────────────────────┘                                  │ Text             │
│                                                              ▼                  │
│                                               ┌──────────────────────────────┐  │
│                                               │  TextChunkerService (Window) │  │
│                                               └──────────────┬───────────────┘  │
│                                                              │ Chunks           │
│                                                              ▼                  │
│  ┌────────────────────────┐  Embeddings Req   ┌──────────────────────────────┐  │
│  │     ChatService        │──────────────────▶│       EmbeddingService       │  │
│  │  (RAG & Streaming SSE) │                   │  (OpenAI / Compatible / Mock)│  │
│  └───────────┬────────────┘                   └──────────────┬───────────────┘  │
│              │ Vector Query                                  │ Vector array     │
│              ▼                                               ▼                  │
│  ┌────────────────────────┐  Prompt + Grounding ┌────────────────────────────┐  │
│  │   VectorService (HNSW) │                     │         LlmService         │  │
│  │   Cosine Sim: <=>      │                     │    (StreamChat Completion) │  │
│  └───────────┬────────────┘                     └────────────▲───────────────┘  │
└──────────────┼───────────────────────────────────────────────┼──────────────────┘
               │                                               │
               ▼                                               │
┌──────────────────────────────┐                               │
│    PostgreSQL + pgvector     │                               │
│                              │                               │
│  - organizations             │                               │
│  - documents                 │                               │
│  - document_chunks (vector)  │                               │
│  - conversations             │                               │
│  - messages (with sources)   │                               │
└──────────────────────────────┘                               │
                                                               │
                                                               ▼
                                              ┌─────────────────────────────────┐
                                              │     External LLM Provider       │
                                              │  (OpenAI / Gemini / Ollama API) │
                                              └─────────────────────────────────┘
```

---

## 1. Prerequisites

- **Node.js**: `v18+` (or `v20+` / `v24+`)
- **npm**: `v9+`
- **Docker & Docker Compose** (or a local/cloud PostgreSQL instance with `pgvector` enabled)
- **AI Provider API Key**: OpenAI, Google Gemini (via OpenAI compatibility), Groq, OpenRouter, or a local Ollama instance. (A built-in `mock` provider is also included for zero-config offline runs).

---

## 2. Starting PostgreSQL with pgvector

The repository includes a ready-to-use `docker-compose.yml` with the official PostgreSQL 16 `pgvector` image:

```bash
docker compose up -d
```

This starts PostgreSQL on port `5432` with:
- **Database**: `org_ai`
- **User**: `postgres`
- **Password**: `postgres`
- `vector` and `uuid-ossp` extensions automatically activated.

> **Using Cloud PostgreSQL or Remote Docker:**
> If using Supabase, Neon, AWS RDS, or a remote server, ensure the `vector` extension is enabled:
> ```sql
> CREATE EXTENSION IF NOT EXISTS vector;
> CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
> ```
> And update `DATABASE_URL` in your `.env`.

---

## 3. Configuring Environment Variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

### Key Configuration Variables

| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | API server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/org_ai` |
| `AI_PROVIDER` | LLM provider (`openai`, `mock`) | `openai` |
| `AI_API_KEY` | LLM API Key | `sk-...` |
| `AI_MODEL` | LLM model identifier | `gpt-4o-mini` |
| `AI_BASE_URL` | Optional custom base URL for OpenAI-compatible APIs | `https://api.openai.com/v1` |
| `EMBEDDING_PROVIDER` | Embedding provider (`openai`, `mock`) | `openai` |
| `EMBEDDING_API_KEY` | Embedding API Key (defaults to `AI_API_KEY`) | `sk-...` |
| `EMBEDDING_MODEL` | Embedding model identifier | `text-embedding-3-small` |
| `EMBEDDING_DIMENSION` | Embedding vector dimensions | `1536` |
| `STORAGE_PATH` | Local file storage folder | `../../storage/documents` |
| `DEMO_ORGANIZATION_ID`| UUID for the default demo organization | `00000000-0000-0000-0000-000000000001` |
| `CHUNK_SIZE` | Chunk size (characters) | `600` |
| `CHUNK_OVERLAP` | Chunk overlap (characters) | `80` |
| `TOP_K` | Number of chunks to retrieve for RAG | `5` |

---

## 4. Configuring the AI Provider

### Option A: OpenAI (Default)
```env
AI_PROVIDER=openai
AI_API_KEY=sk-proj-...
AI_MODEL=gpt-4o-mini
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
```

### Option B: Google Gemini (via OpenAI-Compatible Endpoint)
```env
AI_PROVIDER=openai
AI_API_KEY=your_gemini_api_key
AI_MODEL=gemini-1.5-flash
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-004
EMBEDDING_DIMENSION=768
EMBEDDING_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
```

### Option C: Local Ollama (Zero Cost, Fully Local)
```env
AI_PROVIDER=openai
AI_API_KEY=ollama
AI_MODEL=llama3.2:latest
AI_BASE_URL=http://localhost:11434/v1
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=nomic-embed-text
EMBEDDING_DIMENSION=768
EMBEDDING_BASE_URL=http://localhost:11434/v1
```

### Option D: Offline Mock Mode (No API Key Required)
```env
AI_PROVIDER=mock
EMBEDDING_PROVIDER=mock
```

---

## 5. Starting the Applications

### Installing Dependencies
From the repository root:
```bash
npm install
```

### Starting the Backend (NestJS API)
```bash
npm run start:api
```
The NestJS API starts on `http://localhost:3000`.
Health check: `http://localhost:3000/api/health`

### Starting the Frontend (Angular SPA)
In a separate terminal:
```bash
npm run start:web
```
The Angular application starts on `http://localhost:4200` with dev proxy configured to forward `/api` requests to `http://localhost:3000`.

---

## 6. Uploading the Sample Document

A sample employee handbook is included in `sample-data/employee-handbook.txt`:

```text
Employee Handbook

Annual Leave
Employees are entitled to 24 paid leave days per calendar year.
Leave requests should be submitted through the employee portal and
must be approved by the employee's manager.
Unused leave may be carried forward for up to 5 days into the following calendar year.

Sick Leave
Employees are entitled to 10 sick leave days per calendar year.

Remote Work
Employees may work remotely up to 3 days per week with manager approval.

Working Hours
Standard working hours are 9:00 AM to 6:00 PM, Monday through Friday.
```

### How to Index the Document:
1. Open the Angular app at `http://localhost:4200`.
2. In the **Knowledge Base** sidebar, click **"Load Sample Employee Handbook"** (or click **"[ Upload Document ]"** and choose `sample-data/employee-handbook.txt`).
3. The UI will show a processing state:
   - Extracting text
   - Splitting into chunks
   - Generating vector embeddings
   - Storing in pgvector
4. The status pill will turn green: `READY` with chunk count displayed.

---

## 7. How the RAG Pipeline Works

```text
1. User types question: "How many paid leaves do employees get?"
2. Angular streams request to POST /api/chat.
3. NestJS EmbeddingService creates a vector embedding of the user's question.
4. VectorService runs pgvector similarity search:
     ORDER BY embedding <=> :questionEmbedding ASC
     WHERE organization_id = :orgId
     LIMIT 5;
5. Top relevant chunks are retrieved with document filename and page numbers.
6. Server sends "event: sources" over Server-Sent Events (SSE) immediately.
7. RagPromptTemplate frames the context inside <organization_context> tags with
   strict anti-prompt-injection isolation instructions.
8. LlmService streams tokens through SSE ("event: token") as they are generated.
9. Angular renders markdown progressively in real-time.
10. Source citations card displays referenced documents and exact extracted snippets.
```

---

## 8. Database Schema

The database is built on PostgreSQL with multi-tenancy enforcement on all entities:

### `organizations`
- `id` (UUID, Primary Key)
- `name` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `documents`
- `id` (UUID, Primary Key)
- `organization_id` (UUID, Foreign Key → organizations.id)
- `filename` (VARCHAR)
- `mime_type` (VARCHAR)
- `file_path` (TEXT)
- `status` (`UPLOADED` | `PROCESSING` | `READY` | `FAILED`)
- `error_message` (TEXT, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `document_chunks`
- `id` (UUID, Primary Key)
- `document_id` (UUID, Foreign Key → documents.id)
- `organization_id` (UUID, Foreign Key → organizations.id)
- `content` (TEXT)
- `chunk_index` (INT)
- `page_number` (INT, nullable)
- `metadata` (JSONB)
- `embedding` (`vector(1536)`)
- `created_at` (TIMESTAMP)

### `conversations`
- `id` (UUID, Primary Key)
- `organization_id` (UUID, Foreign Key → organizations.id)
- `title` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### `messages`
- `id` (UUID, Primary Key)
- `conversation_id` (UUID, Foreign Key → conversations.id)
- `role` (`user` | `assistant`)
- `content` (TEXT)
- `sources` (JSONB, nullable)
- `created_at` (TIMESTAMP)

---

## 9. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health status of API, PostgreSQL connection, and pgvector |
| `POST` | `/api/documents/upload` | Upload & index file (`multipart/form-data`) |
| `GET` | `/api/documents` | List all documents for the organization |
| `DELETE` | `/api/documents/:id` | Remove document and its vector embeddings |
| `POST` | `/api/chat` | RAG query streaming endpoint (`SSE`) |
| `GET` | `/api/conversations` | List conversation history |
| `GET` | `/api/conversations/:id`| Get conversation details with all messages |
| `DELETE` | `/api/conversations/:id`| Delete conversation |

---

## 10. How Embeddings Work

1. When a document is uploaded, text is split into chunks of ~600 characters with 80-character overlap, breaking on paragraph and sentence boundaries.
2. The chunk strings are sent in batches to the `EmbeddingService`.
3. The provider returns an array of floating-point numbers (e.g. 1536 dimensions for `text-embedding-3-small`).
4. The vectors are saved to the `document_chunks.embedding` column.
5. In PostgreSQL, pgvector uses the cosine distance operator `<=>` (or inner product `<#>` / Euclidean `<->`) to calculate distance. Cosine distance ranges from `0.0` (identical) to `2.0` (opposite). Similarity score is calculated as `1 - distance`.

---

## 11. How to Replace the AI / LLM Provider

The application adheres to clean dependency inversion. The application depends on `LlmService`:

```ts
export interface LlmService {
  streamChat(messages: LlmChatMessage[], options?: LlmOptions): AsyncIterable<string>;
  completeChat(messages: LlmChatMessage[], options?: LlmOptions): Promise<string>;
}
```

To add a new provider (e.g. Anthropic Claude, AWS Bedrock):
1. Create `apps/api/src/ai/llm/anthropic-llm.service.ts` implementing `LlmService`.
2. Register the provider in `apps/api/src/ai/ai.module.ts` based on `config.get('AI_PROVIDER') === 'anthropic'`.
3. Set `AI_PROVIDER=anthropic` in `.env`.

---

## 12. How to Replace the Embedding Provider

Similarly, embeddings depend on `EmbeddingService`:

```ts
export interface EmbeddingService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  getDimension(): number;
}
```

To add a new embedding provider:
1. Create `apps/api/src/ai/embeddings/cohere-embedding.service.ts` implementing `EmbeddingService`.
2. Register in `apps/api/src/ai/ai.module.ts`.
3. Set `EMBEDDING_PROVIDER=cohere` in `.env`.

---

## 13. Security & Anti-Prompt-Injection Defense

- **API Keys**: Stored exclusively in server `.env`; never sent to Angular.
- **File Validation**: MIME type and file extension validation, size limits (15MB), traversal prevention via `path.resolve` and strict filename sanitization.
- **Tenant Isolation**: Every vector retrieval query strictly enforces `WHERE organization_id = :orgId`. Cross-tenant retrieval is impossible.
- **Prompt Injection Defense**: Untrusted text from indexed documents is isolated within `<organization_context>` tags. The system prompt contains explicit guardrail directives ordering the LLM to treat all context purely as passive factual reference and to ignore any commands or override attempts.

---

## 14. Demo Acceptance Test Walkthrough

Follow these steps to verify full functionality:

### Step 1: Upload Handbook
Upload `sample-data/employee-handbook.txt` via the UI.

### Step 2: Verification of Indexing
Verify that status changes to `READY` with chunk count displayed.

### Step 3: Test Policy Retrieval
**Question:**
> *"How many paid leaves do employees get?"*

**Expected Answer:**
Mentions **24 paid leave days** and cites `employee-handbook.txt` as source.

### Step 4: Test Secondary Policy
**Question:**
> *"Can employees work remotely?"*

**Expected Answer:**
Explains that employees can work remotely **up to 3 days per week with manager approval**, citing `employee-handbook.txt`.

### Step 5: Test Hallucination Prevention
**Question:**
> *"What is the company's maternity leave policy?"*

**Expected Answer:**
The assistant does NOT invent an answer and responds:
> *"I couldn't find that information in the organization's available documents."*

