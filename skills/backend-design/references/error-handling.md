# Error Handling & Resilience

## Error Taxonomy

Distinguish between two fundamentally different kinds of errors:

**Operational errors** — expected failures that happen in normal operation:
- Validation failures (bad input)
- Resource not found (404)
- Authentication/authorization failures
- Timeouts on external calls
- Rate limiting
- Upstream service unavailable

These are NOT bugs. Handle them explicitly with proper status codes and messages.

**Programmer errors** — unexpected bugs in the code:
- Null reference / undefined access
- Type errors
- Assertion failures
- Unhandled promise rejections

These ARE bugs. Log them with full context, return a generic 500 to the client, and fix the root cause.

## Error Response Format

Use a consistent error response structure across all endpoints:

```
{
  "error": {
    "code": "VALIDATION_FAILED",       // Machine-readable, stable, documented
    "message": "Email format is invalid", // Human-readable, localizeable
    "details": [                        // Optional: field-level errors
      { "field": "email", "message": "Must be a valid email address" }
    ],
    "requestId": "req_abc123"           // For debugging — matches correlation ID in logs
  }
}
```

Rules:
- `code` is a stable string enum — clients switch on this, never on `message`
- `message` is for humans — can change without breaking clients
- `details` is for validation errors with per-field feedback
- `requestId` ties the error to server-side logs

## HTTP Status Codes — Precise Usage

| Code | Meaning | When to Use |
|------|---------|-------------|
| 400 | Bad Request | Malformed JSON, missing required headers, unparseable body |
| 401 | Unauthorized | No authentication provided, or token expired/invalid |
| 403 | Forbidden | Authenticated but lacks permission for this resource |
| 404 | Not Found | Resource doesn't exist (or user lacks permission to know it exists) |
| 409 | Conflict | Optimistic locking failure, duplicate resource, state conflict |
| 422 | Unprocessable Entity | Valid JSON but fails business validation (invalid email, etc.) |
| 429 | Too Many Requests | Rate limit exceeded — include `Retry-After` header |
| 500 | Internal Server Error | Unexpected bug — never expose internals to client |
| 502 | Bad Gateway | Upstream service returned an invalid response |
| 503 | Service Unavailable | Overloaded or in maintenance — include `Retry-After` header |
| 504 | Gateway Timeout | Upstream service timed out |

**Common mistakes:**
- Using 400 for validation errors (use 422)
- Using 401 when you mean 403
- Using 200 with an error code in the body
- Using 500 for expected failures like "user not found"

## Retry Strategies

### Exponential Backoff with Jitter
For transient failures (5xx, timeouts, connection errors):

```
delay = min(base * 2^attempt + random_jitter, max_delay)
```

- Base delay: 100-500ms
- Max delay: 30-60s
- Max attempts: 3-5
- Jitter: random 0-100% of calculated delay (prevents thundering herd)

### Retry Budget
Limit total retry traffic to avoid cascading failures:
- Track retry ratio (retries / total requests)
- Stop retrying when ratio exceeds threshold (e.g., 10%)
- This prevents retry storms when an upstream is genuinely down

### What Is Retryable

| Retryable | NOT Retryable |
|-----------|---------------|
| 500, 502, 503, 504 | 400, 401, 403, 404, 409, 422 |
| Connection timeout | Read timeout (sometimes) |
| Connection refused | SSL errors |
| DNS resolution failure | Authentication failure |

## Circuit Breakers

Prevent cascading failures when an upstream dependency is down.

**Three states:**
1. **Closed** (normal): requests flow through. Track failure rate.
2. **Open** (tripped): all requests immediately fail with a fallback. No calls to upstream.
3. **Half-open** (testing): allow a single request through. If it succeeds, close the circuit. If it fails, re-open.

**Configuration:**
- Failure threshold: 50% failures over last 10 requests → open
- Open duration: 30-60 seconds before trying half-open
- Success threshold in half-open: 3 consecutive successes → close

**Fallback behaviors:**
- Return cached/stale data with a warning
- Return a degraded response (fewer features)
- Return an honest error: "This feature is temporarily unavailable"
- Queue the operation for later processing

## Timeout Hierarchy

Every timeout in the system must form a coherent hierarchy:

```
Load balancer timeout (60s)
  > Server request timeout (30s)
    > Database query timeout (10s)
    > HTTP client timeout (5s)
    > Cache read timeout (1s)
```

**Rules:**
- Outer timeouts must be longer than inner timeouts
- Every external call MUST have an explicit timeout — never rely on defaults (which are often infinite)
- Document timeout values and their rationale
- Monitor timeout rates — a spike indicates a problem

## Error Boundaries

Implement middleware-level error handling that catches unhandled errors:

1. **Catch-all middleware** at the top of the stack catches any unhandled error
2. Log the full error with stack trace, request context, and correlation ID
3. Return a generic 500 response — NEVER expose stack traces, SQL errors, or internal paths to clients
4. In development: include error details for debugging
5. In production: generic message + requestId for support

## Graceful Degradation

When a dependency fails, degrade rather than crash:

- **Cache layer fails**: bypass cache, hit database directly (slower but functional)
- **Search service fails**: fall back to basic database query
- **Recommendation engine fails**: show popular items instead
- **Email service fails**: queue emails for retry, acknowledge the request
- **Payment processor fails**: show "try again later", don't lose the cart

The key: identify which features are critical (must work) vs. nice-to-have (can degrade).

## Anti-Patterns

- Catching all exceptions with a bare `catch` and ignoring them
- Returning 200 OK with `{ "success": false, "error": "..." }` in the body
- Exposing stack traces or SQL errors in production responses
- No timeout on database queries (one slow query blocks the connection pool)
- Retrying non-idempotent operations (retrying a payment = double charge)
- Treating all errors the same way (logging 404s as errors creates noise)
- Using generic "Something went wrong" messages with no requestId for debugging
