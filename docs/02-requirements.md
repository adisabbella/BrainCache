# BrainCache — Requirements

## 1. Functional Requirements

### 1.1 Authentication

#### FR-AUTH-01 — User Registration

The system shall allow a new user to create an account using:

* Username
* Email
* Password

The system shall reject invalid or incomplete registration data.

Usernames and email addresses shall be unique.

Passwords shall never be stored in plaintext.

---

#### FR-AUTH-02 — User Login

The system shall allow registered users to authenticate using their credentials.

Successful authentication shall establish an authenticated session using a secure HTTP-only cookie.

Invalid credentials shall result in an appropriate authentication error.

---

#### FR-AUTH-03 — User Logout

The system shall allow an authenticated user to log out.

Logout shall invalidate/remove the authentication cookie on the client.

---

#### FR-AUTH-04 — Authentication Persistence

An authenticated user shall remain authenticated across normal page refreshes until the authentication mechanism expires or the user logs out.

---

#### FR-AUTH-05 — Protected Resources

Private application resources shall require authentication.

Unauthenticated users shall not be able to access private content APIs.

---

## 2. Content Requirements

### FR-CONTENT-01 — Save Content

Authenticated users shall be able to save a URL.

A saved content item shall belong to exactly one user.

---

### FR-CONTENT-02 — Content Information

A content item may contain:

* URL
* Title
* Description
* Domain
* Category
* Tags
* Personal note
* Metadata
* Sharing information
* Creation timestamp
* Modification timestamp

---

### FR-CONTENT-03 — Edit Content

Users shall be able to modify their own saved content.

Users shall not be able to modify another user's content.

---

### FR-CONTENT-04 — Delete Content

Users shall be able to delete their own content.

Deletion shall be authorized server-side.

---

### FR-CONTENT-05 — View Content

Authenticated users shall be able to view their saved content.

The default content listing shall return content belonging only to the authenticated user.

---

## 3. Organization Requirements

### FR-ORG-01 — Categories

Every saved content item shall have one broad category.

The initial category set shall be controlled by the application.

Initial categories:

```text
Education
Technology
Programming
AI & ML
Career
News
Movies
TV Shows
Music
Games
Sports
Travel
Finance
Health & Fitness
Food
Memes
Social Media
Other
```

The category list may be extended in future versions.

---

### FR-ORG-02 — Tags

A content item may contain multiple tags.

Tags shall allow more specific classification than categories.

Examples:

```text
AI & ML
→ machine-learning
→ transformers
→ interview
```

```text
Movies
→ marvel
→ sci-fi
→ recommendation
```

Tags shall have reasonable length and quantity limits.

---

### FR-ORG-03 — Notes

Users shall be able to attach a personal note to saved content.

Notes shall have a maximum supported length.

Notes shall remain private unless explicitly included in a future sharing policy.

---

## 4. Search Requirements

### FR-SEARCH-01 — Search

Authenticated users shall be able to search their saved content.

Search shall support relevant fields including:

* Title
* Description
* Domain
* Tags
* Notes

Search shall only operate over the authenticated user's content.

---

### FR-SEARCH-02 — Search Debouncing

The frontend shall debounce user-entered search queries before sending requests to the backend.

The initial debounce interval shall be approximately 300 milliseconds.

---

### FR-SEARCH-03 — Search Technology

Version 1 shall use MongoDB-supported text/indexed search.

Semantic/vector search is outside the scope of version 1.

---

## 5. Filtering Requirements

### FR-FILTER-01 — Category Filtering

Users shall be able to filter content by category.

---

### FR-FILTER-02 — Tag Filtering

Users shall be able to filter content by tag.

---

### FR-FILTER-03 — Combined Filtering

Search, category, tag, sorting, and pagination should work together.

Example:

```text
Search = transformer
Category = AI & ML
Tag = interview
Sort = newest
Page = 1
Limit = 20
```

---

## 6. Sorting Requirements

Users shall be able to sort content.

The initial supported ordering shall include:

* Newest first
* Oldest first

Additional sorting may be introduced only if justified by product requirements.

---

## 7. Pagination Requirements

### FR-PAGE-01

Content listing endpoints shall use pagination.

The server shall not return an unlimited number of content records.

---

### FR-PAGE-02

The API shall support parameters such as:

```text
page
limit
```

The server shall enforce reasonable limits on `limit`.

---

### FR-PAGE-03

The API shall return sufficient pagination metadata for the frontend to construct pagination controls.

---

## 8. Random Retrieval Requirements

### FR-RANDOM-01

Authenticated users shall be able to request a random saved content item.

---

### FR-RANDOM-02

Random retrieval shall be restricted to the authenticated user's content.

---

### FR-RANDOM-03

The frontend shall expose this capability through a user-friendly "Surprise Me" action.

---

## 9. URL Requirements

### FR-URL-01 — URL Validation

The backend shall validate submitted URLs.

Invalid URLs shall not be stored.

---

### FR-URL-02 — URL Normalization

The application shall normalize URLs before duplicate detection.

Normalization shall be conservative and must not remove query parameters that are required to identify the resource.

---

### FR-URL-03 — Duplicate Detection

A user shall not be able to save the same normalized URL multiple times.

Duplicate detection shall be enforced both:

1. At the application level for a friendly response.
2. At the database level using a unique compound index.

The uniqueness boundary shall be:

```text
(userId, normalizedUrl)
```

Different users may save the same URL.

---

## 10. Content Metadata Requirements

### FR-META-01

The system may attempt to retrieve metadata from a saved URL.

Potential metadata includes:

* Title
* Description
* Preview image
* Domain

---

### FR-META-02

Metadata extraction failure shall not cause the original save operation to fail.

The URL shall remain usable even if metadata is unavailable.

---

## 11. Sharing Requirements

### FR-SHARE-01

Users shall be able to enable sharing for individual content items.

---

### FR-SHARE-02

The system shall generate an unpredictable share token.

MongoDB document IDs shall not be used as public share tokens.

---

### FR-SHARE-03

A public share URL shall only expose content explicitly marked as shared.

---

### FR-SHARE-04

Private user information and private notes shall not be exposed unintentionally through shared content.

---

### FR-SHARE-05

Users shall be able to disable sharing.

Once disabled, the associated share URL shall no longer expose the content.

---

## 12. Validation Requirements

### FR-VALID-01

All externally supplied API data shall be validated on the server.

---

### FR-VALID-02

Zod shall be used for request validation.

Validation shall cover:

* Authentication input
* URLs
* Categories
* Tags
* Notes
* Pagination parameters
* Search parameters
* Sharing requests

---

### FR-VALID-03

Client-side validation may be used for immediate user feedback but shall not replace server-side validation.

---

## 13. Authorization Requirements

### FR-AUTHZ-01

Every private content operation shall verify ownership.

---

### FR-AUTHZ-02

A valid authenticated user shall not automatically have permission to access another user's resources.

---

### FR-AUTHZ-03

Ownership checks shall occur on the server.

The client shall never be trusted to provide a valid `userId`.

---

## 14. Rate Limiting Requirements

Rate limiting shall be applied to sensitive endpoints.

At minimum:

* Registration
* Login

Additional mutation endpoints may be rate-limited where appropriate.

Rate limits shall not prevent normal application usage.

---

## 15. API Error Requirements

The API shall use a consistent error response structure.

Errors shall include appropriate HTTP status codes.

Examples:

```text
400 — Invalid request
401 — Unauthenticated
403 — Unauthorized
404 — Resource not found
409 — Conflict
429 — Rate limit exceeded
500 — Internal server error
```

Internal implementation details and sensitive information shall not be exposed to clients.

---

## 16. UI Requirements

The application shall provide clear states for:

### Loading

The user should understand that an operation is in progress.

### Empty

The application should explain when no content exists.

### Search Empty

The application should distinguish between an empty BrainCache and a search that produced no results.

### Error

The user should receive a clear explanation and, where appropriate, a retry action.

### Confirmation

Destructive actions such as deletion should require appropriate confirmation.

---

## 17. Responsive Requirements

The application shall be usable on:

* Desktop
* Tablet
* Mobile

The primary dashboard, content cards, forms, navigation, search, and content details shall adapt to smaller screens.

---

## 18. Non-Functional Requirements

### NFR-01 — Security

Private content must not be exposed to unauthorized users.

### NFR-02 — Maintainability

The codebase shall use clear module boundaries and separation of concerns.

### NFR-03 — Simplicity

The application shall avoid infrastructure that is not justified by current requirements.

### NFR-04 — Performance

Content retrieval shall use pagination and appropriate MongoDB indexes.

### NFR-05 — Reliability

Optional metadata retrieval shall not compromise the core content-saving operation.

### NFR-06 — Usability

The application shall clearly communicate loading, success, empty, and error states.

---

## 19. Explicitly Out of Scope

Version 1 shall not include:

* Semantic search
* Vector database
* AI-generated summaries
* AI recommendations
* Browser extension
* Mobile application
* Social feeds
* Following/followers
* Likes
* Comments
* File uploads
* Content hosting
* Content downloading
* Redis
* Kafka
* Microservices
* Dedicated search engine
* Real-time communication

These may be reconsidered in future versions only if there is a clear product requirement.
