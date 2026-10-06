# BrainCache — API Specification

## 1. API Overview

BrainCache exposes a REST API consumed by the React frontend.

Base URL:

```text
/api
```

All private endpoints require authentication unless explicitly stated otherwise.

---

# 2. API Conventions

## 2.1 JSON

Request and response bodies use JSON unless otherwise specified.

---

## 2.2 Authentication

Authentication is established using a secure HTTP-only cookie.

The client does not manually send the authentication token in request bodies.

---

## 2.3 Authentication Requirement

Endpoints are marked as:

```text
Public
Authenticated
```

Authenticated endpoints require a valid authentication cookie.

---

## 2.4 Authorization

Authentication alone does not grant access to arbitrary resources.

For content operations, the authenticated user's ownership of the requested resource must be verified.

---

# 3. Standard Success Response

Responses should follow a consistent structure where appropriate.

Example:

```json
{
  "success": true,
  "data": {}
}
```

Collection responses may additionally include pagination metadata.

---

# 4. Standard Error Response

Errors should use a consistent structure.

Example:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data."
  }
}
```

The API must not expose internal stack traces or sensitive implementation details.

---

# 5. HTTP Status Codes

The API uses:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
429 Too Many Requests
500 Internal Server Error
```

---

# 6. Authentication Endpoints

## 6.1 Register

```text
POST /api/auth/register
```

### Authentication

Public

### Request

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "secure-password"
}
```

### Validation

* Username required
* Username length limits
* Valid email
* Password requirements
* No duplicate username
* No duplicate email

### Success

```text
201 Created
```

The user is created and the appropriate authentication state is established according to the authentication design.

---

## 6.2 Login

```text
POST /api/auth/login
```

### Authentication

Public

### Request

```json
{
  "email": "john@example.com",
  "password": "secure-password"
}
```

### Success

```text
200 OK
```

A secure HTTP-only authentication cookie is established.

### Failure

```text
401 Unauthorized
```

The response should not reveal whether the email or password was incorrect.

---

## 6.3 Logout

```text
POST /api/auth/logout
```

### Authentication

Authenticated

### Success

```text
204 No Content
```

The authentication cookie is cleared.

---

## 6.4 Current User

```text
GET /api/auth/me
```

### Authentication

Authenticated

### Success

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "username": "john",
      "email": "john@example.com"
    }
  }
}
```

The password hash must never be returned.

---

# 7. Content Endpoints

## 7.1 List Content

```text
GET /api/content
```

### Authentication

Authenticated

### Query Parameters

```text
page
limit
search
category
tag
sort
```

Example:

```text
GET /api/content?page=1&limit=20&search=transformer&category=AI%20%26%20ML&sort=newest
```

### Defaults

```text
page = 1
limit = 20
sort = newest
```

The server shall enforce a maximum `limit`.

### Success

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 42,
      "totalPages": 3
    }
  }
}
```

Only content belonging to the authenticated user may be returned.

---

# 8. Get Content

```text
GET /api/content/:id
```

### Authentication

Authenticated

### Authorization

The requested content must belong to the authenticated user.

### Success

```text
200 OK
```

### Failure

```text
404 Not Found
```

A resource belonging to another user should not be exposed.

---

# 9. Create Content

```text
POST /api/content
```

### Authentication

Authenticated

### Request

```json
{
  "url": "https://example.com/article",
  "category": "Education",
  "tags": [
    "machine-learning",
    "tutorial"
  ],
  "note": "Review this before the exam."
}
```

### Validation

* Valid URL
* Valid category
* Valid tags
* Tag count limit
* Tag length limit
* Note length limit

### Processing

The backend shall:

1. Authenticate the user.
2. Validate request data.
3. Normalize the URL.
4. Check for duplicates.
5. Attempt metadata extraction where appropriate.
6. Create the content document.
7. Return the created content.

### Success

```text
201 Created
```

### Duplicate

```text
409 Conflict
```

Example:

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_CONTENT",
    "message": "This URL is already saved."
  }
}
```

---

# 10. Update Content

```text
PATCH /api/content/:id
```

### Authentication

Authenticated

### Authorization

The content must belong to the authenticated user.

### Request

Any editable fields may be supplied.

Example:

```json
{
  "category": "AI & ML",
  "tags": [
    "transformers",
    "interview"
  ],
  "note": "Important interview resource."
}
```

### Success

```text
200 OK
```

The response contains the updated content.

---

# 11. Delete Content

```text
DELETE /api/content/:id
```

### Authentication

Authenticated

### Authorization

The content must belong to the authenticated user.

### Success

```text
204 No Content
```

### Failure

```text
404 Not Found
```

---

# 12. Random Content

```text
GET /api/content/random
```

### Authentication

Authenticated

### Behavior

Returns a random content item belonging to the authenticated user.

### Success

```json
{
  "success": true,
  "data": {
    "content": {}
  }
}
```

### Empty Vault

If the user has no saved content, an appropriate empty response should be returned rather than an arbitrary error.

---

# 13. Sharing Endpoints

## 13.1 Enable Sharing

```text
POST /api/content/:id/share
```

### Authentication

Authenticated

### Authorization

Content must belong to the authenticated user.

### Behavior

The server generates an unpredictable share token and marks the content as shared.

### Success

```json
{
  "success": true,
  "data": {
    "shareUrl": "/share/<token>"
  }
}
```

---

## 13.2 Disable Sharing

```text
DELETE /api/content/:id/share
```

### Authentication

Authenticated

### Authorization

Content must belong to the authenticated user.

### Success

```text
204 No Content
```

The content becomes private.

---

# 14. Public Share Endpoint

```text
GET /api/share/:token
```

### Authentication

Public

### Behavior

The server:

1. Finds the content associated with the token.
2. Verifies that sharing is enabled.
3. Constructs a safe public representation.
4. Returns only fields intended for public viewing.

### Success

```json
{
  "success": true,
  "data": {
    "content": {
      "title": "...",
      "description": "...",
      "url": "...",
      "domain": "...",
      "category": "...",
      "tags": [],
      "thumbnailUrl": "..."
    }
  }
}
```

### Failure

```text
404 Not Found
```

The endpoint should not reveal whether a token exists but sharing is disabled versus the token never existing.

---

# 15. Search

Search is implemented through the content listing endpoint.

Example:

```text
GET /api/content?search=transformer
```

The backend searches the configured searchable fields.

Search is always restricted to the authenticated user's content.

The frontend should debounce search input before making requests.

---

# 16. Filtering

Category:

```text
GET /api/content?category=Movies
```

Tag:

```text
GET /api/content?tag=marvel
```

Combined:

```text
GET /api/content?category=Movies&tag=marvel
```

---

# 17. Sorting

Supported initial values:

```text
newest
oldest
```

Example:

```text
GET /api/content?sort=oldest
```

Invalid sort values should be rejected or safely replaced with the default.

---

# 18. Pagination

Example:

```text
GET /api/content?page=2&limit=20
```

The backend shall:

1. Validate `page`.
2. Validate `limit`.
3. Enforce maximum limit.
4. Apply filters/search.
5. Apply sorting.
6. Retrieve the requested page.
7. Return pagination metadata.

---

# 19. Rate Limiting

Rate limiting shall primarily protect sensitive endpoints.

Initial targets:

```text
POST /api/auth/register
POST /api/auth/login
```

Additional mutation endpoints may be protected if required.

A rate-limited request returns:

```text
429 Too Many Requests
```

---

# 20. Validation

Zod schemas shall validate all request bodies and query parameters.

Examples:

```text
RegisterRequestSchema
LoginRequestSchema
CreateContentSchema
UpdateContentSchema
ContentQuerySchema
ShareContentSchema
```

Validation occurs before service-layer business logic.

---

# 21. Authorization Rules

The following operations require ownership:

```text
GET    /api/content/:id
PATCH  /api/content/:id
DELETE /api/content/:id

POST   /api/content/:id/share
DELETE /api/content/:id/share
```

The backend must determine ownership from the authenticated user rather than accepting a client-supplied owner ID.

---

# 22. API Design Principles

The API should follow these principles:

1. Resources are represented through predictable URLs.
2. HTTP methods communicate intent.
3. Authentication is handled centrally.
4. Authorization is enforced server-side.
5. Request data is validated before business logic.
6. Errors use consistent structures.
7. Pagination is mandatory for collection endpoints.
8. Private resources are scoped to the authenticated user.
9. Public sharing is explicitly opt-in.
10. The API should remain small and focused on BrainCache's actual requirements.

---

# 23. Initial Endpoint Summary

| Method | Endpoint                 | Auth | Purpose             |
| ------ | ------------------------ | ---: | ------------------- |
| POST   | `/api/auth/register`     |   No | Register            |
| POST   | `/api/auth/login`        |   No | Login               |
| POST   | `/api/auth/logout`       |  Yes | Logout              |
| GET    | `/api/auth/me`           |  Yes | Current user        |
| GET    | `/api/content`           |  Yes | List/search/filter  |
| POST   | `/api/content`           |  Yes | Save content        |
| GET    | `/api/content/:id`       |  Yes | View content        |
| PATCH  | `/api/content/:id`       |  Yes | Edit content        |
| DELETE | `/api/content/:id`       |  Yes | Delete content      |
| GET    | `/api/content/random`    |  Yes | Random content      |
| POST   | `/api/content/:id/share` |  Yes | Enable sharing      |
| DELETE | `/api/content/:id/share` |  Yes | Disable sharing     |
| GET    | `/api/share/:token`      |   No | View shared content |
