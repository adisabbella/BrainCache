# BrainCache

A personal content vault for saving, organizing, searching, and revisiting useful online content.

Save the things you don't want to lose.

---

## What is BrainCache?

BrainCache solves a simple problem: people frequently discover useful articles, videos, tutorials,
and other online content, but later struggle to find them again.

BrainCache provides a centralized personal space for storing links with metadata such as categories,
tags, and personal notes, making content easy to find again later.

The core workflow is: **Save - Organize - Search - Retrieve - Revisit**

---

## Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS v4
- React Router v7

### Backend
- Node.js
- Express 4
- TypeScript

### Planned (future milestones)
- MongoDB + Mongoose (database)
- Zod (validation)
- JWT + HTTP-only cookies (authentication)

---

## Current Status

**Milestone 1 - Project Foundation** (complete)

The project foundation is in place:
- React frontend starts and runs successfully
- Express backend starts and runs successfully
- Health endpoint (`GET /api/health`) is implemented and tested
- Frontend communicates with backend via Vite dev proxy
- TypeScript compiles cleanly on both sides
- Clean, extensible folder structure ready for future milestones

---

## Local Setup

### Prerequisites
- Node.js 18 or later
- npm

### Install dependencies

```bash
# Install root dev dependencies
npm install

# Install frontend dependencies
npm install --prefix client

# Install backend dependencies
npm install --prefix server
```

### Environment configuration

Copy the example environment files:

```bash
# Backend
copy server\.env.example server\.env
```

The default values in `.env.example` work for local development.

---

## Running the Application

### Start both frontend and backend together

```bash
npm run dev
```

### Or start individually

```bash
# Frontend only (http://localhost:5173)
npm run dev:client

# Backend only (http://localhost:3001)
npm run dev:server
```

---

## Health Endpoint

```
GET http://localhost:3001/api/health
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

The Vite dev proxy also exposes this at:
```
GET http://localhost:5173/api/health
```

---

## Repository Structure

```
braincache/
|-- client/              React frontend (Vite + TypeScript + TailwindCSS)
|   |-- src/
|   |   |-- components/  Reusable UI components (future milestones)
|   |   |-- pages/       Application screens (future milestones)
|   |   |-- layouts/     Shared page structures (future milestones)
|   |   |-- hooks/       Reusable React hooks (future milestones)
|   |   |-- services/    Frontend API communication
|   |   |-- context/     Global state (future milestones)
|   |   |-- types/       TypeScript types (future milestones)
|   |   |-- utils/       Utility functions (future milestones)
|   |   |-- lib/         Third-party library configs (future milestones)
|   |   |-- App.tsx      Root application component
|   |   `-- main.tsx     Application entry point
|-- server/              Express backend (Node.js + TypeScript)
|   |-- src/
|   |   |-- config/      Centralized configuration
|   |   |-- middleware/  Express middleware
|   |   |-- routes/      API route definitions
|   |   |-- app.ts       Express app factory
|   |   `-- index.ts     Server entry point
|-- docs/                Project documentation (source of truth)
|-- .editorconfig        Editor configuration
|-- .gitignore           Git ignore rules
|-- .prettierrc          Prettier formatting configuration
|-- package.json         Root scripts
`-- README.md            This file
```

---

## Planned Milestones

| Milestone | Feature Group |
|-----------|---------------|
| M1 (done) | Project Foundation |
| M2 | Authentication (register, login, logout, JWT, cookies) |
| M3 | Content Management (save, view, edit, delete URLs) |
| M4 | Search, Filtering, Pagination, Random Retrieval |
| M5 | Sharing and Metadata Extraction |
| M6 | Security Hardening |
| M7 | Final UI, Testing, and Cleanup |

---

## Documentation

All project requirements, architecture decisions, and design specifications are in the `docs/` folder.

The documentation is the source of truth for this project.