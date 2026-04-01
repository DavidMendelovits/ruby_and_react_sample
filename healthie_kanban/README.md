# Kanban Board

A drag-and-drop kanban board built with React, TypeScript, and Vite. Tasks can be assigned to characters fetched from the Rick and Morty GraphQL API, moved across columns with smooth drag-and-drop, and celebrated with confetti when completed.

## Features

- **Drag & Drop** — Reorder tasks within columns or move them across To Do / Doing / Done (powered by `@dnd-kit`)
- **Character Assignment** — Search and assign Rick and Morty characters via GraphQL with lazy-loaded infinite scroll
- **Confetti** — Fires when a task lands in Done for the first time
- **Persistence** — Board state saves to `localStorage` via a pluggable `StorageAdapter` interface
- **Dark Theme** — Linear-inspired UI with purple accents

## Prerequisites

- **Node.js** (LTS recommended)

## Getting Started

```bash
npm install
npm run dev
```

The dev server starts at **http://localhost:5173**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |
| `npm run test:e2e:ui` | Open Playwright UI mode |

## Testing

**Unit tests** use Vitest and cover the kanban reducer logic (add, move, reorder tasks):

```bash
npm test
```

**E2E tests** use Playwright with a mocked GraphQL layer to test the full workflow — board rendering, task creation with character search, and drag-and-drop:

```bash
npx playwright install    # first time only
npm run test:e2e
```

Playwright auto-starts the dev server, so no need to run it separately.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 19, TypeScript 5.9 |
| Build | Vite 8 |
| Drag & Drop | @dnd-kit |
| Styling | CSS Modules |
| Unit Tests | Vitest |
| E2E Tests | Playwright |
