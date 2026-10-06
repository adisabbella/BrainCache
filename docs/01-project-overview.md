# BrainCache — Project Overview

## 1. Project Overview

**BrainCache** is a personal content vault that allows users to save, organize, search, and revisit useful or interesting online content.

The application is designed around a simple problem: people frequently discover useful articles, videos, reels, posts, tutorials, movie recommendations, games, and other online content, but later struggle to find them again.

BrainCache provides a centralized personal space for storing these links together with useful metadata such as categories, tags, and personal notes.

The core workflow is:

**Save → Organize → Search → Retrieve → Revisit**

BrainCache stores references to online content rather than hosting or downloading the content itself.

---

## 2. Problem Statement

Users discover a large amount of useful online content across different platforms:

* Articles
* YouTube videos
* Instagram reels
* X/Twitter posts
* Tutorials
* Educational resources
* Movie and TV recommendations
* Games
* News
* Social media content

Browser bookmarks are often insufficient because they provide limited organization and retrieval capabilities.

BrainCache addresses this by allowing users to:

* Save content in one centralized location
* Classify content using broad categories
* Add flexible tags
* Add personal notes explaining why something was saved
* Search saved content
* Filter and sort content
* Retrieve content using pagination
* Randomly rediscover previously saved content
* Share selected saved content through a public link

---

## 3. Product Vision

BrainCache should feel like a user's **external memory for online content**.

The application should make it easy to answer questions such as:

* "Where was that machine learning article I saved?"
* "Which videos did I save about system design?"
* "What were those movies someone recommended to me?"
* "Show me everything I saved under Games."
* "I remember saving something about transformers. Find it."
* "Give me something random from my saved content."

The product should prioritize **fast retrieval and organization** over unnecessary features.

---

## 4. Target User

The primary user is an individual who frequently discovers and saves online content and wants a better system for organizing and revisiting it.

The initial version is designed primarily for personal use, while supporting controlled sharing of individual saved items.

BrainCache does not attempt to become a social network or public content discovery platform.

---

## 5. Core Capabilities

### 5.1 User Authentication

Users can:

* Register an account
* Log in
* Log out
* Maintain an authenticated session
* Access only their own private content

Authentication uses secure HTTP-only cookies.

---

### 5.2 Content Management

Authenticated users can:

* Save a URL
* View saved content
* Edit saved content
* Delete saved content
* Add a category
* Add tags
* Add personal notes
* Open the original URL

---

### 5.3 Content Organization

Every saved item has one broad category.

Initial categories include:

* Education
* Technology
* Programming
* AI & ML
* Career
* News
* Movies
* TV Shows
* Music
* Games
* Sports
* Travel
* Finance
* Health & Fitness
* Food
* Memes
* Social Media
* Other

Categories provide consistent high-level classification.

Tags provide more specific and flexible classification.

For example:

```text
Category: AI & ML

Tags:
machine-learning
transformers
interview
```

---

### 5.4 Personal Notes

Users can attach a personal note to saved content.

Example:

```text
"Very good explanation of attention mechanism.
Review before ML interviews."
```

Notes are private to the owner unless the item's sharing behavior explicitly exposes selected metadata.

---

### 5.5 Search and Retrieval

Users can search their saved content using searchable metadata such as:

* Title
* Description
* Domain
* Tags
* Notes

The initial implementation uses indexed text search rather than semantic/vector search.

Search results support:

* Filtering
* Sorting
* Pagination

Search requests from the frontend are debounced to avoid unnecessary API requests while typing.

---

### 5.6 Random Retrieval

BrainCache provides a **Surprise Me** feature that retrieves a random item from the authenticated user's saved content.

This allows users to rediscover content they may have forgotten about.

Random retrieval is always restricted to the authenticated user's own content.

---

### 5.7 Shareable Content

Users can choose to share an individual saved item.

A shareable item receives an unpredictable share token and can be accessed through a public share URL.

Only explicitly shared content is publicly accessible.

Private notes and other private information must not be exposed unintentionally through public sharing.

---

### 5.8 Metadata

Where feasible, BrainCache may retrieve basic metadata from the saved URL, such as:

* Page title
* Description
* Domain
* Preview image

Metadata retrieval is treated as an enhancement rather than a requirement for saving content.

If metadata extraction fails, the URL must still be saved successfully.

---

## 6. Technology Stack

### Frontend

* React
* TypeScript
* Vite
* TailwindCSS
* React Router

### Backend

* Node.js
* Express
* TypeScript

### Database

* MongoDB
* Mongoose

### Validation

* Zod

### Authentication

* Password hashing
* JWT
* HTTP-only cookies

### Security / Middleware

* Express middleware
* Rate limiting
* Security headers

---

## 7. Architectural Principles

BrainCache follows these principles:

### Simplicity

The application should use the smallest reasonable architecture capable of satisfying its requirements.

No infrastructure should be introduced solely for complexity or resume value.

### Separation of Responsibilities

The backend separates:

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Repositories
  ↓
Database
```

Each layer has a clearly defined responsibility.

### Server-Side Security

The server is the final authority for:

* Authentication
* Authorization
* Validation
* Ownership
* Data access

Client-side validation is used for user experience but is never considered a security boundary.

### Database-Level Integrity

Important constraints, such as duplicate URL prevention, should be enforced by MongoDB indexes in addition to application-level checks.

### Graceful Failure

Failures such as metadata extraction errors should not unnecessarily prevent the primary operation from succeeding.

### Incremental Development

Features are developed in milestones. Existing functionality should remain stable while new functionality is added.

---

## 8. Scope

### Included

* User registration
* Login
* Logout
* Authentication
* Secure HTTP-only cookies
* Server-side authorization
* Save content
* View content
* Edit content
* Delete content
* Categories
* Tags
* Notes
* Search
* Filtering
* Sorting
* Pagination
* Debounced search
* Random retrieval
* URL normalization
* Duplicate URL detection
* Metadata extraction
* Shareable content
* Responsive UI
* Loading/error/empty states
* Backend validation
* Zod validation
* Rate limiting
* MongoDB indexes
* Centralized configuration
* Layered backend architecture

### Excluded from Version 1

* Semantic/vector search
* AI-generated recommendations
* Browser extension
* Mobile application
* Social feeds
* Following/followers
* Comments
* Likes
* File hosting
* Content downloading
* Video/image storage
* Microservices
* Redis
* Kafka
* Dedicated search infrastructure
* Real-time communication

---

## 9. High-Level User Journey

```text
Register
   ↓
Login
   ↓
Dashboard
   ↓
Save URL
   ↓
Add category / tags / note
   ↓
Content stored
   ↓
Browse / Search / Filter
   ↓
Open / Edit / Delete / Share
   ↓
Rediscover through Search or Surprise Me
```

---

## 10. Success Criteria

BrainCache is considered successful when an authenticated user can:

1. Create an account.
2. Log in securely.
3. Save online content.
4. Organize saved content.
5. Find previously saved content efficiently.
6. Edit or delete content.
7. Retrieve random saved content.
8. Share selected content safely.
9. Use the application comfortably on desktop and mobile.
10. Receive clear feedback when operations are loading, successful, empty, or unsuccessful.

The system should remain understandable and maintainable by a single developer while demonstrating sound full-stack engineering practices.
