# BrainCache

A personal content vault for saving, organizing, searching, and revisiting useful online content.

Save the things you don't want to lose.

---

## What is BrainCache?

BrainCache solves a common problem: people frequently discover useful articles, videos, tutorials, and tools across the web, but later struggle to find them again. Browser bookmarks quickly become cluttered, and copy-pasting links into notes lacks structured retrieval.

BrainCache provides a clean, personal vault where links are stored alongside automatic metadata (title, description, preview thumbnail, domain), structured categories, searchable tags, and private notes.

The core workflow: **Save → Organize → Search → Retrieve → Revisit**

---

## Features

- **Authentication & Security**: Secure registration and login using salted bcrypt password hashing and JWT sessions stored in HTTP-only, SameSite cookies.
- **Automated Metadata Extraction**: When a URL is saved, the server fetches Open Graph tags, page titles, and meta descriptions with a strict size and timeout boundary.
- **Duplicate URL Prevention**: Intelligent URL normalization (stripping tracking parameters like `utm_*` and `fbclid`, lowercasing hosts, trimming trailing slashes) prevents duplicate entries per user.
- **Categorization & Tagging**: Organize items by 18 predefined categories (Programming, AI & ML, Education, etc.) and custom hyphenated tags.
- **Full-Text Search & Filtering**: Fast text searching indexed across title, description, domain, and notes, combined with category and tag filters.
- **Sorting & Pagination**: Browse items sorted newest or oldest with server-side pagination.
- **"Surprise Me" Discovery**: Rediscover saved content with single-click random retrieval powered by MongoDB `$sample`.
- **Public Share Links**: Share specific items externally with revocable, cryptographically secure share tokens (SHA-256 hashed in database).
- **Abuse Prevention**: Rate-limited authentication and link-scraping endpoints, strict request size limits, and security headers via Helmet.

---

## Tech Stack

### Frontend
- **React 19**
- **TypeScript**
- **Vite**
- **React Router v7**
- **Vanilla CSS** (dark mode, responsive design)

### Backend
- **Node.js** & **Express**
- **TypeScript**
- **MongoDB** with **Mongoose**
- **Zod** (strict runtime request validation)
- **jsonwebtoken** & **bcryptjs** (authentication)
- **helmet**, **cookie-parser**, & **express-rate-limit** (security)

---

## Repository Structure

```
BrainCache/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components (e.g. ProtectedRoute)
│   │   ├── context/             # AuthContext session provider
│   │   ├── pages/               # DashboardPage, LoginPage, RegisterPage, SharePage
│   │   ├── services/            # API client layer (authApi, contentApi)
│   │   ├── types/               # TypeScript interfaces and shared constants
│   │   ├── App.tsx              # App routing and route guards
│   │   ├── main.tsx             # React entry point
│   │   └── index.css            # Base styles and animations
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── server/                      # Express backend
│   ├── src/
│   │   ├── config/              # Centralized environment configuration
│   │   ├── controllers/         # Request handling and HTTP responses
│   │   ├── db/                  # MongoDB connection management
│   │   ├── errors/              # AppError custom error class
│   │   ├── middleware/          # JWT auth, Zod validation, error handling
│   │   ├── models/              # Mongoose schemas (User, Content)
│   │   ├── repositories/        # Database query abstractions
│   │   ├── routes/              # Express route declarations (auth, content, share, health)
│   │   ├── services/            # Core business logic and external calls
│   │   ├── utils/               # Metadata scraping, URL normalization, share tokens
│   │   ├── validators/          # Zod validation schemas
│   │   ├── app.ts               # Express application factory
│   │   └── index.ts             # Server entry point
│   ├── tsconfig.json
│   └── package.json
├── docs/                        # Architecture decisions and API documentation
└── README.md
```

---

## Local Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local instance or MongoDB Atlas cluster URI)
- **npm**

### 1. Clone & Install Dependencies

```bash
# Install root dev dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..
```

### 2. Configure Environment Variables

Create `.env` inside the `server/` directory:

```bash
cp server/.env.example server/.env
```

Set the following variables in `server/.env`:

```env
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/braincache
JWT_SECRET=your-secure-random-secret-key-at-least-32-chars
```

### 3. Run the Application

You can run both client and server concurrently from the root directory:

```bash
npm run dev
```

Or run them individually in separate terminals:

```bash
# Terminal 1: Backend (http://localhost:3001)
npm run dev:server

# Terminal 2: Frontend (http://localhost:5173)
npm run dev:client
```

Open `http://localhost:5173` in your browser.

---

## API Overview

### Health
- `GET /api/health` — Service health check

### Authentication
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Login and receive HTTP-only session cookie
- `POST /api/auth/logout` — Clear session cookie
- `GET /api/auth/me` — Retrieve current authenticated user profile

### Content
- `GET /api/content` — List saved items with search, filter, sort, and pagination
- `GET /api/content/random` — Retrieve a random item ("Surprise Me")
- `GET /api/content/:id` — Get single item details
- `POST /api/content` — Save a new URL (with automatic metadata scraping)
- `PATCH /api/content/:id` — Update category, tags, title, description, or notes
- `DELETE /api/content/:id` — Delete a saved item
- `POST /api/content/:id/share` — Enable public sharing for an item
- `DELETE /api/content/:id/share` — Disable public sharing

### Public Share
- `GET /api/share/:token` — View shared item publicly (no authentication required)

---

## License

MIT