# EmergeX Code — The Infinite Gentleman

> **The kernel of the EmergeX ecosystem.**
> Open source autonomous coding agent powered by local LLMs or free cloud models.
> No API keys. No usage caps. No cloud dependency.

[![License](https://img.shields.io/badge/license-Apache%202.0-orange.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.2.0-green.svg)](package.json)
[![Daemon](https://img.shields.io/badge/daemon-Fly.io%20Amsterdam-blue.svg)](https://emergex-vessel.fly.dev)

---

## Why EmergeX exists

Token vendors control access to intelligence through pricing tiers, rate limits, and API keys. That is a business model, not a law of nature. It is also not the only option.

**EmergeX runs locally, privately, and for free.** No credit card. No usage cap. No cloud dependency required.

Every policy that governs what the agent can do is a YAML file you can read, edit, and override. Every memory the agent stores is a SQLite database on your own disk. Nothing phones home.

**Self-improvement:** The autoresearch loop runs benchmarks, mutates the system prompt, and promotes what works. This runs locally. Your agent runs locally. Your data never leaves your machine. No central vendor captures that value.

The floor is zero cost. The ceiling is what a self-improving local agent can learn from your codebase.

---

## Quick Start

### Global Installation
```bash
npm install -g @emergex/emergex-code
emergex
```
That's it. Ollama runs locally by default — if you don't have it, EmergeX will guide you through setup on first launch.

### From Source (Contributors)
```bash
# 1. Clone and install
git clone https://github.com/8gi-foundation/emergex-code.git
cd emergex-code
bun install

# 2. Verify CLI works
bun run cli -- --version

# 3. Launch TUI
bun run tui
```

---

## The 8 Powers

EmergeX is powered by eight core pillars that enable autonomous operation without persistent cloud overhead.

### 🧠 Memory
`packages/memory/`
Dual-layer episodic + semantic memory using SQLite + FTS5. Features procedural memory, health monitoring, contradiction detection, and lease-based job queues.

### 🌿 Worktree
`packages/orchestration/`
Multi-agent parallel execution via git worktrees. Allows up to 4 concurrent agents working on separate branches with a dedicated filesystem messaging layer.

### ⚖️ Policy
`packages/permissions/`
The **NemoClaw** YAML policy engine. Deny-by-default architecture with 11 default rules and approval gates for secrets, destructive ops, and network access.

### 🧬 Evolution
`packages/self-autonomy/`
Post-session reflection and Bayesian skill confidence. Includes **HyperAgent** meta-mutation, allowing the system to improve its own prompts based on performance.

### 🩹 Healing
`packages/validation/`
Advanced checkpoint-verify-revert loop. Uses git-stash atomic snapshots to ensure that if a fix fails verification, the codebase is instantly restored.

### 💼 Entrepreneurship
`packages/proactive/`
Proactive agents that scan GitHub for bounties and help-wanted issues, matching capabilities to opportunities automatically.

### 🔍 AST
`packages/ast-index/`
Blast radius engine using AST-first navigation. Maps import dependency graphs to estimate the impact of changes across the entire codebase.

### 🌐 Browser
`packages/tools/browser/`
Lightweight web access via DuckDuckGo HTML scraping. Zero-dependency browser access for research and documentation lookups.

---

## Companion System

Every coding session spawns a unique companion. Your development history becomes a collectible deck.

- **40 Species** across 5 rarity tiers (Common 60% to Legendary 1%).
- **10 Elements** (Void, Ember, Aether, Verdant, Radiant, Chrome, Prism, Frost, Thunder, Shadow).
- **stats per companion** (DEBUG, CHAOS, WISDOM, PATIENCE, SNARK, ARCANA).
- **macOS Dock Pet** spawns with your companion's specific colors and personality.

```bash
emergex pet start      # Spawn companion on dock
emergex pet deck       # View your collection
```

---

## Feature Suite

- **Voice Chat**: `/voice chat` starts a local STT/TTS loop using `whisper.cpp`.
- **Ghost Suggestions**: Context-aware command prediction that learns from your history.
- **Task Router**: Automatically selects the best model for the job (reasoning vs. coding).
- **Telegram Portal**: Control your agent and receive status updates via `@emergexcodebot`.

---

## Road Map

| Phase | Focus | Status |
|---|---|---|
| **Now** | Memory v1 enhancements & Daemon reliability | ✅ Active |
| **Next** | HyperAgent meta-improvement loop | 🛠️ In Dev |
| **Later** | Desktop client (Tauri 2.0) & Multi-tenant control plane | 📅 Planned |

---

## Benchmarks

Professional-grade execution tests. All local inference via Ollama.

| ID | Domain | Task | Score |
|---|---|---|---|
| **BT001** | Software Engineering | SaaS Auth & Rate Limiting | 94 |
| **BT003** | Data Engineering | Stream Processing Pipeline | 100 |
| **BT011** | Video Production | FFmpeg Timeline Logic | 100 |

---

## Project Structure

- `apps/tui/`: Ink v6 terminal interface.
- `apps/docs/`: Nextra documentation site.
- `packages/emergex/`: Core agent logic.
- `packages/ai/`: Provider abstractions.
- `packages/kernel/`: IL fine-tuning pipeline.

---

**Your OS. Your rules. Your AI.**

**Apache 2.0 License**
Created and Maintained by **Adebayo Stephen Oluwadamilola**
[GitHub](https://github.com/adebayodamilola20) · [EmergeX World](https://emergex.world)
