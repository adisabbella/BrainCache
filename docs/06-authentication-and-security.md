# Authentication and Security

## 1. Purpose

BrainCache contains private user content, so authentication and authorization are core security requirements.

The application will use:

* Password-based authentication
* Secure password hashing
* JWT-based authentication
* HTTP-only cookies
* Zod validation
* Server-side authorization
* Rate limiting
* Secure HTTP headers
* Controlled public sharing
* Centralized error handling

The backend is the final security boundary. Client-side checks are used for usability only and must never be trusted for security decisions.

---

## 2. Authentication Model

BrainCache will use a stateless JWT authentication model.

After successful login:

1. User submits email/username and password.
2. Backend validates the request using Zod.
3. Backend finds the user.
4. Backend verifies the password against the stored password hash.
5. Backend creates a signed JWT.
6. JWT is stored in a secure HTTP-only cookie.
7. Subsequent requests automatically include the cookie.
8. Authentication middleware verifies the JWT.
9. The authenticated user ID is attached to the server-side request context.

The client does not need to manually store or send the JWT.

---

## 3. Password Security

Passwords must never be stored directly.

The registration flow is:

```text
Plain Password
      ↓
Password Hashing
      ↓
passwordHash
      ↓
MongoDB
```

The login flow is:

```text
Submitted Password
      ↓
Compare with passwordHash
      ↓
Valid → Continue
Invalid → Reject
```

A password hashing library such as `bcrypt` will be used.

Passwords must never:

* Be returned through an API response
* Be logged
* Be stored in browser localStorage
* Be stored in sessionStorage
* Be stored in plaintext in MongoDB

---

## 4. HTTP-Only Cookie Authentication

The JWT will be stored in an HTTP-only cookie.

The cookie should use appropriate security settings:

* `httpOnly: true`
* `secure: true` in production
* Appropriate `sameSite` policy
* Explicit expiration
* Appropriate cookie path

The exact development configuration may differ because local development commonly uses HTTP.

The important principle is that JavaScript running in the browser should not be able to directly read the authentication token.

---

## 5. JWT

The JWT will contain only the minimum information required for authentication.

Conceptually:

```text
{
  userId,
  issuedAt,
  expiresAt
}
```

The JWT must be signed using a strong secret stored in an environment variable.

Example configuration:

```text
JWT_SECRET=...
JWT_EXPIRES_IN=...
```

The secret must never be committed to source control.

Logout will clear the authentication cookie.

A full server-side token revocation/session system is intentionally out of scope for the first version because it would add significant complexity without being necessary for this project.

---

## 6. Authentication Middleware

Protected routes will pass through authentication middleware.

Conceptual flow:

```text
Request
  ↓
Read HTTP-only cookie
  ↓
Is token present?
  ↓
Verify JWT
  ↓
Is token valid and unexpired?
  ↓
Extract user ID
  ↓
Attach authenticated user
  ↓
Continue to controller
```

If authentication fails:

```text
401 Unauthorized
```

The middleware must never accept a user ID supplied by the client as proof of identity.

---

## 7. Authorization

Authentication answers:

> "Who is this user?"

Authorization answers:

> "Is this user allowed to perform this operation?"

Every private content operation must verify ownership.

For example:

```text
GET /api/content/:id
```

must not simply find the content by ID.

It must conceptually perform:

```text
find content
where _id = requestedId
AND userId = authenticatedUserId
```

This prevents one user from accessing another user's content.

---

## 8. Authorization Rules

| Resource                | Rule                               |
| ----------------------- | ---------------------------------- |
| User profile/auth state | Authenticated user only            |
| Create content          | Authenticated user                 |
| View private content    | Owner only                         |
| Edit content            | Owner only                         |
| Delete content          | Owner only                         |
| Random content          | Authenticated user's content only  |
| Enable sharing          | Owner only                         |
| Disable sharing         | Owner only                         |
| Public shared content   | Accessible using valid share token |
| Private notes           | Never publicly exposed             |

The server must perform these checks even if the frontend already hides unauthorized actions.

---

## 9. Zod Validation

Zod will validate data crossing the API boundary.

Validation will be applied to:

* Registration requests
* Login requests
* Content creation
* Content updates
* Search parameters
* Filter parameters
* Pagination parameters
* Sharing requests
* Environment configuration where appropriate

Example principle:

```text
Client input
    ↓
Zod validation
    ↓
Business logic
    ↓
Database
```

Client-side validation improves user experience but does not replace backend validation.

---

## 10. URL Validation and Normalization

Submitted URLs must be validated before being stored.

BrainCache will distinguish between:

```text
Original URL
```

and:

```text
Normalized URL
```

The original URL is preserved for opening the content.

The normalized URL is used for duplicate detection.

Normalization should be conservative.

Examples of normalization may include:

* Lowercasing the hostname
* Removing unnecessary default ports
* Normalizing the hostname
* Removing an unnecessary trailing slash
* Removing known tracking parameters

Meaningful query parameters must be preserved.

For example, a YouTube URL containing a video identifier must not lose the parameter that identifies the actual video.

---

## 11. Duplicate URL Protection

Duplicate detection occurs at two levels.

### Application level

Before creating content:

```text
Find existing content
where userId = currentUser
and normalizedUrl = normalized submitted URL
```

If found:

```text
409 Conflict
```

### Database level

A unique compound index will also enforce:

```text
(userId, normalizedUrl)
```

The database constraint protects against race conditions where two requests arrive simultaneously.

---

## 12. Rate Limiting

Rate limiting will protect sensitive endpoints from excessive requests.

At minimum:

* Registration
* Login

Additional mutation endpoints may also receive rate limits if appropriate.

Example:

```text
Too many requests
        ↓
429 Too Many Requests
```

Rate limits should be configured conservatively for local development and production.

The goal is protection, not making normal usage frustrating.

---

## 13. Security Headers

The backend should use established security middleware where appropriate.

Examples include:

* Security-related HTTP headers
* Content-type protection
* Clickjacking protection
* Referrer policy
* Other sensible Express security defaults

The project should use established libraries rather than manually implementing security headers.

---

## 14. Public Sharing Security

Sharing is explicitly opt-in.

A content item is private by default.

```text
isShared = false
```

When the owner enables sharing:

```text
Private Content
      ↓
Generate unpredictable token
      ↓
Enable sharing
      ↓
Public share URL
```

The public endpoint must verify:

1. The token exists.
2. The corresponding content exists.
3. Sharing is currently enabled.

If sharing is disabled, the public link must stop working.

---

## 15. Share Token

The public share token must be unpredictable.

MongoDB `_id` values must not be used as public share tokens.

A cryptographically secure random token should be generated.

For additional protection, the stored database value can be a hash of the token rather than the raw token.

Conceptually:

```text
Random token
     ↓
Hash
     ↓
Database
```

The original token is returned to the client when sharing is enabled and is used in the public URL.

---

## 16. Public Data Exposure

Public sharing must return a deliberately selected representation.

Possible public fields:

```text
title
description
url
domain
category
tags
thumbnailUrl
```

The public endpoint must not accidentally return:

```text
userId
passwordHash
private note
internal security information
unnecessary database fields
```

A database document should not simply be serialized and returned as the public response.

---

## 17. Metadata Retrieval Security

If metadata is extracted from submitted URLs, the metadata mechanism must be treated as an external network operation.

Metadata retrieval must not become a reason for content creation to fail.

The application should also avoid blindly fetching arbitrary internal/private network addresses.

If secure metadata extraction becomes unnecessarily complicated, metadata extraction may be deferred rather than weakening the security model.

---

## 18. Error Handling

Security-sensitive errors should avoid exposing unnecessary internal information.

For example, authentication failures should not reveal whether a particular account exists when that information is unnecessary.

Internal database errors, stack traces, secrets, and implementation details must not be returned to clients.

The client receives a controlled error response.

Example:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Something went wrong."
  }
}
```

Detailed technical information may remain available through development tooling but should not be exposed through production API responses.

---

## 19. Environment Variables

Sensitive configuration belongs in environment variables.

Expected variables include:

```text
PORT
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
CLIENT_URL
NODE_ENV
```

`.env` files containing secrets must not be committed.

A `.env.example` file may contain placeholder values.

---

## 20. Security Principles

BrainCache follows these principles:

1. Never trust the client.
2. Authenticate before accessing private resources.
3. Authorize every protected resource.
4. Validate all external input.
5. Hash passwords.
6. Keep JWTs out of browser-accessible storage.
7. Use database constraints for important integrity rules.
8. Rate-limit sensitive operations.
9. Expose only necessary public data.
10. Fail safely.
11. Keep secrets outside source control.
12. Prefer established security libraries over custom security implementations.
