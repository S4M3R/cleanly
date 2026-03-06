# Performance & Scalability

## First Rule: Measure Before Optimizing

Premature optimization wastes time and adds complexity. Before changing anything:

1. **Identify the bottleneck** — is it CPU, memory, I/O, network, or database?
2. **Measure the baseline** — current latency (p50, p95, p99), throughput, error rate
3. **Set a target** — "p95 latency under 200ms" not "make it faster"
4. **Optimize the bottleneck** — not everything, just the hot path
5. **Measure after** — verify the improvement, check for regressions

Tools: APM (Datadog, New Relic), flame graphs, database query analyzers, load testing (k6, wrk).

## N+1 Query Detection

### The Pattern
```
# WRONG: 1 query for orders + N queries for users
orders = db.query("SELECT * FROM orders LIMIT 20")
for order in orders:
    user = db.query("SELECT * FROM users WHERE id = ?", order.user_id)
```
This executes 21 queries instead of 1-2.

### Solutions
1. **JOIN**: single query with all needed data
   ```sql
   SELECT o.*, u.name FROM orders o JOIN users u ON o.user_id = u.id LIMIT 20
   ```

2. **Eager loading / IN clause**: 2 queries
   ```sql
   SELECT * FROM orders LIMIT 20
   SELECT * FROM users WHERE id IN (1, 2, 3, ...)
   ```

3. **DataLoader pattern** (GraphQL): batch and deduplicate within a request

### How to Detect
- Log query count per request in development
- Set a threshold alert (> 10 queries per request = investigate)
- Use ORM query logging / debugging tools
- Review any code that queries inside a loop

## Caching Strategy

### Cache Hierarchy
1. **L1: In-process** (language-level cache, LRU) — fastest, per-instance, lost on restart
2. **L2: Distributed** (Redis, Memcached) — shared across instances, survives restarts
3. **L3: CDN** (Cloudflare, CloudFront) — edge caching for static/semi-static content

### Cache Invalidation Strategies

| Strategy | How | Best For |
|----------|-----|----------|
| **TTL** | Expire after N seconds | Data that can be slightly stale (product listings) |
| **Event-based** | Invalidate on write | Data that must be fresh (user profile after update) |
| **Write-through** | Write to cache and DB simultaneously | Read-heavy data with frequent writes |
| **Write-behind** | Write to cache, async flush to DB | High write throughput (analytics, counters) |

### Cache Stampede Prevention
When a popular cache key expires, many requests hit the DB simultaneously.

Solutions:
- **Locking**: first request acquires a lock and refreshes; others wait or get stale data
- **Probabilistic early expiration**: refresh before TTL expires with increasing probability
- **Background refresh**: a separate process refreshes cache before expiry

### What to Cache
- Database query results (especially expensive aggregations)
- External API responses
- Computed values (rendered templates, formatted data)
- Configuration and feature flags

### What NOT to Cache
- Frequently changing data without an invalidation strategy
- User-specific data without careful key design (cache pollution)
- Large objects that rarely hit (waste of memory)
- Security-sensitive data (sessions, tokens) in non-secure caches

### Cache Key Design
- Include all query parameters: `orders:user_123:status_active:page_2`
- Include version for invalidation: `v3:products:abc123`
- Use consistent hashing for sharded caches

## Connection Pooling

### Database
- Pool size: `(2 * cpu_cores) + disks` per instance
- At 10 instances with pool_size=10: 100 connections → check DB max_connections
- Monitor: pool wait time, active connections, idle connections

### HTTP Clients
- Enable keep-alive for repeated calls to the same service
- Set max connections per host
- Set idle timeout to reclaim unused connections
- Share client instances (don't create per request)

## Query Optimization

### Index Usage
```sql
-- Check if your query uses indexes
EXPLAIN (ANALYZE) SELECT * FROM orders WHERE user_id = 123 AND status = 'active'
```

Look for:
- `Seq Scan` on large tables → missing index
- `Sort` without index → add index for ORDER BY column
- `Hash Join` vs `Nested Loop` → for large joins, hash is usually better

### Common Optimizations
- **SELECT only needed columns** — not `SELECT *`
- **Use LIMIT** — even for counts, consider approximate counts for large tables
- **Batch operations** — INSERT/UPDATE many rows at once, not in a loop
- **Avoid correlated subqueries** — rewrite as JOINs
- **Use EXISTS instead of COUNT** when checking for existence
- **Denormalize for hot read paths** — precompute aggregates, store redundant data

## Async Processing

Move work out of the request path when possible:

| Synchronous (in request) | Asynchronous (background) |
|--------------------------|--------------------------|
| Input validation | Email/notification sending |
| Core business logic | Report generation |
| Database reads/writes | Image/file processing |
| Auth checks | Analytics events |
| | Webhook delivery |
| | Cache warming |

### Benefits
- Lower response latency for the user
- Better error isolation (background failure doesn't fail the request)
- Natural retry mechanism (queue + dead letter)

## Serialization

- **API responses**: use DTOs/view models, not raw ORM objects (exposes internal schema, N+1 risk from lazy loading)
- **Internal services**: consider binary formats (protobuf, msgpack) for high-throughput paths
- **Avoid serializing what you don't need**: if the client needs 3 fields, don't send 30

## Load Testing

Before scaling, understand current limits:

1. **Baseline**: what's the current throughput and latency?
2. **Stress test**: at what load does latency degrade? Where does it break?
3. **Soak test**: does performance degrade over hours? (memory leaks, connection leaks)
4. **Spike test**: how does the system handle sudden traffic bursts?

## Anti-Patterns

- Optimizing without measuring (guessing the bottleneck)
- Caching without invalidation strategy (serving stale data indefinitely)
- N+1 queries hidden in ORM lazy loading
- Unbounded queries (no LIMIT, loading entire tables)
- Synchronous external calls in the request path when async would work
- Creating new DB connections per request instead of pooling
- Loading full ORM objects when you need one field
- Premature denormalization (normalize first, denormalize with evidence)
- Over-indexing (every index slows writes and uses disk)
- Ignoring p99 latency (averages hide tail latency that affects real users)
