---
name: harden-backend
description: Harden backend code with input validation, auth checks, rate limiting, error boundaries, and defensive programming patterns.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Improve the resilience of backend code by adding validation, error handling, rate limiting, and defensive patterns. Make the code survive real-world conditions.

## Discover

Map all entry points and boundaries:

1. **API endpoints**: every route handler — what input does it accept? Is it validated?
2. **Queue consumers**: every message handler — are messages validated before processing?
3. **Cron/scheduled jobs**: every scheduled task — do they handle failure?
4. **Webhook handlers**: every incoming webhook — are they verified (signatures)?
5. **File upload handlers**: any file processing — size limits? type validation?
6. **External API calls**: every outgoing HTTP call — timeouts? error handling?
7. **Database mutations**: every write operation — transactions? idempotency?

## Plan

Prioritize hardening by impact:

1. **Input validation at boundaries** — every endpoint validates request body, params, query
2. **Error boundaries** — middleware-level catch-all for unhandled errors
3. **Authentication/authorization gaps** — every protected route has checks
4. **Timeout on every external call** — database, HTTP, cache, queue
5. **Rate limiting** — on public endpoints, especially auth-related
6. **Idempotency** — on mutation endpoints that could be retried
7. **Graceful error responses** — consistent format, no leaked internals

## Execute

### Input Validation
- Add schema validation (Zod, Pydantic, Joi, etc.) to every endpoint that lacks it
- Validate: type, length, format, range — not just presence
- Return 422 with per-field errors for validation failures
- Validate path params and query params, not just request body

### Error Handling
- Add error boundary middleware that catches any unhandled error
- Return consistent error format: `{ error: { code, message, requestId } }`
- Log unexpected errors with full context (stack trace, request data, user ID)
- Never expose internal details in production (no stack traces, no SQL errors)
- Use specific HTTP status codes (see error-handling reference)

### Timeouts
- Add explicit timeout to every database query
- Add explicit timeout to every HTTP client call
- Add explicit timeout to every cache operation
- Ensure timeout hierarchy is coherent (inner < outer)

### Rate Limiting
- Add rate limiting middleware to public-facing endpoints
- Stricter limits on: login, signup, password reset, OTP verification
- Return 429 with `Retry-After` header
- Rate limit by: user ID (authenticated) or IP (unauthenticated)

### Idempotency
- Add idempotency key support to non-idempotent POST endpoints
- Or make operations naturally idempotent (upserts, SET operations)
- Document which endpoints are idempotent and which are not

### Webhook Verification
- Verify webhook signatures before processing
- Reject webhooks with expired timestamps
- Return 200 quickly, process async if needed

## Verify

After hardening:
- [ ] Every endpoint validates its input with a schema
- [ ] Error boundary middleware catches unhandled errors
- [ ] All error responses use consistent format
- [ ] All external calls have explicit timeouts
- [ ] Rate limiting is active on public endpoints
- [ ] No stack traces or SQL errors leak to clients in production
- [ ] All tests still pass

## Anti-Patterns to Avoid

- Over-validating internal function arguments (validate at the boundary, trust internally)
- Adding rate limiting to internal-only endpoints
- Catching errors and returning 200 with `{ success: false }`
- Adding retry logic to non-idempotent operations without idempotency keys
- Generic "Something went wrong" errors with no request ID for debugging
- Validation schemas that are too strict (rejecting valid input)
