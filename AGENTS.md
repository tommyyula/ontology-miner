# AGENTS.md — Ontology Miner (本体知识挖掘工具)

## Project Overview
基于本体论的知识挖掘系统，通过 LLM 驱动的交互式对话，从领域专家中系统化挖掘、结构化和建模知识。Agent Factory 的基础设施之一。

## Quick Map
- **Specs & PRD**: `.kiro/specs/ontology-miner/` — requirements, design, domain analysis, tasks
- **Source Code**: `src/`
- **Architecture**: See `.kiro/specs/ontology-miner/design.md` §1
- **LLM Prompts**: See `.kiro/specs/ontology-miner/design.md` §6

## Tech Stack
- React 18 + TypeScript + Vite
- Ant Design (UI components)
- React Flow (ontology graph visualization)
- Zustand (state management)
- Dexie.js (IndexedDB persistence)
- OpenAI/Anthropic API (LLM Provider)

## Architecture Rules
1. **Layered**: domain → providers → services → stores → UI (one-way deps)
2. **Provider pattern**: ILLMProvider for LLM, IStorageProvider for persistence, IExportProvider for export
3. **Mock-first**: V1 includes mock LLM provider for testing without API key
4. **Snapshot tree**: Version management via branching snapshots, never delete data

## Coding Conventions
- TypeScript strict mode, no any
- Path aliases: @domain, @providers, @services, @stores, @components, @shared
- Chinese UI labels, English code/comments
- Component files < 300 lines

## Deployment
- GitHub Pages via gh-pages branch
- Base path: `/ontology-miner/`
