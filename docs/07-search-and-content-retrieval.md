# Search and Content Retrieval

## 1. Purpose

BrainCache is primarily useful when saved content can be found quickly.

This document defines:

* Search
* Filtering
* Sorting
* Pagination
* Random retrieval
* URL duplicate detection
* Search-related indexing
* Debounced frontend search

The first version intentionally avoids semantic/vector search and dedicated search infrastructure.

---

## 2. Search Scope

Users should be able to search their own saved content using:

* Title
* Description
* Domain
* Tags
* Notes

Search must only operate over content belonging to the authenticated user.

A user must never be able to search or retrieve another user's private content.

---

## 3. Search Request

Search is exposed through the content collection endpoint.

Example:

```text
GET /api/content?search=machine learning
```

Search can be combined with other parameters:

```text
GET /api/content
    ?search=machine learning
    &category=AI%20%26%20ML
    &tag=transformers
    &sort=newest
    &page=1
    &limit=20
```

---

## 4. Frontend Debouncing

The search input should not send a request for every keystroke.

Without debouncing:

```text
m
ma
mac
mach
machi
machin
machine
```

could generate many requests.

Instead, the frontend waits for a short period after the user stops typing.

Target debounce duration:

```text
~300 ms
```

Conceptually:

```text
User types
    ↓
Wait 300 ms
    ↓
No new input?
    ↓
Send search request
```

If the user continues typing, the timer resets.

---

## 5. Search Strategy

The initial version will use MongoDB-supported search/indexing rather than a separate search engine.

The project does not require:

* Elasticsearch
* OpenSearch
* Vector databases
* Embedding models
* Semantic search infrastructure

This keeps the architecture simple while still providing useful search functionality.

---

## 6. Text Search Fields

The searchable fields are:

```text
title
description
domain
tags
note
```

The exact MongoDB index configuration will be implemented according to the selected Mongoose/MongoDB search strategy.

The important requirement is that common search queries should have an appropriate database-supported access path rather than blindly scanning every document.

---

## 7. User Scoping

Search must always be combined with the authenticated user's ID.

Conceptually:

```text
userId = authenticatedUser
AND
search matches requested text
```

This is a critical security requirement.

The frontend must never be allowed to specify:

```text
userId=someone-else
```

as a substitute for server-side authorization.

---

## 8. Filtering

Users can filter content by:

### Category

Example:

```text
category=Programming
```

### Tag

Example:

```text
tag=leetcode
```

### Search + Category

Example:

```text
search=machine
category=AI%20%26%20ML
```

### Search + Tag

Example:

```text
search=react
tag=frontend
```

Multiple filters should work together.

---

## 9. Sorting

The first version supports:

```text
newest
oldest
```

Default:

```text
newest
```

Sorting is based primarily on:

```text
createdAt
```

Example:

```text
GET /api/content?sort=newest
```

or:

```text
GET /api/content?sort=oldest
```

---

## 10. Pagination

Pagination prevents the application from loading every saved item at once.

The API uses:

```text
page
limit
```

Example:

```text
GET /api/content?page=2&limit=20
```

The backend must enforce a maximum limit.

For example, the client should not be able to request an arbitrarily large number of records simply by sending:

```text
limit=1000000
```

The exact maximum will be chosen during implementation.

---

## 11. Pagination Response

A collection response should contain both the content and pagination information.

Conceptually:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 42,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

The frontend can use this information to render pagination controls.

---

## 12. Pagination Strategy

The first version uses page/limit pagination.

Conceptually:

```text
skip = (page - 1) × limit
```

This is simple and easy to understand.

Cursor-based pagination is intentionally not required because the expected scale of BrainCache does not justify the additional complexity for the initial version.

This decision can be revisited if the application later handles very large collections.

---

## 13. Database Indexing

Indexes should correspond to real query patterns.

Important indexes include:

```text
(userId, createdAt)
(userId, category, createdAt)
(userId, normalizedUrl) UNIQUE
```

A suitable text/search index will also support the chosen search implementation.

The goal is not to create an index for every field.

Too many indexes increase:

* Storage requirements
* Write overhead
* Database maintenance cost

---

## 14. Category Filtering

Category is stored directly on each content document.

Example:

```text
category = "Programming"
```

This avoids creating a separate category collection.

Because categories are application-defined and relatively stable, a separate database entity is unnecessary.

---

## 15. Tag Filtering

Tags are stored as an array.

Example:

```text
tags: [
  "react",
  "frontend",
  "javascript"
]
```

Tags should be normalized consistently.

For example:

```text
" React "
"react"
"REACT"
```

should not unnecessarily become three different logical tags.

The exact normalization rules will be kept simple and deterministic.

---

## 16. Random Retrieval

BrainCache provides a "Surprise Me" feature.

The endpoint is:

```text
GET /api/content/random
```

It returns one random content item belonging to the authenticated user.

Conceptually:

```text
Authenticated User
       ↓
Match user's content
       ↓
Select random document
       ↓
Return content
```

MongoDB's random sampling functionality can be used.

Random retrieval is always user-scoped.

---

## 17. Empty Collection

If the user has no saved content:

```text
GET /api/content/random
```

should return a controlled response rather than an unexpected server error.

The frontend can display:

```text
Your vault is empty.
Save something first!
```

Similarly, the main content list should have a dedicated empty state.

---

## 18. Search Empty State

A distinction should be made between:

### No content exists

```text
You haven't saved anything yet.
```

### Content exists but search produced no results

```text
No content matches your search.
```

These states should not look like application failures.

---

## 19. URL Duplicate Detection

When saving a URL:

```text
Original URL
      ↓
Validate
      ↓
Normalize
      ↓
Check (userId, normalizedUrl)
      ↓
Duplicate?
```

If duplicate:

```text
409 Conflict
```

This prevents accidental repeated saves.

The database unique index remains the final integrity mechanism.

---

## 20. Search Performance Principles

The project should optimize only where there is a demonstrated need.

The first version should focus on:

* Appropriate indexes
* Server-side filtering
* Server-side pagination
* Debounced frontend search
* Avoiding unnecessary API calls
* Returning only required data

It should not introduce:

* Redis caching
* Elasticsearch
* Vector databases
* Background search workers
* Complex query infrastructure

These are unnecessary for the project's intended scale.

---

## 21. Future Extension

If BrainCache eventually grows significantly, search could evolve toward:

```text
MongoDB native search
        ↓
More advanced MongoDB search
        ↓
Dedicated search infrastructure
        ↓
Optional semantic/vector search
```

Such changes are intentionally outside the initial project scope.

The initial goal is a clean, understandable search implementation that can be explained confidently in an interview.
