---
name: backend-design
description: Write production-grade backend code with excellent error handling, security, performance, and operational readiness. Use this skill when building APIs, services, data models, background jobs, or any server-side logic. Produces code that is robust under real-world conditions, not just happy paths.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Write production-grade backend code that survives contact with real users. Every endpoint will eventually receive malformed input, every database query will eventually time out, every external service will eventually go down. Design for this reality.

## The LLM Slop Test

Before shipping any backend code, check for these signs of carelessly generated code. If you spot any, fix them immediately:

### Over-Abstraction
- `AbstractServiceManagerProviderFactory` classes that add indirection without value
- Generic CRUD wrappers that do nothing but proxy to the ORM
- Repository pattern wrapping an ORM that already IS a repository — with no added business logic
- Service layers that just call through to repositories with zero transformation
- More than 3 layers of abstraction for a simple CRUD operation

### Happy-Path-Only Code
- No error handling on external calls (HTTP, DB, file system, queues)
- No timeouts on any outbound request
- No retry logic for transient failures
- No validation on incoming data
- No consideration of what happens when things fail

### Observability Theater
- `console.log` / `print()` as the logging strategy
- No structured logging (JSON with consistent fields)
- No correlation IDs to trace requests across services
- No metrics collection (request rate, error rate, latency)
- Logging sensitive data (passwords, tokens, PII)

### Data Access Sins
- N+1 queries hidden inside loops (query per item in a list)
- `SELECT *` everywhere instead of selecting needed columns
- No pagination on list endpoints — loading entire tables into memory
- Missing indexes on commonly queried / filtered columns
- Using ORM `.save()` in a loop instead of bulk operations
- No database connection pooling or misconfigured pool sizes

### Security Negligence
- Secrets hardcoded in source code or committed to git
- String concatenation for SQL queries (injection vectors)
- No input validation at API boundaries
- No rate limiting on public endpoints
- No authentication/authorization checks on protected routes
- Rolling custom crypto or auth instead of using established libraries

### Structural Smells
- God endpoints: single routes doing 15+ things with 200+ lines
- Business logic in route handlers instead of service/domain layer
- Mixing concerns: validation, business logic, persistence, and HTTP response in one function
- No separation between request DTOs and internal domain models

## Core Principles

### 1. Fail Explicitly, Recover Gracefully
Errors are data, not exceptions to hide. Return meaningful error responses with machine-readable codes and human-readable messages. Use circuit breakers for external dependencies. Implement graceful degradation — serve stale cache when upstream fails, disable non-critical features rather than crashing entirely.

### 2. Validate at the Boundary, Trust Internally
Validate ALL external input (HTTP requests, queue messages, file uploads, webhooks) at the entry point using schema validation. Internal function calls between trusted modules should not re-validate. This keeps validation centralized and avoids redundant checks scattered through the codebase.

### 3. Design for Observability from Day One
Structured logging (JSON) with consistent fields. Request-scoped correlation IDs generated at the edge and propagated everywhere. Key business metrics (request rate, error rate, latency percentiles). Distributed tracing spans on every external call. If you can't observe it, you can't debug it in production.

### 4. Optimize for the Read Path
Most systems are read-heavy. Cache aggressively with clear invalidation strategies. Denormalize strategically for read performance. Use read replicas when appropriate. But always measure before optimizing — premature optimization wastes time and adds complexity.

### 5. Concurrency Is Not Optional
Race conditions, deadlocks, and lost updates happen in production. Use optimistic locking for contested resources. Implement idempotency keys for non-idempotent operations. Use atomic operations where possible. Test concurrent access paths.

### 6. Keep It Boring
Prefer well-understood, battle-tested patterns over clever abstractions. A straightforward if/else is better than a monad chain. A simple function is better than a class hierarchy. Code is read 10x more than written — optimize for the reader.

## Implementation Standards

Every piece of backend code should meet these minimums:

- **Every endpoint** defines its input validation schema
- **Every external call** has an explicit timeout
- **Every mutation** is idempotent or explicitly documented as non-idempotent
- **Every list endpoint** supports pagination
- **Every error response** includes a machine-readable code and human-readable message
- **Every database migration** is reversible and safe for zero-downtime deploys
- **Every background job** handles failure gracefully (retry with backoff, dead letter queue)
- **Every secret** comes from environment variables or a secrets manager, never from code

## Anti-Patterns to Actively Reject

| Do NOT | Do Instead |
|--------|-----------|
| Generic CRUD wrappers with no business value | Put business logic where it matters; skip unnecessary layers |
| Premature microservice extraction | Start as a well-structured monolith; extract when you have evidence |
| "Enterprise" patterns (Abstract factories, Visitor) in simple apps | Use the simplest pattern that solves the problem |
| Business logic in DB triggers/stored procedures | Keep logic in application code where it's testable and versionable |
| HTTP 200 for everything with error codes in the body | Use proper HTTP status codes (4xx for client errors, 5xx for server errors) |
| Catching all exceptions and swallowing silently | Handle specific errors, let unexpected ones bubble to error middleware |
| Building custom auth/crypto | Use established libraries (bcrypt, JWT libraries, OAuth providers) |
| String concatenation for queries | Parameterized queries, always |
| Fire-and-forget for async operations | Dead letter queues, retry policies, monitoring |
