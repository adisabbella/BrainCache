# Technical Decisions

## 1. Purpose

This document records important technical decisions made for BrainCache and the reasoning behind them.

The goal is not to document every line of code.

The goal is to answer:

> "Why was the project designed this way?"

This makes the project easier to maintain and easier to explain during interviews.

---

# 2. Monolithic Full-Stack Architecture

## Decision

BrainCache will use a single repository containing a React frontend and Node/Express backend.

```text
BrainCache
│
├── client/
├── server/
└── docs/
```

## Reason

The project is small enough that microservices would introduce unnecessary complexity.

A single backend is easier to:

* Develop
* Debug
* Run locally
* Deploy
* Understand

---

# 3. REST API

## Decision

The frontend communicates with the backend through REST-style HTTP APIs.

## Reason

REST is sufficient for the application's requirements.

BrainCache does not require:

* GraphQL
* WebSockets
* Real-time synchronization

The API is resource-oriented around:

```text
auth
content
sharing
```

---

# 4. MongoDB

## Decision

MongoDB is the primary database.

## Reason

The content model contains naturally flexible fields such as:

```text
tags
metadata
optional description
thumbnail
sharing information
```

MongoDB's document model fits this structure well.

The application also benefits from MongoDB indexes and straightforward document retrieval.

---

# 5. Mongoose

## Decision

Mongoose will be used as the MongoDB object modeling layer.

## Reason

Mongoose provides:

* Schema definitions
* Model abstractions
* Index configuration
* Database-level validation support
* Consistent database access patterns

Zod will still be used for API boundary validation.

These serve different purposes.

```text
Zod
↓
Validate external request data

Mongoose
↓
Model and interact with database documents
```

---

# 6. Zod

## Decision

Zod will be used for server-side request validation.

## Reason

The application receives untrusted data through:

* Request bodies
* Query parameters
* Route parameters
* Environment configuration

Zod provides a single explicit validation approach.

The client may also use validation, but backend validation remains authoritative.

---

# 7. JWT + HTTP-Only Cookies

## Decision

Authentication uses JWTs stored in HTTP-only cookies.

## Reason

This avoids exposing the JWT directly to application JavaScript and avoids storing authentication tokens in localStorage.

The approach is simple enough for the project while still demonstrating important authentication concepts.

A full session database and refresh-token architecture is intentionally avoided.

---

# 8. Password Hashing

## Decision

Passwords are hashed using bcrypt.

## Reason

Plaintext password storage is unacceptable.

Bcrypt is a well-established password hashing approach and is straightforward to integrate into a Node.js backend.

---

# 9. Controller → Service → Repository

## Decision

Backend responsibilities are separated into:

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

## Reason

This prevents business logic from being scattered throughout route handlers.

### Routes

Define API endpoints.

### Middleware

Handle cross-cutting concerns such as authentication and validation.

### Controllers

Handle HTTP-specific responsibilities.

### Services

Contain business rules.

### Repositories

Contain database access.

This separation also makes individual parts easier to test and reason about.

---

# 10. No Generic "Utils Everything" Architecture

## Decision

Utility functions should only exist when they represent a genuinely reusable operation.

## Reason

Over-abstraction makes a small project harder to understand.

Examples of reasonable utilities:

```text
URL normalization
Tag normalization
JWT/cookie helpers
API response helpers
```

A function should not be moved into a generic utility file merely to make the project appear more sophisticated.

---

# 11. Page/Limit Pagination

## Decision

The first version uses page/limit pagination.

Example:

```text
?page=2&limit=20
```

## Reason

It is simple, familiar and sufficient for the expected scale.

Cursor pagination is useful for very large or highly dynamic datasets but introduces additional implementation and API complexity.

It can be introduced later if necessary.

---

# 12. MongoDB Native Search

## Decision

The first version uses MongoDB-supported search/indexing.

## Reason

The project needs useful text search but does not need a dedicated search platform.

Avoiding Elasticsearch/OpenSearch keeps the architecture lightweight.

Semantic/vector search is intentionally out of scope.

---

# 13. Debounced Search

## Decision

Frontend search requests are debounced.

## Reason

Without debouncing, typing a query could generate many API requests.

A short delay, approximately 300 ms, provides a good balance between responsiveness and unnecessary network traffic.

---

# 14. URL Normalization

## Decision

Both the original URL and normalized URL are stored.

## Reason

The original URL is useful to preserve the user's intended link.

The normalized URL provides a stable representation for duplicate detection.

This allows:

```text
Original URL
```

and:

```text
Duplicate comparison URL
```

to serve different purposes.

---

# 15. Database-Enforced Duplicate Protection

## Decision

Duplicate URLs are protected by a unique compound index:

```text
(userId, normalizedUrl)
```

## Reason

Application-level duplicate checks alone are not enough.

Two simultaneous requests could both pass:

```text
Does this URL already exist?
→ No
```

before either request inserts the document.

The database constraint protects against this race condition.

---

# 16. Category + Tags

## Decision

Each content item has:

```text
One category
Many tags
```

## Reason

A category provides broad organization.

Example:

```text
Category: Programming
```

Tags provide more specific organization:

```text
react
typescript
frontend
```

A separate category collection is unnecessary because the category list is controlled by the application.

---

# 17. Random Retrieval

## Decision

Random retrieval is performed within the user's own content set.

MongoDB random sampling can be used.

## Reason

It provides a straightforward implementation of the "Surprise Me" feature.

The important requirement is that random selection must happen after user scoping.

The application must never randomly select from another user's private content.

---

# 18. Public Sharing

## Decision

Sharing is opt-in and controlled by a dedicated random token.

## Reason

Private content should never become public accidentally.

The public URL should not depend on the MongoDB document ID.

Sharing can be disabled at any time.

---

# 19. Share Token Storage

## Decision

Where practical, the raw share token should not be stored directly.

Instead:

```text
Random token
      ↓
Hash
      ↓
Stored in database
```

The public URL contains the original token.

When a request arrives:

```text
URL token
    ↓
Hash
    ↓
Find matching token hash
    ↓
Verify sharing is enabled
```

## Reason

If the database is exposed, storing only a token hash provides an additional layer of protection.

The token behaves similarly to a credential, so it should be treated as sensitive.

---

# 20. Frontend Share URL vs Backend API

## Decision

The public user-facing URL and backend API endpoint are separate.

For example:

```text
Public browser URL:
/share/<token>
```

Backend API:

```text
/api/share/<token>
```

The frontend public share page calls the backend API to retrieve the safe public representation.

## Reason

The browser should navigate to a frontend route rather than directly exposing backend API structure as the user-facing application URL.

---

# 21. Route Ordering

## Decision

Specific routes must be registered before dynamic ID routes.

For example:

```text
GET /api/content/random
GET /api/content/:id
```

The `random` route must be registered before `:id`.

## Reason

Otherwise Express may interpret:

```text
random
```

as a content ID.

This is a small implementation detail but an important source of routing bugs.

---

# 22. Metadata Extraction

## Decision

Metadata extraction is optional enrichment rather than a core requirement.

## Reason

Saving a URL should remain reliable even when metadata extraction fails.

Therefore:

```text
Save URL
   ↓
Metadata retrieval
   ↓
Success → store metadata
Failure → continue saving
```

Metadata should never make the core save operation unusable.

Security restrictions must be applied if the server performs external URL fetching.

---

# 23. No Redis

## Decision

Redis is not part of the initial architecture.

## Reason

BrainCache does not initially require:

* Distributed caching
* Background job queues
* Session storage
* Real-time coordination

Adding Redis would increase operational complexity without providing a necessary benefit.

---

# 24. No Dedicated Search Engine

## Decision

No Elasticsearch/OpenSearch deployment.

## Reason

The expected dataset is small enough that MongoDB search/indexing is sufficient.

The architecture should only become more complex when real requirements justify it.

---

# 25. No Vector Database

## Decision

No embeddings or vector database in version one.

## Reason

The project does not need semantic search to satisfy its primary purpose.

Semantic search would introduce:

* Embedding generation
* Vector storage
* Similarity search
* Additional infrastructure
* More complicated failure modes

The current goal is a reliable personal content vault, not an AI search engine.

---

# 26. No Optimistic UI

## Decision

The application will use straightforward request/response UI updates rather than optimistic updates.

## Reason

Optimistic UI adds synchronization and rollback complexity.

For this application's scale, predictable behavior is more valuable than shaving a small amount of perceived latency.

---

# 27. No Structured Logging Requirement

## Decision

Structured logging is not part of the initial project scope.

## Reason

The project should demonstrate meaningful engineering practices without adding infrastructure that does not contribute directly to the application's requirements.

Normal development logging and centralized error handling are sufficient for the initial version.

---

# 28. Centralized Configuration

## Decision

Application configuration is centralized and environment-driven.

## Reason

This avoids scattering configuration values throughout the codebase.

Examples:

```text
Database URL
JWT secret
JWT expiry
Server port
Client URL
Environment
```

Configuration should be loaded once and validated during application startup.

---

# 29. Centralized API Error Handling

## Decision

The backend uses centralized error handling.

## Reason

Without centralized handling, different endpoints may return inconsistent responses.

The API should consistently follow:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message."
  }
}
```

This also makes frontend error handling simpler.

---

# 30. Why the Architecture Is Intentionally Simple

BrainCache is intended to demonstrate strong engineering fundamentals rather than infrastructure complexity.

The project demonstrates:

* Authentication
* Authorization
* Validation
* Secure cookies
* Password hashing
* REST APIs
* Layered backend architecture
* MongoDB modeling
* Database indexing
* URL normalization
* Duplicate prevention
* Search
* Filtering
* Pagination
* Rate limiting
* Public sharing
* Responsive UI
* Error handling

These provide substantially more useful interview discussion than adding unnecessary distributed-system components.

---

# 31. Final Architectural Principle

The central rule for BrainCache is:

> **Use the simplest architecture that correctly solves the problem, while making important engineering decisions explicit and explainable.**

Complexity should be introduced only when a real requirement demands it.
