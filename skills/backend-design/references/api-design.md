# API Design

## REST Conventions

### Resource Naming
- **Plural nouns**: `/users`, `/orders`, `/products` — not `/user`, `/getUsers`, `/createOrder`
- **No verbs in URLs**: the HTTP method IS the verb
- **Kebab-case**: `/order-items` not `/orderItems` or `/order_items`
- **Nested resources**: max 2 levels deep. `/users/:id/orders` is fine. `/users/:id/orders/:orderId/items/:itemId/variants` is not — flatten it.
- **Consistent**: pick conventions and apply them everywhere

### HTTP Methods
| Method | Semantics | Idempotent | Safe |
|--------|-----------|------------|------|
| GET | Read a resource | Yes | Yes |
| POST | Create a resource / trigger an action | No | No |
| PUT | Replace a resource entirely | Yes | No |
| PATCH | Partially update a resource | No* | No |
| DELETE | Remove a resource | Yes | No |

*PATCH is idempotent if you're setting fields to absolute values, not if incrementing.

### Status Codes for CRUD

| Operation | Success | Common Errors |
|-----------|---------|---------------|
| GET (single) | 200 | 404 |
| GET (list) | 200 (even if empty) | — |
| POST (create) | 201 + Location header | 409 (duplicate), 422 (validation) |
| PUT | 200 | 404, 409, 422 |
| PATCH | 200 | 404, 409, 422 |
| DELETE | 204 (no body) | 404 |

## Pagination

### Cursor-Based (preferred for most cases)
Best for: large datasets, real-time data, infinite scroll

```
GET /orders?cursor=eyJpZCI6MTAwfQ&limit=20

Response:
{
  "data": [...],
  "meta": {
    "cursor": "eyJpZCI6MTIwfQ",
    "hasMore": true
  }
}
```

Advantages: consistent results even when data changes, no performance degradation at high offsets.

### Offset-Based
Best for: small datasets, jump-to-page UIs

```
GET /orders?offset=40&limit=20

Response:
{
  "data": [...],
  "meta": {
    "total": 150,
    "offset": 40,
    "limit": 20
  }
}
```

Disadvantages: slow at high offsets (`OFFSET 10000` scans 10000 rows), inconsistent if data changes between pages.

### Rules
- **Always paginate list endpoints** — no exceptions
- **Default limit**: 20-50 items
- **Max limit**: 100-200 items (reject larger requests)
- **Return metadata**: total count (offset) or hasMore + cursor (cursor)

## Versioning

### URL Path Versioning (recommended)
```
/api/v1/users
/api/v2/users
```
Simple, explicit, easy to route. Most APIs use this.

### Header Versioning
```
Accept: application/vnd.myapi.v2+json
```
Cleaner URLs but harder to test (can't just change the URL in a browser).

### Deprecation
- Announce deprecation with `Deprecation` header and `Sunset` header (date)
- Maintain old versions for 6-12 months minimum
- Log usage of deprecated endpoints to track migration progress
- Provide migration guides

## Request/Response Conventions

### Consistent Envelope
Choose one format and use it everywhere:

```
// Success
{
  "data": { ... },
  "meta": { ... }
}

// Error
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "...",
    "details": [...]
  }
}
```

### Field Naming
- Pick one: `camelCase` (JavaScript) or `snake_case` (Python, Ruby) — be consistent
- Use `camelCase` for JSON APIs consumed by JavaScript clients
- Dates: ISO 8601 always (`2024-01-15T10:30:00Z`)
- Money: integer cents + currency code (`{ "amount": 1999, "currency": "USD" }`)
- IDs: strings (even if numeric internally) for forward-compatibility

### Filtering & Sorting
```
GET /orders?status=shipped&sort=-created_at&fields=id,status,total
```
- Filter: field=value query params
- Sort: field name, prefix `-` for descending
- Sparse fields: `fields` param to select specific fields (reduces payload)

## Idempotency

### Why It Matters
Network failures cause retries. Without idempotency, retries cause duplicate actions (double payments, duplicate messages, etc.).

### Implementation
- **GET, PUT, DELETE**: naturally idempotent
- **POST**: add an `Idempotency-Key` header
  - Client generates a unique key per operation
  - Server stores the key + response for a deduplication window (24-48 hours)
  - On duplicate key: return the stored response instead of re-executing

### Design Tips
- Make operations idempotent by design when possible (SET over INCREMENT)
- Use database unique constraints as a safety net
- Log duplicate detection for monitoring

## Bulk Operations

For operations on multiple resources:

```
POST /orders/bulk
{
  "operations": [
    { "action": "update", "id": "abc", "data": { "status": "shipped" } },
    { "action": "delete", "id": "def" }
  ]
}
```

### Partial Success
Return per-item results:
```
{
  "results": [
    { "id": "abc", "status": "success" },
    { "id": "def", "status": "error", "error": { "code": "NOT_FOUND" } }
  ],
  "summary": { "succeeded": 1, "failed": 1 }
}
```

Use HTTP 207 (Multi-Status) or 200 with partial results.

## Long-Running Operations

For operations that take > 5 seconds:

1. **Accept**: Return 202 Accepted with a job/operation URL
2. **Poll**: Client polls `GET /operations/:id` for status
3. **Complete**: Operation resource includes result when done

```
POST /reports/generate → 202 { "operationId": "op_123", "status": "pending" }
GET /operations/op_123 → 200 { "status": "running", "progress": 45 }
GET /operations/op_123 → 200 { "status": "completed", "result": { "url": "..." } }
```

Alternative: webhooks for completion notification.

## GraphQL Considerations

When to use GraphQL over REST:
- Clients need flexible, nested data fetching
- Multiple client types with different data needs (mobile vs web)
- Rapidly evolving schema

Watch out for:
- **N+1 in resolvers**: use DataLoader pattern to batch database calls
- **Query complexity**: set depth limits and complexity scoring to prevent abuse
- **Authorization**: must be in resolvers, not just at the gateway
- **Caching**: harder than REST (no HTTP caching by default)

## Anti-Patterns

- Verbs in URLs (`/getUser`, `/createOrder`, `/deleteItem`)
- Inconsistent naming (`/users` but `/get-products` but `/OrderList`)
- Deeply nested URLs (> 2 levels)
- Returning 200 for every response with error codes in the body
- No pagination on list endpoints
- No versioning strategy
- Inconsistent date formats (mixing timestamps, strings, epochs)
- Returning database IDs as integers (prevents migration to UUIDs later)
- Returning full nested objects when IDs would suffice (overfetching by default)
- No rate limiting on public endpoints
