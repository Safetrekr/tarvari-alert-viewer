# Tarva Platform — System Overview

**Version:** 3.0
**Last Updated:** 2026-02-25
**Status:** Published

---

## Executive Summary

Tarva is a **local-first platform for building, managing, deploying, and running specialized AI agents** for Claude Code, alongside vertical applications (ERP, autonomous reasoning) that demonstrate the platform in production contexts. It spans nine interconnected repositories and multiple runtime services that together form a complete agent lifecycle — from domain expertise capture through automated generation, human-in-the-loop quality review, deployment, multi-agent chat, project-level orchestration, and vertical application delivery.

The system produces agents with deep domain skills (41 deployed, 2,034 skills, 95.8% World-Class) by orchestrating local LLM inference, structured generation pipelines, vector-backed knowledge search, a web-based IDE for guided creation, a multi-agent chat interface, and a project orchestration platform.

---

## 1. System Context

```
                                    ┌──────────────────────────┐
                                    │      Claude Code CLI     │
                                    │  (loads deployed agents) │
                                    └────────────┬─────────────┘
                                                 │ reads ~/.claude/agents/*.md
                                                 │ + reference/<agent>/skills/
    ┌───────────────┐               ┌────────────▼─────────────┐
    │   Developer   │──────────────▶│   Tarva Agent Builder     │
    │   (Browser)   │  localhost:3000│   (Next.js 16)           │
    │               │               └──┬──────────┬────────────┘
    │               │                  │          │
    │               │     subprocess   │          │  Supabase SDK
    │               │     (stdin/out)  │          │
    │               │                  ▼          ▼
    │               │  ┌──────────────────┐  ┌─────────────────────────┐
    │               │  │ AgentGen CLI     │  │   Local Supabase        │
    │               │  │ (Python)         │  │   PostgreSQL + pgvector  │
    │               │  └────────┬─────────┘  └─────────────────────────┘
    │               │           │ inference        ▲         ▲
    │               │           ▼                  │         │
    │               │  ┌──────────────────┐   ┌────┘    ┌────┘
    │               │  │ Ollama           │   │         │
    │               │  │ (Local LLM)      │   │    ┌────┴──────────────┐
    │               │  └──────────────────┘   │    │ Agent Selector    │
    │               │                         │    │ MCP               │
    │               │                    ┌────┴──┐ └───────────────────┘
    │               │                    │Knowledge│
    │               │                    │MCP     │◀── Embedding Server
    │               │                    └────────┘    (FastAPI + BGE)
    │               │
    │               │──────────────▶┌──────────────────────────┐
    │               │  localhost:4000│   Tarva Chat              │
    │               │               │   (Next.js 16)            │
    │               │               │   Multi-agent chat UI     │
    │               │               └──────────┬───────────────┘
    │               │                          │ Claude API + Ollama
    │               │                          │ + MCP tool calls
    │               │                          ▼
    │               │               reads ~/.claude/agents/*.md
    │               │
    │               │──────────────▶┌──────────────────────────┐
    │               │  localhost:3005│   Tarva Project Room      │
    │               │               │   (Next.js 16)            │
    │               │               │   Agent orchestration     │
    │               │               └──────────┬───────────────┘
    │               │                          │ Claude API + Inngest
    │               │                          │ + Supabase (cloud)
    │               │                          ▼
    │               │               Runs agents on projects with
    │               │               truth governance + artifact tracking
    │               │
    │               │──────────────▶┌──────────────────────────┐
    │               │               │   TarvaCORE (Electron)    │
    │               │               │   Autonomous reasoning    │
    │               │               │   llama.cpp + MCP bridge  │
    │               │               └──────────────────────────┘
    │               │
    │               │──────────────▶┌──────────────────────────┐
    │               │               │   TarvaERP v2 (Next.js)   │
    │               │               │   Manufacturing ERP       │
    │               │               │   5 modules, 52 pages     │
    │               │               └──────────────────────────┘
    │               │
    │               │──────────────▶┌──────────────────────────┐
    └───────────────┘               │   tarvaCODE               │
                                    │   MCP config + knowledge  │
                                    │   management (planning)   │
                                    └──────────────────────────┘
```

---

## 2. Repositories

| Repo                             | GitHub                                   | Local Path                              | Purpose                                                                                                  |
| -------------------------------- | ---------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **tarva-claude-agents**          | `tarva-org/tarva-claude-agents`          | `~/.claude/agents/`                     | Agent definitions, AgentGen CLI, MCP servers, reference materials                                        |
| **tarva-claude-agents-frontend** | `tarva-org/tarva-claude-agents-frontend` | `~/Sites/tarva-claude-agents-frontend/` | Web IDE for agent creation & management (Agent Builder)                                                  |
| **tarva-chat**                   | `tarva-org/tarva-chat`                   | `~/Sites/tarva-org/tarva-chat/`         | Multi-agent chat interface with streaming, skills, MCP tools                                             |
| **tarva-projects-app**           | `tarva-org/tarva-projects-app`           | `~/Sites/tarva-org/tarva-projects-app/` | Project orchestration platform (Project Room) — runs agents on projects                                  |
| **tarva-ui-library**             | `tarva-org/tarva-ui-library`             | `~/Sites/tarva-ui-library/`             | Shared UI component library (@tarva/ui). Also git submodule at `packages/tarva-ui` in all frontend repos |
| **TarvaCORE-Org**                | `tarva-org/TarvaCORE-Org`                | `~/Sites/TarvaCORE-Org/`                | Electron desktop app — autonomous AI reasoning engine (llama.cpp, MCP bridge, multi-stage reasoning)     |
| **tarvaCODE**                    | `tarva-org/tarvaCODE`                    | `~/Sites/tarvaCODE/`                    | Project-scoped AI conversation management with MCP integration (planning stage)                          |
| **Tarva-ERP-2025**               | `tarva-erp/Tarva-ERP-2025`               | `~/Sites/Tarva-ERP-2025/`               | Manufacturing/warehouse ERP frontend (Next.js 16, 5 modules, 52 pages, mock data phase)                  |
| **agent-data**                   | (local)                                  | `~/projects/agent-data/`                | Supabase project (migrations, pgvector config)                                                           |

All repos use `develop` → `main` branch workflow.

---

## 3. Container Architecture

### 3.1 Tarva Agent Builder (Web IDE)

**Tech Stack:**

| Layer           | Technology                                  |
| --------------- | ------------------------------------------- |
| Framework       | Next.js 16 (App Router)                     |
| UI              | React 19, Tailwind CSS v4, Radix UI         |
| Components      | `@tarva/ui` (shared library) + shadcn/ui    |
| State           | Zustand 5 + Immer                           |
| Validation      | Zod 4                                       |
| Charts          | Recharts                                    |
| Markdown        | react-markdown + rehype-highlight           |
| Bundler         | Turbopack (dev), SWC                        |
| Tests           | Vitest + React Testing Library (360+ tests) |
| Package Manager | pnpm (workspace monorepo)                   |

**What it does:**

- **Project Wizard** — Create agent projects, upload domain context documents (MD, TXT, PDF, YAML)
- **18-Step Generation Pipeline** — Orchestrates AgentGen CLI via subprocess, streams real-time progress through SSE (Server-Sent Events)
- **Human-in-the-Loop Gates** — 3 approval checkpoints (after persona, after system prompt, after all skills) where user reviews and approves/rejects
- **Agent Library** — Browse 41 installed agents, view skills, reference materials, maturity badges
- **Knowledge Dashboard** — Per-agent document management with upload, soft-delete, audit logs, analytics charts
- **Export & Publish** — ZIP export of agent bundles, atomic publish to `~/.claude/agents/` with auto-backup

**Key Architecture:**

| Concern             | Implementation                                              |
| ------------------- | ----------------------------------------------------------- |
| CLI Integration     | `src/lib/cli/process-manager.ts` — spawns Python subprocess |
| Real-time Streaming | SSE via `/api/projects/[slug]/runs/[runId]/events`          |
| Event Format        | JSONL emitted by CLI, parsed by `LineBuffer`                |
| File Storage        | `~/.claude/agents/projects/{slug}/` (local-first)           |
| Build Storage       | `~/.claude/agentgen/builds/{runId}/`                        |
| Security            | Path validation, injection prevention (27 test cases)       |
| Error Recovery      | Retry with exponential backoff, error classification        |

**API Surface:** 28 Next.js API routes covering projects, generation, checkpoints, enrichment, export, publish, agent library, and Ollama model listing.

---

### 3.2 Tarva Chat (Multi-Agent Chat)

**Tech Stack:**

| Layer           | Technology                                            |
| --------------- | ----------------------------------------------------- |
| Framework       | Next.js 16 (App Router), React 19                     |
| State           | Zustand 5 + Immer (5-slice store)                     |
| UI              | @tarva/ui (60+ primitives), Tailwind CSS v4           |
| Validation      | Zod 4                                                 |
| AI Providers    | Anthropic Claude SDK + Ollama (hybrid router)         |
| Streaming       | Server-Sent Events (SSE) with ChatEvent normalization |
| Database        | Local Supabase (PostgreSQL + pgvector, offset ports)  |
| Encryption      | AES-256-GCM (API keys at rest)                        |
| Tests           | Vitest + Testing Library (742 tests, 63 files)        |
| Package Manager | pnpm (workspace monorepo)                             |

**What it does:**

Multi-agent AI chat application for developers. Agents load dynamically from `~/.claude/agents/` and become first-class UI citizens with their own model, tools, skills, and system prompt.

- **Real-time SSE streaming** from Claude API and Ollama with ChatEvent normalization
- **Agent picker** (Cmd+K) with search across all agents, per-conversation agent switching
- **Hybrid provider router** — model ID prefix determines SDK (`claude-*` → Claude, `ollama:*` → Ollama)
- **Skill system** — implicit (keyword-based) and explicit (`/use skill-name`) matching with confirmation UI
- **MCP tool execution** — inline in chat with collapsible result cards, 17 servers across 3 tiers
- **Conversation persistence** to Supabase with pgvector semantic search
- **Agent export/import** — bundle agents as `.tarva-agent` ZIP files for sharing
- **PDF upload** via drag-and-drop with text extraction
- **API key encryption** — AES-256-GCM for provider keys at rest

**Key Architecture:**

| Concern         | Implementation                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------- |
| Agent Loading   | `lib/agents/loader.ts` — reads `~/.claude/agents/*.md` at startup                               |
| Streaming       | SSE via `POST /api/chat` → ChatEvent types: text_delta, tool_call_start, tool_call_result, done |
| Provider Router | Model prefix routing: `claude-*` → Anthropic SDK, `ollama:*` → local Ollama                     |
| MCP Tiers       | Singleton (app lifetime), Pooled (idle-reaped 5min), Ephemeral (per-request)                    |
| State           | 5 Zustand slices: conversation, chat, agent, settings, ui                                       |
| Database        | 7 tables: conversations, messages, tool_calls, api_keys, agents, settings, tags                 |

**Ports:** Dev server on `localhost:4000`. Supabase offset +10 (54331 API, 54332 DB) to avoid conflicts with Agent Builder.

**API Surface:** 20+ Next.js API routes covering chat streaming, agent CRUD, conversation management, skill search, MCP health, API key management, and agent export/import.

---

### 3.3 Tarva Project Room (Agent Orchestration)

**Tech Stack:**

| Layer           | Technology                                            |
| --------------- | ----------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack), React 19          |
| Server State    | TanStack Query (React Query) 5                        |
| Client State    | Zustand 5 + Immer (workflow canvas only)              |
| UI              | @tarva/ui (shadcn-based), Tailwind CSS v4             |
| Workflow UI     | React Flow (@xyflow/react) 12                         |
| Validation      | Zod 4, AJV 8                                          |
| AI Providers    | Anthropic Claude API (primary), OpenAI (optional)     |
| Async Tasks     | Inngest 3.52                                          |
| Database        | Supabase (cloud hosted, 8 schemas, 90+ tables)        |
| Tests           | Vitest + Testing Library, Playwright (334 test files) |
| Package Manager | pnpm                                                  |

**What it does:**

Multi-agent orchestration platform for executing agents on complex projects with full transparency and control. This is the runtime environment where agents work together.

- **Agent Execution** — Run local or remote agents with prompts, full audit trail
- **Artifact Tracking** — Extract and manage outputs (code, documents, data) with versioning
- **Truth Governance** — Canonical registry of decisions, requirements, constraints, and definitions
- **Dependency DAG** — Track artifact dependencies with cascading invalidation
- **Phase Gates** — Definition of Done criteria for project milestones with human control points
- **Workflow Visualization** — React Flow canvas for multi-agent orchestration
- **Job Queue** — Async execution via Inngest with priority, retries, and failure recovery
- **Cost Controls** — Budget tracking, rate limiting, cost projections before execution
- **Marketplace** — Template library and MCP server discovery with one-click install
- **Auto-generated Documentation** — 334 files covering database, API, services, components

**Key Architecture:**

| Concern         | Implementation                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Agent Loading   | Reads from `~/.claude/agents/` or agent registry                                                 |
| Execution       | Anthropic Claude API with full run manifests (timing, tokens, status, provenance)                |
| Async Jobs      | Inngest for background processing with priority queue and retry                                  |
| State Split     | TanStack Query (server data) + Zustand (workflow canvas with undo/redo)                          |
| DB Schemas      | 8 schemas: identity, artifacts, truth, provenance, governance, resumability, routing, scheduling |
| Supabase Access | 3 client types: Client (RLS), Server (RLS async), Service (RLS bypassed)                         |

**Implementation Status (9 phases):**

| Phase     | Domain                                                                                            | Status   |
| --------- | ------------------------------------------------------------------------------------------------- | -------- |
| Phase 0   | Cross-cutting (Identity, Security)                                                                | Complete |
| Phase 1   | Standards (Quality, Artifacts)                                                                    | Complete |
| Phase 2   | Truth Governance (Decisions, Dependencies, DAG)                                                   | Complete |
| Phase 3-9 | Adjudication, Provenance, Data Governance, Resumability, Human Control, Model Routing, Scheduling | Scaffold |

**Ports:** Dev server on `localhost:3005`.

**API Surface:** 40+ Next.js API routes covering runs, projects, artifacts, truth governance, dependencies, phase gates, marketplace, MCP servers, and search.

**Scale:** 51 pages, 113 React components, 39 core services, 110 binding decisions, 1,107 acceptance criteria.

---

### 3.4 AgentGen CLI (Python Toolchain)

**Tech Stack:**

| Layer         | Technology                           |
| ------------- | ------------------------------------ |
| Language      | Python 3.11+                         |
| CLI Framework | Typer                                |
| Terminal UI   | Rich                                 |
| LLM Client    | Ollama Python SDK, OpenAI Python SDK |
| Serialization | PyYAML, JSON                         |
| Linting       | ruff, mypy                           |
| Tests         | pytest (613 tests)                   |

**What it does:**

The core generation engine. Can run standalone via CLI or be orchestrated by the frontend.

**Pipeline Phases:**

```
PLAN  →  EXECUTE  →  ASSEMBLE  →  ENRICH  →  FINALIZE  →  PUBLISH
  │         │            │            │           │            │
  │         │            │            │           │            └─ Atomic deploy to ~/.claude/agents/
  │         │            │            │           └─ Quality review, human gates
  │         │            │            └─ Generate reference files (templates, examples, guides, checklists)
  │         │            └─ Combine into agent.md + skills/ + description rewrite
  │         └─ Generate persona + skill definitions via Ollama
  └─ Analyze context, map domain, plan skill coverage
```

**Post-Assembly Processing:**

After assembly, several deterministic and LLM-driven enrichment steps fire automatically:

| Step                          | Module                    | Purpose                                                              |
| ----------------------------- | ------------------------- | -------------------------------------------------------------------- |
| **Description Rewrite**       | `description_rewriter.py` | LLM-generated cross-domain description (Ollama or OpenAI)            |
| **Execution Context (EC)**    | `ec_generator.py`         | Deterministic 1,800-2,200 token summary for runtime prompt injection |
| **Reference Materialization** | `materializer.py`         | Deterministic 3,000 token condensed reference block                  |
| **Quality Rubric**            | `rubric_generator.py`     | Standardized quality rubric with closed-loop validation              |

**Generation Modules:**

| Module                    | Purpose                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `planner.py`              | Manifest generation: parses persona/skills refs into structured section definitions  |
| `section.py`              | Section-by-section LLM generation with streaming, checkpointing for resumability     |
| `assembler.py`            | Stitches generated sections into final agent.md, SKILL.md, and skills-index.yaml     |
| `enricher.py`             | Generates reference files (template, example, guide, checklist, manifest.json)       |
| `description_rewriter.py` | Rewrites agent description field using full assembled context across all domains     |
| `rubric_generator.py`     | Generates standardized quality rubrics with closed-loop validation                   |
| `ec_generator.py`         | Deterministic Execution Context extraction (7 compression rules, no LLM)             |
| `materializer.py`         | Deterministic reference materialization (6-step pipeline, no LLM)                    |
| `watchdog.py`             | Streaming stall detection daemon; monitors token flow and triggers timeout callbacks |

**MCP Discovery & Management** subsystem (`tooling/agentgen/mcp/`) catalogs, resolves, and binds MCP servers to agents during generation:

| Module                 | Purpose                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| `catalog.py`           | MCP server catalog with user-override precedence                          |
| `resolver.py`          | Pure deterministic resolver: binding + catalog → lockfile (no I/O or LLM) |
| `loading_protocol.py`  | Idempotent injection of Loading Protocol section into agent files         |
| `binding_generator.py` | Converts agent-MCP mapping YAML to McpAgentBinding format                 |
| `validators.py`        | Structural & semantic validation for catalog/binding/lockfile             |

**Key Commands:**

| Command                          | Purpose                                                 |
| -------------------------------- | ------------------------------------------------------- |
| `agentgen new`                   | Interactive new agent creation                          |
| `agentgen run <job-id>`          | Execute full pipeline                                   |
| `agentgen resume <job-id>`       | Resume interrupted job                                  |
| `agentgen publish <job-id>`      | Deploy to `~/.claude/agents/`                           |
| `agentgen backfill-refs <agent>` | Generate missing reference materials                    |
| `agentgen add-skills <agent>`    | Add new skills to deployed agent                        |
| `agentgen rewrite-description`   | Rewrite agent description(s) via LLM (Ollama or OpenAI) |
| `agentgen validate <job-id>`     | Validate agent integrity                                |
| `agentgen check-status <agent>`  | Integrity check for deployment status                   |
| `agentgen fleet inventory`       | Show all agents/skills across the fleet                 |
| `agentgen fleet migrate`         | Protocol v2 migration tooling                           |
| `agentgen fleet compliance`      | Compliance status and validation                        |
| `agentgen orchestrate`           | High-level workflow orchestration (plan → publish)      |

**Publish System:**

Atomic publishing with rollback support:

1. Create `PublishPlan` (hash files, detect conflicts)
2. Acquire file lock (prevent concurrent publishes)
3. Stage to `.staging-<uuid>/`
4. Verify integrity
5. Backup existing agent (timestamped)
6. Atomic swap to target
7. Record event, cleanup

**Job State:**

Each build lives in `builds/<uuid>/` with `job.json`, `state.yaml`, `sections/` (resumable partial outputs), `outputs/`, and `events.jsonl`. Jobs can be interrupted and resumed.

---

### 3.5 @tarva/ui (Component Library)

**Tech Stack:**

| Layer           | Technology                                      |
| --------------- | ----------------------------------------------- |
| Build           | tsup (ESM + CJS dual output)                    |
| Components      | Radix UI primitives (25+ components)            |
| Styling         | Tailwind CSS v4, CVA (Class Variance Authority) |
| Drag & Drop     | @dnd-kit                                        |
| Data Grid       | AG Grid (optional peer dep)                     |
| Carousel        | Embla Carousel                                  |
| Panels          | react-resizable-panels                          |
| Command Palette | cmdk                                            |
| Icons           | Lucide React                                    |
| Docs            | Storybook 8                                     |
| Tests           | Vitest + Testing Library                        |

**What it provides:**

A sharable design system with 7 export paths:

- `@tarva/ui` — Core components (accordion, dialog, dropdown, tabs, tooltip, etc.)
- `@tarva/ui/styles.css` — Design tokens and base styles
- `@tarva/ui/motion` — Animation utilities
- `@tarva/ui/providers` — Theme provider, context providers
- `@tarva/ui/utils` — `cn()` helper, utilities
- `@tarva/ui/data-grid` — AG Grid wrapper with custom styling
- `@tarva/ui/tokens` — Design token definitions

**Integration:** Git submodule at `packages/tarva-ui` in all three frontend repos (Agent Builder, Chat, Project Room), consumed as a pnpm workspace dependency.

---

### 3.6 Knowledge MCP (Runtime RAG)

**Tech Stack:**

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Language   | TypeScript                          |
| Protocol   | Model Context Protocol (MCP) SDK v1 |
| Database   | Supabase (PostgreSQL + pgvector)    |
| Validation | Zod                                 |
| Logging    | Pino                                |
| Tests      | Vitest (150 tests)                  |

**What it does:**

Provides semantic search over agent reference materials at runtime. When an agent needs context, it queries this MCP server.

**Tools Exposed (Active):**

| Tool                | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `search_knowledge`  | Vector similarity search (query + agent + source_type filters)  |
| `get_skill_context` | Load full skill definition + references + upstream dependencies |
| `store_feedback`    | Record retrieval quality signals                                |
| `list_agents`       | Browse registered agents                                        |
| `get_agent_stats`   | Knowledge statistics per agent                                  |

**Tools (Schema-defined, not yet wired):**

| Tool                                   | Purpose                |
| -------------------------------------- | ---------------------- |
| `delete_document` / `restore_document` | Soft-delete management |
| `bulk_delete` / `bulk_restore`         | Batch operations       |
| `get_audit_log`                        | Browse change history  |

---

### 3.7 Skill Resolver MCP

**What it does:**

Resolves skill dependencies at runtime. When an agent activates, it can query for relevant skills and load them with full upstream dependency chains.

**Tools Exposed:**

| Tool                     | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `find_skills_for_task`   | Match skills to a task description (keyword relevance ranking) |
| `list_agent_skills`      | List all skills organized by domain                            |
| `resolve_skill_context`  | Load skill + upstream dependency chain + reference files       |
| `get_skill_dependencies` | Show upstream/downstream dependency graph                      |

---

### 3.8 Agent Selector MCP

**Tech Stack:** TypeScript, MCP SDK, Supabase, OpenAI embeddings

**What it does:**

Semantic agent selection using pgvector embeddings. Given a task description, finds the best-matched agent from the registry.

**Tools Exposed:**

| Tool                | Purpose                           |
| ------------------- | --------------------------------- |
| `select_best_agent` | Semantic match: task → best agent |
| `list_agents`       | Browse all registered agents      |
| `get_agent_skills`  | Get skills for a specific agent   |

---

### 3.9 Embedding Server

**Tech Stack:** FastAPI, BAAI/bge-large-en-v1.5, 1024-dim vectors

**What it does:**

Local HTTP service that generates text embeddings for the knowledge pipeline.

| Endpoint            | Purpose                       |
| ------------------- | ----------------------------- |
| `POST /embed`       | Single text → 1024-dim vector |
| `POST /embed-batch` | Batch texts → vectors         |
| `GET /health`       | Health check                  |

**Port:** `127.0.0.1:8100`

---

### 3.10 Local Supabase

**Location:** `~/projects/agent-data/`

**What it provides:** PostgreSQL 15 + pgvector extension with HNSW indexing.

**Key Tables:**

| Table                 | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `agents`              | Agent registry (slug, name, file_path, status)    |
| `documents`           | Uploaded/ingested files (content_hash dedup)      |
| `knowledge_chunks`    | Chunked content (~500 tokens, heading boundaries) |
| `embeddings`          | 1024-dim BGE vectors (HNSW indexed)               |
| `knowledge_audit_log` | Immutable change history                          |
| `knowledge_sources`   | Legacy FK table                                   |

---

### 3.11 TarvaCORE (Autonomous Reasoning Desktop App)

**Tech Stack:**

| Layer       | Technology                                      |
| ----------- | ----------------------------------------------- |
| Shell       | Electron                                        |
| Frontend    | React (frontend-v2)                             |
| LLM Runtime | llama.cpp (bundled, local inference)            |
| MCP Bridge  | Custom bridge connecting Electron ↔ MCP servers |
| LLM Gateway | Custom gateway service for model routing        |

**What it does:**

Desktop application for autonomous AI reasoning — designed for **explainable, verifiable decision intelligence** rather than conventional chat. Implements a multi-stage reasoning engine that decomposes queries into atomic units, enriches via retrieval/search/code execution, validates through multi-source corroboration, and produces traceable outputs.

**Key Components:**

| Component       | Purpose                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| `electron-app/` | Window management, system tray, health monitoring, graceful shutdown orchestration |
| `frontend-v2/`  | Current React UI                                                                   |
| `llm-gateway/`  | Model routing and inference management                                             |
| `llama.cpp/`    | Bundled local LLM runtime                                                          |

**Status:** Active development.

---

### 3.12 TarvaERP v2 (Manufacturing ERP)

**Tech Stack:**

| Layer           | Technology                                        |
| --------------- | ------------------------------------------------- |
| Framework       | Next.js 16 (App Router), TypeScript (strict mode) |
| Package Manager | pnpm                                              |
| Styling         | Tailwind CSS v4 + shadcn/ui                       |
| Data Tables     | AG Grid React v34                                 |
| Charts          | Chart.js with shadcn chart components             |
| State           | TanStack Query (server) + Zustand (UI)            |
| Testing         | Vitest + React Testing Library, Playwright (E2E)  |

**What it does:**

Enterprise resource planning frontend for manufacturing and warehouse operations. Dark-themed interface with 5 modules, 52 pages, and 83 detail drawers (slide-in panels).

**Target Users:** Warehouse managers, production supervisors, procurement teams, quality control staff, system administrators.

**Status:** Frontend complete (mock data phase, ready for backend integration).

---

### 3.13 tarvaCODE (AI Conversation Knowledge Management)

**What it does:**

Project-scoped AI conversation management with MCP integration for development teams. Transforms ephemeral AI interactions into durable, searchable team knowledge.

**Core Concept:**

| Feature                  | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| Project Isolation        | Each project is a separate context boundary                            |
| Conversation Persistence | Store and retrieve conversation history                                |
| Full-Text Search         | Search within a project's conversations                                |
| MCP Endpoints            | Each project exposes an MCP endpoint for Claude Code and other clients |
| Team Collaboration       | Shared project knowledge through common endpoints                      |

**Status:** Planning stage. Has `web/` (Vite + React app skeleton) and `plans/` (18 planning docs).

---

## 4. Data Flows

### 4.1 Agent Creation (Frontend-Driven)

```
Developer                Frontend               AgentGen CLI          Ollama
    │                        │                       │                  │
    │── Create Project ─────▶│                       │                  │
    │── Upload Context ─────▶│                       │                  │
    │── Start Generation ───▶│                       │                  │
    │                        │── spawn subprocess ──▶│                  │
    │                        │                       │── LLM inference ▶│
    │                        │◀── JSONL events ──────│◀── response ─────│
    │◀── SSE stream ─────────│                       │                  │
    │                        │                       │                  │
    │   [Gate A: Review Persona]                     │                  │
    │── Approve ────────────▶│── stdin signal ──────▶│                  │
    │                        │                       │── more inference ▶│
    │◀── SSE progress ───────│◀── JSONL events ──────│◀── response ─────│
    │                        │                       │                  │
    │   [Gate B: Review System Prompt]               │                  │
    │── Approve ────────────▶│── stdin signal ──────▶│                  │
    │                        │                       │                  │
    │   [Gate C: Review All Artifacts]               │                  │
    │── Approve ────────────▶│                       │                  │
    │── Publish ────────────▶│── agentgen publish ──▶│                  │
    │◀── Success ────────────│                       │                  │
    │                        │                       │                  │
```

### 4.2 Agent Creation (CLI-Driven)

```bash
agentgen new                        # Interactive setup
agentgen run <job-id>               # Full pipeline → builds/<uuid>/outputs/
                                    #   Includes: plan, execute, assemble (+ description rewrite),
                                    #   enrich, EC generation, materialization, finalize
agentgen publish <job-id>           # Deploy to ~/.claude/agents/ (with compliance gate)
```

### 4.3 Description Rewrite Flow

```
Agent .md file + skills-index.yaml
         │
         ├── Extract domain/skill context
         │   (re-derives domains from skill paths if index is flat)
         │
         ├── Build LLM prompt with cross-domain coverage requirement
         │
         ├── Generate via Ollama or OpenAI
         │
         ├── Validate (7 rules: length, format, boilerplate, YAML safety)
         │   └── Retry with error feedback if validation fails (max 2 retries)
         │
         ├── Programmatically append activation triggers
         │
         └── Patch YAML frontmatter (round-trip safe)
```

### 4.4 Knowledge Ingestion Pipeline

```
reference/<agent>/skills/**/*.md
         │
         ▼
    ingest-to-db.py ──────▶ Embedding Server ──────▶ Local Supabase
    (chunk by headings)      (BGE 1024-dim)          (documents → chunks → embeddings)
```

### 4.5 Runtime Agent Loading

```
User types #agent-name in Claude Code
         │
         ▼
    Claude Code loads ~/.claude/agents/<agent-name>.md
         │
         ├──▶ Skill Resolver MCP ──▶ Resolves skill + upstream deps
         │                            Returns SKILL.md + references
         │
         └──▶ Knowledge MCP ──▶ Semantic search over embeddings
                                 Returns relevant context chunks
```

---

## 5. Agent Output Structure

When an agent is published, it creates this file structure:

```
~/.claude/agents/
├── <agent-name>.md                         # Agent definition (YAML frontmatter + system prompt)
└── reference/<agent-name>/
    ├── skills-index.yaml                   # Domain → skill mapping (v2.0.0 with EC, rubrics)
    ├── reverse-index.yaml                  # Deliverable → skill lookup
    └── skills/<domain>/<skill-slug>/
        ├── SKILL.md                        # Skill definition (400-800 lines for World-Class)
        └── references/
            ├── manifest.json               # Completeness gate
            ├── <deliverable>-template.md   # Reusable template
            ├── worked-example.md           # Real-world worked example
            ├── execution-guide.md          # Step-by-step guide
            ├── quality-checklist.md        # Pre-delivery verification
            └── materialized-references.md  # Condensed 3,000-token reference block
```

**SKILL.md v2 Format (Protocol v2):**

Skills now include structured frontmatter with execution context and quality rubrics:

```yaml
---
skill_name: Example Skill
skill_id: A1
status: World-Class
execution_context:
  format_version: 1.1.0
  token_estimate: 2200
  content_hash: sha256:...
  generation_status: full
quality:
  rubric_format: standardized
  dimension_count: 6
  weight_sum: 1.0
feeds_from: [A0]
feeds_into: [B1]
---
```

**Quality Tiers:**

| Tier            | Requirements                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **World-Class** | 400+ line SKILL.md, 5+ methodology phases, 5+ quality dimensions, 4 reference files, standardized rubric, execution context, multi-model consensus validation |
| **Standard**    | Complete SKILL.md with competencies, partial references                                                                                                       |
| **Skeleton**    | Stub SKILL.md, no references                                                                                                                                  |

---

## 6. MCP Server Ecosystem

MCP servers are configured at two levels:

- **Project-level** (`.mcp.json`, gitignored) — repo-specific servers
- **Global user-level** (`~/.claude.json` `mcpServers` section) — shared across all projects

Some servers appear at both levels. The project config takes precedence when both exist.

| Server                       | Config Level | Type            | Purpose                                       |
| ---------------------------- | ------------ | --------------- | --------------------------------------------- |
| **knowledge**                | Project      | Local (Node.js) | RAG search over agent reference materials     |
| **skill-resolver**           | Global       | Local (Node.js) | Skill dependency resolution and loading       |
| **conversation-memory**      | Global       | Local (Node.js) | Cross-session conversation search and context |
| **tarvacode-agent-selector** | Both         | npm package     | Semantic agent selection via embeddings       |
| **supabase**                 | Project      | Cloud           | Remote Supabase management                    |
| **supabase-local**           | Project      | Local           | Direct PostgreSQL access (port 54422)         |
| **memory**                   | Project      | npm             | Persistent context graph                      |
| **sequential-thinking**      | Project      | npm             | Structured reasoning chains                   |
| **github**                   | Project      | npm             | Repository management                         |
| **openai-second-opinion**    | Both         | npm             | Multi-model validation (GPT-5.2-pro + Gemini) |
| **research-consensus**       | Both         | npm             | Multi-model research consensus                |
| **playwright**               | Project      | npm             | Browser automation                            |
| **browsermcp**               | Project      | npm             | Browser interaction                           |
| **shadcn**                   | Project      | npm             | UI component registry                         |
| **patent-diagrams**          | Project      | npm             | Patent figure generation                      |
| **sequential-research**      | Project      | npm             | Research planning                             |
| **Figma Desktop**            | Project      | HTTP            | Design system integration                     |
| **osm-primary**              | Project      | Python (uvx)    | Geographic/mapping services                   |
| **geocoding**                | Project      | npm             | Location resolution                           |

---

## 7. Infrastructure Requirements

### Required Services

| Service                     | Port                                                    | Purpose                                         |
| --------------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| **Ollama**                  | `localhost:11434`                                       | Local LLM inference for agent generation + chat |
| **Local Supabase (agents)** | `localhost:54521` (API), `localhost:54422` (PostgreSQL) | Agent Builder + Knowledge MCP storage           |
| **Local Supabase (chat)**   | `localhost:54331` (API), `localhost:54332` (PostgreSQL) | Tarva Chat conversation storage (offset +10)    |
| **Embedding Server**        | `localhost:8100`                                        | BGE embedding generation                        |
| **Anthropic API**           | (cloud)                                                 | Claude inference for Chat + Project Room        |

### Application Ports

| App                     | Port             | Purpose                         |
| ----------------------- | ---------------- | ------------------------------- |
| **Tarva Agent Builder** | `localhost:3000` | Agent creation & management IDE |
| **Tarva Chat**          | `localhost:4000` | Multi-agent chat interface      |
| **Tarva Project Room**  | `localhost:3005` | Agent orchestration platform    |

### Startup Sequence

```bash
# 1. Start Supabase (for Agent Builder + Knowledge)
cd ~/projects/agent-data && supabase start

# 2. Start Embedding Server
cd ~/.claude/agents/mcps/knowledge-mcp/embedding-server
uvicorn server:app --port 8100

# 3. Start Ollama (if not already running)
ollama serve

# 4. Start Agent Builder
cd ~/Sites/tarva-claude-agents-frontend
pnpm dev

# 5. Start Tarva Chat (optional, needs its own Supabase)
cd ~/Sites/tarva-org/tarva-chat
pnpm dev

# 6. Start Project Room (optional, uses cloud Supabase)
cd ~/Sites/tarva-org/tarva-projects-app
pnpm dev
```

---

## 8. How Everything Connects

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              CREATION TIME                                        │
│                                                                                   │
│  ┌──────────────────────┐     subprocess      ┌──────────────────────────┐       │
│  │  Agent Builder        │◄═══════════════════►│  AgentGen CLI (Python)   │       │
│  │  localhost:3000       │   SSE + JSONL       │  Typer + Rich + Ollama   │       │
│  │  - Project wizard     │                     │  - PLAN→...→FINALIZE     │       │
│  │  - Generation UI      │                     │  - Atomic publish        │       │
│  │  - Quality gates      │                     │  - Resumable jobs        │       │
│  │  - Knowledge mgmt     │                     │  - Skill enrichment      │       │
│  └──────────┬────────────┘                     └────────────┬─────────────┘       │
│             │                                                │                     │
│             │ imports                                         │ inference           │
│             ▼                                                ▼                     │
│  ┌──────────────────────┐                     ┌──────────────────────────┐       │
│  │  @tarva/ui            │                     │  Ollama (Local LLM)      │       │
│  │  Git submodule        │                     │  qwen2.5:72b, etc.       │       │
│  │  - 60+ primitives     │                     └──────────────────────────┘       │
│  │  - Shared by all      │                                                        │
│  │    frontend apps      │                                                        │
│  └──────────────────────┘                                                         │
└───────────────────────────────────────────────────────────┬───────────────────────┘
                                                            │
                                                            │ writes to
                                                            ▼
                                              ┌───────────────────────────┐
                                              │  ~/.claude/agents/        │
                                              │  - 41 agent .md files     │
                                              │  - reference/ (skills)    │
                                              │  - projects/ (WIP)        │
                                              │  - builds/ (job state)    │
                                              └──────────┬────────────────┘
                                                         │
                          ┌──────────────────────────────┼──────────────────────────┐
                          │ reads from                   │ reads from               │ reads from
┌─────────────────────────▼──────────┐  ┌───────────────▼────────────┐  ┌──────────▼──────────────┐
│         RUNTIME (CLI)               │  │     RUNTIME (Chat)         │  │  RUNTIME (Project Room) │
│                                     │  │                            │  │                         │
│  ┌──────────────────────┐          │  │  ┌────────────────────┐   │  │  ┌───────────────────┐  │
│  │  Claude Code CLI     │          │  │  │ Tarva Chat         │   │  │  │ Tarva Project Room│  │
│  │  (user invokes       │          │  │  │ localhost:4000     │   │  │  │ localhost:3005    │  │
│  │   #agent-name)       │          │  │  │ - Agent picker     │   │  │  │ - Agent execution │  │
│  └──────────┬───────────┘          │  │  │ - SSE streaming    │   │  │  │ - Artifact track  │  │
│             │                      │  │  │ - MCP tool calls   │   │  │  │ - Truth governance│  │
│             ├──────────┬───────┐   │  │  │ - Skill matching   │   │  │  │ - Inngest jobs    │  │
│             ▼          ▼       ▼   │  │  └────────┬───────────┘   │  │  └────────┬──────────┘  │
│  ┌────────────┐ ┌────────┐ ┌────┐ │  │           │               │  │           │              │
│  │Knowledge   │ │Skill   │ │Agt │ │  │           ▼               │  │           ▼              │
│  │MCP         │ │Resolver│ │Sel.│ │  │  ┌────────────────────┐   │  │  ┌───────────────────┐  │
│  │(semantic   │ │MCP     │ │MCP │ │  │  │ Claude API +       │   │  │  │ Claude API +      │  │
│  │ search)    │ │        │ │    │ │  │  │ Ollama (hybrid)    │   │  │  │ Inngest + cloud   │  │
│  └─────┬──────┘ └────────┘ └──┬─┘ │  │  └────────────────────┘   │  │  │ Supabase          │  │
│        │                      │    │  │           │               │  │  └───────────────────┘  │
│        ▼                      ▼    │  │           ▼               │  │                         │
│  ┌────────────┐  ┌──────────────┐  │  │  ┌────────────────────┐   │  └─────────────────────────┘
│  │ Embedding  │  │ OpenAI API   │  │  │  │ Local Supabase     │   │
│  │ Server     │  │ (embeddings) │  │  │  │ (offset ports)     │   │
│  │ BGE 1024   │  └──────────────┘  │  │  │ Conversations +    │   │
│  └─────┬──────┘                    │  │  │ messages + keys     │   │
│        │                           │  │  └────────────────────┘   │
│        ▼                           │  │                            │
│  ┌─────────────────────────────┐   │  └────────────────────────────┘
│  │ Local Supabase (pgvector)   │   │
│  │ agents | documents | chunks │   │
│  │ embeddings | audit_log      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────────┐
│                          VERTICAL APPS & TOOLS                                    │
│                                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐   │
│  │ TarvaCORE (Electron) │  │ TarvaERP v2          │  │ tarvaCODE            │   │
│  │ - llama.cpp runtime  │  │ - Next.js 16         │  │ - MCP config repo    │   │
│  │ - MCP bridge         │  │ - 5 ERP modules      │  │ - Conversation mgmt  │   │
│  │ - Multi-stage        │  │ - AG Grid + Chart.js │  │ - Team knowledge     │   │
│  │   reasoning engine   │  │ - Mock data phase    │  │ - Planning stage     │   │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┘   │
│                                                                                   │
│  All consume @tarva/ui. TarvaERP uses same tech stack (Next.js 16, Tailwind v4,  │
│  shadcn/ui, TanStack Query, Zustand) as the platform apps.                        │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Tech Stack Summary

| Component            | Language       | Key Dependencies                                                            |
| -------------------- | -------------- | --------------------------------------------------------------------------- |
| **Agent Builder**    | TypeScript     | Next.js 16, React 19, Zustand 5, Tailwind v4, Zod 4                         |
| **Tarva Chat**       | TypeScript     | Next.js 16, React 19, Zustand 5, Anthropic SDK, Ollama, AES-256-GCM         |
| **Project Room**     | TypeScript     | Next.js 16, React 19, TanStack Query 5, Zustand 5, React Flow, Inngest 3.52 |
| **@tarva/ui**        | TypeScript     | Radix UI, CVA, @dnd-kit, AG Grid, tsup, Storybook 8                         |
| **AgentGen CLI**     | Python 3.11+   | Typer, Rich, Ollama SDK, OpenAI SDK, PyYAML                                 |
| **Knowledge MCP**    | TypeScript     | MCP SDK v1, Supabase JS, Pino, Zod                                          |
| **Skill Resolver**   | TypeScript     | MCP SDK v1, file-system skill loading                                       |
| **Agent Selector**   | TypeScript     | MCP SDK v1, Supabase JS, OpenAI                                             |
| **Embedding Server** | Python         | FastAPI, BAAI/bge-large-en-v1.5                                             |
| **Database**         | PostgreSQL 15  | pgvector, HNSW index, Supabase                                              |
| **TarvaCORE**        | TypeScript/C++ | Electron, React, llama.cpp, custom MCP bridge                               |
| **TarvaERP v2**      | TypeScript     | Next.js 16, React 19, AG Grid 34, Chart.js, TanStack Query 5, Playwright    |
| **tarvaCODE**        | TypeScript     | Vite + React (planning stage), MCP endpoints                                |

---

## 10. Key Design Decisions

| Decision                                          | Rationale                                                                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Local-first storage**                           | No cloud dependency, users can inspect/edit files directly, easy to zip/share                                    |
| **Subprocess for CLI**                            | Process isolation (crashes don't affect server), Python LLM ecosystem, independent versioning                    |
| **SSE for real-time**                             | Simpler than WebSockets for unidirectional streaming, native browser support, auto-reconnect                     |
| **JSONL event format**                            | Appendable, streamable, resumable, human-readable                                                                |
| **Human-in-the-loop gates**                       | Validate AI understood intent before expensive generation phases, quality control                                |
| **Atomic publishing**                             | Staging + swap prevents partial deployments, rollback via timestamped backups                                    |
| **BGE embeddings (1024-dim)**                     | Open-source, runs locally, strong retrieval performance, HNSW-indexable                                          |
| **MCP protocol**                                  | Standard interface for Claude Code tool integration, composable server ecosystem                                 |
| **Git submodule for UI**                          | Shared component library across future Tarva apps, independent versioning                                        |
| **Deterministic EC/Materializer**                 | No LLM needed for runtime context extraction — reproducible, fast, auditable                                     |
| **Cross-domain description rewriting**            | LLM rewrites descriptions to span all domains, improving agent routing and discovery                             |
| **Dual LLM providers**                            | Ollama for local/free inference, OpenAI fallback for reliability and fleet operations                            |
| **Protocol v2 SKILL.md**                          | Structured frontmatter enables automated quality gates, dependency resolution, and fleet compliance              |
| **Hybrid provider routing (Chat)**                | Model ID prefix (`claude-*` vs `ollama:*`) determines SDK — single UI supports both cloud and local LLMs         |
| **Supabase port offsets (Chat)**                  | Chat uses ports +10 from default to coexist with Agent Builder's Supabase on same machine                        |
| **TanStack Query + Zustand split (Project Room)** | Server state via TanStack Query, client-only state (workflow canvas) via Zustand — clear responsibility boundary |
| **Inngest for async jobs (Project Room)**         | Durable async execution with retries, priority queues, and failure recovery — avoids custom job infrastructure   |

---

## 11. Current Scale

| Metric                     | Value                                                                          |
| -------------------------- | ------------------------------------------------------------------------------ |
| Deployed Agents            | 41 (+ 5 zero-skill framework agents)                                           |
| Total Skills               | 2,034 across all agents (95.8% World-Class)                                    |
| Agents with Reference Dirs | 38 (with skills-index.yaml)                                                    |
| AgentGen CLI Tests         | 613 (pytest)                                                                   |
| Agent Builder Tests        | 360+ (Vitest)                                                                  |
| Tarva Chat Tests           | 742 (Vitest, 63 files)                                                         |
| Project Room Tests         | 334 test files (Vitest + Playwright)                                           |
| Knowledge MCP Tests        | 150 (Vitest)                                                                   |
| API Routes                 | 28 (Agent Builder) + 20+ (Chat) + 40+ (Project Room)                           |
| UI Components              | 128 (Agent Builder) + 113 (Project Room) + 60+ (@tarva/ui primitives)          |
| MCP Servers                | 19 configured (project + global), 17 in Chat (3 tiers)                         |
| Embedding Dimensions       | 1024 (BAAI/bge-large-en-v1.5)                                                  |
| Skills-Index Format        | v2.0.0 (with execution context, quality rubrics)                               |
| LLM Providers              | Ollama (local), OpenAI (cloud), Anthropic Claude (cloud)                       |
| DB Schemas                 | 6 tables (agents), 7 tables (Chat), 90+ tables across 8 schemas (Project Room) |
| Project Room Phases        | 2 complete (0, 1), 7 scaffolded (2-9)                                          |
| Repositories               | 10 (6 platform, 1 vertical app, 1 desktop, 1 config, 1 infra)                  |
| TarvaERP                   | 5 modules, 52 pages, 83 detail drawers (frontend complete, mock data)          |

---

## 12. Completed Milestones

| Milestone                                    | Date         | Description                                                                                                                                                                                                          |
| -------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent Skills Framework Connect**           | Feb 2026     | 8-phase project (27 SOWs, 160+ binding decisions) that made skill content reachable at runtime. Introduced Execution Context blocks, materialized references, skills-index v2.0.0, and 120-rule integrity validator. |
| **Protocol v2 Fleet Rollout**                | Feb 2026     | Mass backfill of EC frontmatter, materialized references, quality rubrics, and enriched indexes across all 41 deployed agents. Fleet reached 95.8% World-Class status.                                               |
| **Description Rewriter**                     | Feb 2026     | Post-assembly LLM rewriting of agent `description:` frontmatter with cross-domain coverage. Supports Ollama and OpenAI providers.                                                                                    |
| **Knowledge Management System (Phases 1-4)** | Jan-Feb 2026 | Document ingestion, pre-generation RAG, runtime RAG MCP server, and continuous learning with soft-delete, audit logs, and dashboard hooks. 150 tests.                                                                |
| **MCP Binding System**                       | Feb 2026     | Catalog-based MCP server discovery and binding. `mcps.binding.yaml` + `mcps.lock.yaml` per agent, with `agentgen mcp generate-bindings` / `inject` workflow.                                                         |
| **Fleet Management CLIs**                    | Feb 2026     | `fleet inventory`, `fleet migrate`, `fleet compliance` commands. Compliance gate added to publish pipeline.                                                                                                          |

## 13. Active Roadmap

| Initiative             | Location                            | Description                                                                                                                                                                                                             |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **agentgen-update-6**  | `plans/agentgen-update-6/`          | 10-phase plan for multi-agent orchestration runtime: safety & permissions, data model, long-run memory, model routing, observability, orchestrator MCP, human control plane, full project validation, deploy & maintain |
| **Agent Gap Analysis** | `plans/agents-to-update-and-build/` | Fleet audit identifying skill gaps, blank skills, zero-skill agents, and 6 missing agent roles (Output Evaluator, UX Writer, SRE, Data Engineer, Compliance/GRC, Accessibility)                                         |
| **TarvaERP Backend**   | `~/Sites/Tarva-ERP-2025/`           | Frontend complete; backend integration is the next phase                                                                                                                                                                |
| **tarvaCODE**          | `~/Sites/tarvaCODE/`                | Planning stage — project-scoped AI conversation management                                                                                                                                                              |
