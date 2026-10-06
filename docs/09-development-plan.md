# Development Plan

## 1. Purpose

BrainCache will be developed incrementally.

Each milestone should leave the application in a stable state.

A milestone should:

* Implement a coherent feature group
* Keep the application runnable
* Avoid introducing unfinished dependencies on future milestones
* Include basic verification
* Avoid unnecessary scope expansion

The project will use the following development sequence.

---

# Milestone 1 — Project Foundation

## Goal

Create the basic full-stack application structure.

## Work

### Repository

Create:

```text
braincache/
├── client/
├── server/
├── docs/
├── .gitignore
├── .editorconfig
├── .prettierrc
├── README.md
└── package.json
```

### Frontend

Set up:

* React
* TypeScript
* Vite
* TailwindCSS
* React Router

Create the basic application shell.

### Backend

Set up:

* Node.js
* Express
* TypeScript

Create:

```text
GET /health
```

### Configuration

Establish environment configuration and development scripts.

## Verification

* Frontend starts successfully.
* Backend starts successfully.
* Health endpoint responds.
* Frontend can communicate with backend.

---

# Milestone 2 — Authentication

## Goal

Implement complete user authentication.

## Work

Implement:

* User model
* Registration
* Login
* Logout
* JWT creation
* HTTP-only authentication cookie
* Password hashing
* Authentication middleware
* `/api/auth/me`
* Zod validation
* Authentication-related error handling
* Basic rate limiting for login and registration

## Verification

Test:

* Successful registration
* Duplicate email
* Duplicate username
* Invalid registration data
* Successful login
* Incorrect password
* Logout
* Protected endpoint without authentication
* Authentication persistence after page refresh

---

# Milestone 3 — Content Management

## Goal

Implement the core BrainCache vault.

## Work

Implement:

* Content model
* Content creation
* URL validation
* URL normalization
* Duplicate URL detection
* Category
* Tags
* Notes
* Content listing
* Content details
* Content editing
* Content deletion
* Ownership authorization
* Relevant MongoDB indexes

Build the initial dashboard and content UI.

## Verification

Test:

* Save content
* View content
* Edit content
* Delete content
* Duplicate URL
* Same URL for different users
* Unauthorized content access
* Invalid content data

---

# Milestone 4 — Search, Filtering, Pagination and Random Retrieval

## Goal

Make the vault easy to retrieve from.

## Work

Implement:

* Search
* Search indexing
* Debounced frontend search
* Category filtering
* Tag filtering
* Sorting
* Pagination
* Pagination metadata
* "Surprise Me"
* Empty states
* Search-empty states

## Verification

Test combinations such as:

```text
Search
Search + category
Search + tag
Search + category + tag
Sorting
Pagination
Random retrieval
Empty search
Empty vault
```

---

# Milestone 5 — Sharing and Metadata

## Goal

Complete the sharing and content enrichment features.

## Work

Implement:

* Public share tokens
* Enable sharing
* Disable sharing
* Public share route
* Public content API
* Safe public representation
* Copy share link
* Optional metadata extraction
* Metadata failure handling

Sharing must remain opt-in.

Private notes and private account information must never appear in public responses.

## Verification

Test:

* Enable sharing
* Open shared link while logged out
* Copy shared link
* Disable sharing
* Open previously shared link after disabling
* Invalid share token
* Public response does not expose private fields
* Metadata succeeds
* Metadata fails without preventing content creation

---

# Milestone 6 — Security and Robustness

## Goal

Harden the application without changing its core behavior.

## Work

Review and verify:

* Zod validation
* Authentication
* Authorization
* Password hashing
* HTTP-only cookie configuration
* Rate limiting
* Security headers
* CORS configuration
* Environment configuration
* API error handling
* MongoDB unique constraints
* URL normalization
* Duplicate handling
* Public sharing security

Also verify that all protected endpoints consistently enforce ownership.

## Verification

Perform deliberate negative testing:

```text
No authentication
Wrong user
Invalid ID
Invalid request body
Invalid query parameters
Duplicate content
Invalid share token
Disabled share token
Too many login attempts
Malformed authentication cookie
```

---

# Milestone 7 — Final UI, Testing and Cleanup

## Goal

Turn the working application into a polished final project without changing its architecture unnecessarily.

## Work

Complete:

* Responsive UI
* Loading states
* Error states
* Empty states
* Confirmation dialogs
* Accessibility improvements
* Navigation cleanup
* Form cleanup
* Consistent styling
* API/client error handling
* README
* Final documentation review
* Removal of unused code
* Removal of dead dependencies
* Removal of temporary development code

No major new feature should be introduced during this milestone.

## Final Verification

Perform an end-to-end test:

```text
Register
   ↓
Login
   ↓
Save content
   ↓
Edit content
   ↓
Search
   ↓
Filter
   ↓
Paginate
   ↓
Random retrieval
   ↓
Share
   ↓
Open public link
   ↓
Disable sharing
   ↓
Delete content
   ↓
Logout
```

Also test the application on desktop and mobile-sized screens.

---

# 4. Development Rules

## Rule 1 — Keep the application runnable

After every milestone, the application should still start successfully.

## Rule 2 — Do not implement future features early

If a feature belongs to Milestone 5, do not partially implement it during Milestone 2.

This keeps debugging manageable.

## Rule 3 — Verify before moving forward

Each milestone should be tested before starting the next one.

## Rule 4 — Prefer simple solutions

Do not introduce:

* Redis
* Kafka
* Elasticsearch
* Vector databases
* Microservices
* Complex state-management frameworks
* Background queues

unless a genuine requirement appears.

## Rule 5 — Preserve working behavior

Later milestones must not unnecessarily rewrite already-working authentication, content management, or API behavior.

## Rule 6 — Security is server-side

Frontend restrictions are for user experience.

Backend authorization and validation remain mandatory.

## Rule 7 — Keep the project explainable

Every significant architectural decision should be understandable enough to explain during an interview.

---

# 5. Definition of Done

BrainCache is considered complete when:

* Users can register and log in.
* Authentication uses secure HTTP-only cookies.
* Users can save URLs.
* URLs are validated and normalized.
* Duplicate URLs are prevented per user.
* Users can edit and delete content.
* Categories, tags and notes work.
* Search works.
* Filtering works.
* Sorting works.
* Pagination works.
* Random retrieval works.
* Sharing works.
* Disabled shares stop working.
* Private information is not exposed publicly.
* Validation and authorization are enforced server-side.
* Rate limiting protects sensitive endpoints.
* MongoDB indexes support important query patterns.
* UI works responsively.
* Loading/error/empty states are handled.
* The project is documented.
* No unnecessary infrastructure is required.
