# BrainCache — System Architecture

## 1. Architecture Overview

BrainCache uses a conventional full-stack web architecture consisting of:

* React frontend
* Node.js/Express backend
* MongoDB database

The frontend communicates with the backend through a REST API.

The backend is responsible for authentication, authorization, validation, business logic, database access, and security.

```text
┌─────────────────────────────┐
│         React Client        │
│                             │
│ TypeScript + TailwindCSS    │
└──────────────┬──────────────┘
               │
               │ HTTP / REST
               ▼
┌─────────────────────────────┐
│      Node.js / Express      │
│                             │
│ Routes                      │
│ Middleware                  │
│ Controllers                 │
│ Services                    │
│ Repositories                │
│ Validators                  │
└──────────────┬──────────────┘
               │
               │ Mongoose
               ▼
┌─────────────────────────────┐
│          MongoDB            │
│                             │
│ users                       │
│ contents                    │
└─────────────────────────────┘
```

---

## 2. Architectural Goals

The architecture prioritizes:

1. Simplicity
2. Maintainability
3. Clear separation of responsibilities
4. Server-side security
5. Efficient content retrieval
6. Straightforward local development
7. Ability to extend the application later without redesigning the entire system

The system intentionally avoids unnecessary infrastructure.

---

## 3. Frontend Architecture

The frontend is responsible for:

* Rendering the user interface
* Managing UI state
* Collecting user input
* Client-side validation where appropriate
* Calling backend APIs
* Displaying loading/error/empty states
* Maintaining authentication-related UI state
* Debouncing search input
* Routing

The frontend is **not** responsible for enforcing authorization.

---

## 4. Frontend Modules

Recommended structure:

```text
client/src/
│
├── components/
├── pages/
├── layouts/
├── hooks/
├── services/
├── context/
├── types/
├── utils/
├── lib/
├── App.tsx
└── main.tsx
```

### components/

Reusable UI components.

Examples:

* Button
* Input
* Modal
* ContentCard
* SearchBar
* CategoryFilter
* TagFilter
* Pagination
* LoadingState
* EmptyState
* ErrorState

### pages/

Application-level screens.

Examples:

* Login
* Register
* Dashboard
* Content Details
* Shared Content

### layouts/

Shared page structures.

### hooks/

Reusable React hooks.

Examples:

* Authentication hook
* Debounced search hook
* Content-related hooks

### services/

Frontend API communication.

### context/

Global state that genuinely needs application-wide access, such as authentication state.

### types/

Shared frontend TypeScript types.

### utils/

Small frontend utility functions.

### lib/

Configured third-party/client libraries.

---

# 5. Backend Architecture

The backend follows:

```text
Route
  ↓
Middleware
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
MongoDB
```

---

## 6. Routes

Routes define API endpoints and connect them to controllers.

Routes should not contain business logic.

Example:

```text
POST /api/auth/login
```

connects to the authentication controller.

---

## 7. Middleware

Middleware handles cross-cutting HTTP concerns.

Examples:

* Authentication
* Rate limiting
* Request validation
* Error handling
* Security headers

---

## 8. Controllers

Controllers handle HTTP-specific responsibilities:

* Read request information
* Call the appropriate service
* Construct the HTTP response
* Map known errors to HTTP status codes

Controllers should remain relatively thin.

Business rules should not be implemented directly inside controllers.

---

## 9. Services

Services contain business logic.

Examples:

### Authentication service

* Register user
* Verify credentials
* Create authentication token

### Content service

* Create content
* Normalize URL
* Detect duplicate
* Update content
* Delete content
* Retrieve content
* Generate random content
* Manage sharing

---

## 10. Repositories

Repositories contain database access logic.

Examples:

```text
UserRepository
ContentRepository
```

Repositories should not contain HTTP-specific logic.

---

## 11. Validators

Zod schemas define and validate external input.

Validation occurs before business logic operates on request data.

---

## 12. Configuration

Application configuration shall be centralized.

Environment variables shall be validated when the application starts.

Expected configuration includes:

```text
PORT
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
CLIENT_URL
NODE_ENV
```

The exact variable names may be finalized during implementation.

---

# 13. Authentication Flow

```text
Client
  │
  │ POST /api/auth/login
  ▼
Auth Route
  │
  ▼
Zod Validation
  │
  ▼
Auth Controller
  │
  ▼
Auth Service
  │
  ├── Find User
  └── Verify Password
  │
  ▼
Generate JWT
  │
  ▼
HTTP-only Cookie
  │
  ▼
Client
```

For protected requests:

```text
Client
  │
  │ Cookie automatically included
  ▼
Auth Middleware
  │
  ├── Verify JWT
  └── Identify User
  │
  ▼
Controller
```

---

# 14. Content Creation Flow

```text
Client
  │
  │ URL + category + tags + note
  ▼
POST /api/content
  │
  ▼
Authentication
  │
  ▼
Zod Validation
  │
  ▼
Content Controller
  │
  ▼
Content Service
  │
  ├── Normalize URL
  ├── Check duplicate
  ├── Retrieve metadata if appropriate
  └── Create content
  │
  ▼
Content Repository
  │
  ▼
MongoDB
```

The database unique index provides final duplicate protection even if two requests pass the application-level duplicate check concurrently.

---

# 15. Content Retrieval Flow

```text
Dashboard
   │
   │ search/filter/page
   ▼
GET /api/content
   │
   ▼
Authentication
   │
   ▼
Validate Query
   │
   ▼
Controller
   │
   ▼
Content Service
   │
   ▼
Content Repository
   │
   ▼
MongoDB
   │
   ├── User filter
   ├── Search
   ├── Category
   ├── Tags
   ├── Sort
   └── Pagination
   │
   ▼
Response
```

---

# 16. Authorization Model

Authentication establishes the current user.

Authorization determines whether the current user may access a specific resource.

For private content:

```text
content.userId === authenticatedUser.id
```

must be verified server-side.

The client must never be trusted to determine ownership.

---

# 17. Public Sharing Flow

```text
Owner
  │
  │ Enable sharing
  ▼
Backend generates share token
  │
  ▼
Content marked shared
  │
  ▼
/share/:token
  │
  ▼
Public endpoint
  │
  ▼
Verify token + shared status
  │
  ▼
Return safe public representation
```

The public endpoint must not require the owner's authentication.

However, only content explicitly marked as shared can be returned.

---

# 18. Error Handling

The backend shall use centralized error handling.

Known application errors should map to appropriate HTTP responses.

Example:

```text
ValidationError → 400
AuthenticationError → 401
AuthorizationError → 403
NotFoundError → 404
DuplicateError → 409
RateLimitError → 429
UnknownError → 500
```

Internal stack traces and implementation details must not be returned to clients in production.

---

# 19. Security Boundaries

The backend is the security boundary.

The following must never be trusted from the client:

* User ID
* Ownership
* Authentication state
* Authorization decisions
* Database identifiers
* Sharing permissions

The server determines these values.

---

# 20. Intentional Architectural Simplicity

The following are intentionally not part of the architecture:

```text
Redis
Kafka
Microservices
GraphQL
Vector database
Elasticsearch
Message queues
Dedicated metadata service
Separate authentication service
```

The application does not currently require them.

---
