# AI RAG Fastify Starter

Complete step-by-step guide to run, configure, and use this project.

## 1) Overview

This project implements a backend RAG pipeline with:

- Fastify (API server)
- Document upload (`.pdf` and `.txt`)
- Text parsing
- Text chunking
- OpenAI embeddings (`text-embedding-3-small`)
- Supabase storage (Postgres + pgvector)
- Semantic search via RPC function `match_documents`
- Chat answer generation with OpenAI (`gpt-4o-mini`)

Available endpoints:

- `POST /upload` to index documents
- `POST /chat` to ask questions about indexed documents

## 2) Requirements

- Node.js 20+ (Node 20 LTS or newer recommended)
- OpenAI account with API key
- Active Supabase project
- `vector` extension enabled in Postgres (pgvector)

## 3) Installation

From the project root:

```bash
npm install
```

Start in development mode:

```bash
npm run dev
```

Server URL:

- `http://localhost:3000`

## 4) Environment Variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

Notes:

- `OPENAI_API_KEY` is used for both embeddings and chat.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are used by the Supabase client in `src/plugins/supabase.ts`.

## 5) Supabase Database Setup (Required)

The code expects:

- `documents` table
- `content` column
- `embedding` column (vector)
- RPC function `match_documents(query_embedding, match_count)`

Run this in Supabase SQL Editor:

```sql
create extension if not exists vector;

create table if not exists documents (
  id bigserial primary key,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz default now()
);

create or replace function match_documents(
  query_embedding vector(1536),
  match_count int default 3
)
returns table (
  id bigint,
  content text,
  similarity float
)
language sql
as $$
  select
    d.id,
    d.content,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  order by d.embedding <=> query_embedding
  limit match_count;
$$;
```

Important:

- The embedding dimension `1536` must match `text-embedding-3-small`.
- The current code no longer writes a `source` field, so that column is not required.

## 6) Application Flow

### 6.1 Upload (`POST /upload`)

1. Accepts files in two modes:

- `multipart/form-data` (file field)
- raw body with `Content-Type: application/pdf` or `text/plain`

2. `parseFile` converts input to text (`src/services/ingest.ts`)
3. `smartChunk` splits text into chunks (`src/services/chunk.ts`)
4. Generates embeddings for each chunk (`src/services/embedding.ts`)
5. Inserts records into Supabase (`src/services/store.ts`)

### 6.2 Chat (`POST /chat`)

1. Receives `{ "question": "..." }`
2. Creates embedding for the question
3. Calls RPC `match_documents`
4. Builds a prompt with retrieved context
5. Calls `gpt-4o-mini` to generate the final answer

## 7) API Usage (Step by Step)

### 7.1 Quick check

```bash
curl http://localhost:3000/chat -X POST -H "Content-Type: application/json" -d "{\"question\":\"hello\"}"
```

If you have not uploaded any documents yet, answer quality will be poor.

### 7.2 Upload document (multipart)

```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@./example.pdf"
```

Or text:

```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@./example.txt"
```

### 7.3 Upload document (raw body)

Raw PDF:

```bash
curl -X POST http://localhost:3000/upload \
  -H "Content-Type: application/pdf" \
  --data-binary "@./example.pdf"
```

Raw text:

```bash
curl -X POST http://localhost:3000/upload \
  -H "Content-Type: text/plain" \
  --data-binary "This is a test document"
```

### 7.4 Chat

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d "{\"question\":\"What is the uploaded document about?\"}"
```

## 8) Project Structure

```text
src/
  server.ts                # Fastify bootstrap + parser + plugin/route registration
  plugins/
    openai.ts              # OpenAI client decorated on fastify.openai
    supabase.ts            # Supabase client decorated on fastify.supabase
    rag.ts                 # facade: fastify.rag.ask / fastify.rag.store
  routes/
    upload.ts              # upload endpoint
    chat.ts                # chat endpoint
  services/
    ingest.ts              # PDF/TXT parsing
    chunk.ts               # chunking with overlap
    embedding.ts           # OpenAI embeddings call
    store.ts               # insert chunk+embedding into Supabase
    rag.ts                 # retrieval + answer generation
```

## 9) Current Technical Configuration

- TypeScript runtime with `ts-node-dev`
- `strict: true` in `tsconfig.json`
- `module: "CommonJS"`
- `@fastify/multipart` aligned with Fastify v4 (`^8.x`)

## 10) Common Errors and Fixes

### 10.1 `415 Unsupported Media Type: application/pdf`

Cause:

- raw PDF request without a matching content-type parser.

Project status:

- handled with custom parsers in `server.ts`.

### 10.2 `FST_INVALID_MULTIPART_CONTENT_TYPE`

Cause:

- `request.file()` called on a non-multipart request.

Project status:

- handled in `upload.ts` with `request.isMultipart()` branching.

### 10.3 `PGRST204 Could not find the 'source' column`

Cause:

- insert payload includes a column that does not exist.

Project status:

- `source` removed from insert payload in `store.ts`.

### 10.4 Low-quality chat answers

Check:

- at least one successful upload was completed
- `match_documents` function exists
- `documents` table has data
- embedding dimension is `1536`

## 11) Current Limitations

- No auth/internal API key protection
- No request validation schema (`zod`/JSON schema)
- No retry/backoff strategy for OpenAI/Supabase calls
- No document deduplication
- Minimal logging

## 12) Quick Start Checklist

1. Set `.env` with all 3 variables.
2. Create table + RPC function in Supabase SQL.
3. Run `npm install`.
4. Run `npm run dev`.
5. Call `POST /upload` with a PDF.
6. Call `POST /chat` with a question about that PDF.

If these six steps work, your RAG pipeline is operational.
