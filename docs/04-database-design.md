# BrainCache — Database Design

## 1. Database

BrainCache uses:

**MongoDB**

MongoDB is appropriate because content items contain flexible metadata such as tags, descriptions, and optional metadata.

Mongoose is used as the ODM and schema layer.

---

# 2. Collections

Version 1 contains two primary collections:

```text
users
contents
```

No separate sessions collection is required.

---

# 3. User Document

Conceptual schema:

```javascript
{
  _id: ObjectId,

  username: String,
  email: String,
  passwordHash: String,

  createdAt: Date,
  updatedAt: Date
}
```

---

## 4. User Constraints

### username

* Required
* Unique
* Reasonable length limit

### email

* Required
* Normalized
* Unique

### passwordHash

* Required
* Never expose through API responses

---

# 5. Content Document

Conceptual schema:

```javascript
{
  _id: ObjectId,

  userId: ObjectId,

  url: String,
  normalizedUrl: String,

  title: String,
  description: String,
  domain: String,

  category: String,
  tags: [String],
  note: String,

  thumbnailUrl: String,

  isShared: Boolean,
  shareToken: String,

  createdAt: Date,
  updatedAt: Date,
  lastVisitedAt: Date
}
```

Some metadata fields may be null when metadata extraction is unavailable.

---

# 6. Content Field Definitions

| Field           | Purpose                                    |
| --------------- | ------------------------------------------ |
| `_id`           | MongoDB document identifier                |
| `userId`        | Owner of content                           |
| `url`           | Original URL supplied by user              |
| `normalizedUrl` | Canonical URL used for duplicate detection |
| `title`         | Content title                              |
| `description`   | Content description                        |
| `domain`        | Source domain                              |
| `category`      | Broad classification                       |
| `tags`          | Specific classifications                   |
| `note`          | User's personal note                       |
| `thumbnailUrl`  | Optional preview image                     |
| `isShared`      | Whether content is publicly shared         |
| `shareToken`    | Unpredictable public sharing token         |
| `createdAt`     | Creation time                              |
| `updatedAt`     | Last modification time                     |
| `lastVisitedAt` | Optional last-opened timestamp             |

---

# 7. User-to-Content Relationship

A user may own many content items.

```text
User
  │
  ├── Content
  ├── Content
  ├── Content
  └── Content
```

Each content item belongs to exactly one user.

The relationship is represented by:

```text
content.userId
```

---

# 8. Categories

Categories are stored directly on the content document as a string.

Example:

```javascript
{
  category: "AI & ML"
}
```

A separate category collection is unnecessary for version 1 because categories are controlled by the application and do not require independent CRUD operations.

---

# 9. Tags

Tags are stored as an array.

Example:

```javascript
{
  tags: [
    "machine-learning",
    "transformers",
    "interview"
  ]
}
```

Tags are not separate documents because BrainCache does not currently require:

* Tag ownership
* Tag metadata
* Tag descriptions
* Tag permissions
* Tag CRUD

This keeps the data model simple.

---

# 10. URL Storage

Both the original and normalized URLs are stored.

Example:

```javascript
{
  url: "https://www.example.com/article/?utm_source=test",

  normalizedUrl:
    "https://example.com/article"
}
```

The original URL is preserved for user-facing behavior.

The normalized URL is used internally for duplicate detection.

---

# 11. URL Normalization

Normalization should be conservative.

Possible normalization operations include:

* Lowercase hostname
* Remove unnecessary default ports
* Normalize hostname
* Remove unnecessary trailing slash
* Remove known tracking parameters
* Preserve meaningful query parameters

The normalization process must not alter the identity of the actual resource.

For example:

```text
https://youtube.com/watch?v=ABC
```

must not become:

```text
https://youtube.com/watch
```

because `v=ABC` identifies the video.

---

# 12. Duplicate URL Constraint

The database shall enforce:

```text
UNIQUE(userId, normalizedUrl)
```

Conceptually:

```javascript
{
  userId: ObjectId,
  normalizedUrl: String
}
```

must be unique as a pair.

Therefore:

```text
User A + URL X → allowed
User A + URL X → duplicate
User B + URL X → allowed
```

This prevents duplicate content for an individual user without preventing different users from saving the same content.

---

# 13. Indexes

Indexes shall be created based on actual query patterns.

Initial indexes include:

### User email

```text
email → unique
```

Used during login and registration.

### Username

```text
username → unique
```

Used during registration.

### Content ownership + creation time

```text
(userId, createdAt)
```

Supports normal user-specific content listing and sorting.

### Content ownership + category + creation time

```text
(userId, category, createdAt)
```

Supports category filtering and sorting.

### Content ownership + normalized URL

```text
(userId, normalizedUrl) → unique
```

Supports duplicate detection.

### Search index

A text/search index shall cover the fields selected for content search.

The exact MongoDB index configuration will be finalized during implementation and verified against actual query patterns.

---

# 14. Indexing Principle

Indexes shall not be created simply because a field exists.

Each index must correspond to an important query pattern.

For example:

```text
GET /api/content?category=AI%20%26%20ML
```

requires efficient access to:

```text
userId + category
```

while:

```text
GET /api/content
```

requires efficient access to:

```text
userId + createdAt
```

Indexes improve read performance but introduce additional storage and write/update overhead. Therefore only useful indexes should be maintained.

---

# 15. Sharing Data

A content document contains:

```javascript
{
  isShared: Boolean,
  shareToken: String
}
```

When sharing is disabled:

```javascript
isShared: false
```

The public share endpoint must reject access regardless of whether a token exists.

When sharing is enabled:

```javascript
isShared: true,
shareToken: "<unpredictable-token>"
```

The share token must be sufficiently unpredictable to prevent guessing.

---

# 16. Public Representation

The public sharing endpoint shall not simply return the complete database document.

Instead, the server constructs a safe public representation containing only information intended for sharing.

For example:

```javascript
{
  title,
  description,
  url,
  domain,
  category,
  tags,
  thumbnailUrl
}
```

Private fields such as:

```text
userId
note
internal identifiers
```

must not be exposed unless explicitly required by the sharing specification.

---

# 17. Data Integrity

The database should enforce important constraints wherever possible.

Application validation handles:

* Input format
* Length limits
* Allowed categories
* URL validity

Database constraints handle:

* Unique email
* Unique username
* Unique `(userId, normalizedUrl)`

This provides defense at multiple layers.

---

# 18. Data Deletion

Deleting a content item removes that content document.

Deleting a user is outside the initial application UI scope but, if implemented later, must account for the user's owned content.

No content should remain accessible after its owner is removed unless a deliberate retention policy is introduced.