# LabRecon — Research Intelligence for Undergraduates

## Project Overview
LabRecon is a Next.js web app that helps undergrads discover research labs and write personalized cold emails to professors. It aggregates public academic data (publications, grants, faculty info) into searchable lab profiles with AI-generated outreach drafts. Initial scope: UT Austin.

## Tech Stack
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS + shadcn/ui for all UI components
- Anthropic SDK for AI outreach generation
- SQLite via Drizzle ORM for local data (MVP)
- Semantic Scholar API for publication data

## Architecture
- `/src/app` — App Router pages and layouts
- `/src/app/api` — API route handlers
- `/src/components` — React components
- `/src/components/ui` — shadcn/ui primitives
- `/src/lib` — utilities, API clients, db config
- `/src/lib/db` — Drizzle schema and queries
- `/src/types` — TypeScript type definitions

## Commands
- `npm run dev` — start d3000
- `npm run build` — production build
- `npm run lint` — run ESLint

## Design Direction
- ALWAYS use the frontend-design and ui-ux-pro-max skills when building UI
- Aesthetic: dark, editorial, dense — think Linear meets Notion meets Bloomberg Terminal
- NOT the generic AI look — no purple gradients, no Inter font, no rounded white cards on gray bg
- Use a distinctive display font (e.g., Instrument Serif or Playfair Display) for headings paired with a clean sans (e.g., Geist or Satoshi) for body
- Color: zinc-950 base, slate-900 cards, blue-500 primary accent, emerald for success states, amber for warnings
- Generous negative space, subtle borders, low-contrast separators
- Micro-interactions: subtle hover scales, fade-ins on route transitions, skeleton loaders
- Information density matters — this is a research tool, not a marketing site

## Code Style
- Use named exports, never default exports (except page.tsx/layout.tsx)
- Keep components small — one component per file
- Server components "use client" only when needed
- Tailwind for all styling, no CSS modules
- Short variable names, terse code, minimal comments
- No placeholder data — use realistic UT Austin labs and professors
- Use compound component patterns for complex UI (per composition-patterns skill)

## Important Notes
- NEVER use placeholder lorem ipsum — always realistic academic data
- AI outreach calls the Anthropic API via server-side API route
- Search should feel semantic — keyword matching with relevance scoring for MVP
- Keep MVP focused: search, profiles, email generation, tracker
