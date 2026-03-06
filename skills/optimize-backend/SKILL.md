---
name: optimize-backend
description: Optimize backend performance. Detect N+1 queries, improve caching, tune connection pools, optimize database queries, reduce latency.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Find and fix performance bottlenecks. Measure → identify → fix → verify.

## Discover

Profile current performance to identify bottlenecks:

### Database
- **N+1 queries**: find queries inside loops (for each order, fetch user → N+1)
- **Missing indexes**: check foreign keys, commonly filtered columns, ORDER BY columns
- **Unbounded queries**: list endpoints without LIMIT, queries loading entire tables
- **SELECT ***: queries fetching all columns when only a few are needed
- **Sequential operations**: independent queries running sequentially instead of in parallel
- **ORM inefficiencies**: lazy loading triggering surprise queries, loading full objects for one field

### Caching
- **Repeated expensive queries**: same data fetched multiple times per request
- **Missing cache layer**: hot data read frequently from DB with no caching
- **Stale cache**: cached data with no invalidation strategy
- **Cache stampede risk**: popular keys with TTL but no protection against thundering herd

### Network
- **Synchronous external calls in request path**: APIs called synchronously when async would work
- **No connection pooling**: creating new connections per request (HTTP clients, DB)
- **Missing keep-alive**: HTTP client connections not reused
- **Large payloads**: full objects returned when subset would suffice

### Compute
- **Synchronous heavy computation**: CPU-intensive work blocking the event loop / request thread
- **Inefficient serialization**: converting full ORM objects instead of lean DTOs
- **Redundant processing**: same calculation done multiple times

## Plan

Prioritize by impact (biggest latency reduction first):

1. Fix N+1 queries (often the #1 bottleneck)
2. Add missing indexes
3. Add pagination to unbounded queries
4. Implement caching for hot paths
5. Parallelize independent operations
6. Tune connection pools
7. Optimize serialization

## Execute

### Fix N+1 Queries
- Use eager loading / JOINs to fetch related data in fewer queries
- Use IN clause for batch fetching: `WHERE id IN (:ids)`
- Use DataLoader pattern for GraphQL resolvers
- Replace loop queries with a single query + application-level mapping

### Add Indexes
- Index all foreign keys (if not already)
- Add composite indexes for common query patterns
- Consider covering indexes for hot queries
- Use CONCURRENTLY for index creation on large tables (Postgres)
- Use partial indexes for filtered queries (e.g., `WHERE status = 'active'`)

### Add Pagination
- Add cursor-based pagination for large/live datasets
- Add offset pagination for small/static datasets
- Set a maximum page size (100-200 items)
- Default page size: 20-50 items

### Implement Caching
- Cache expensive database aggregations (TTL-based)
- Cache external API responses (TTL matching API freshness requirements)
- Cache computed values that rarely change
- Use event-based invalidation for data that must be fresh
- Add cache stampede protection for popular keys

### Parallelize
- Run independent database queries in parallel (Promise.all / asyncio.gather / goroutines)
- Run independent external API calls in parallel
- Move non-critical work to background jobs (email, analytics, notifications)

### Tune Pools
- Database pool: `(2 * cpu_cores) + disks` per instance
- HTTP client: enable keep-alive, set max connections per host
- Monitor pool utilization — alert when consistently > 80%

### Optimize Serialization
- Return DTOs, not raw ORM objects (select only needed fields)
- Use sparse fieldsets (`?fields=id,name,status`) for flexible responses
- Consider binary formats (protobuf, msgpack) for high-throughput internal services

## Verify

After optimization:
- [ ] Query count per request is reasonable (< 10 for most endpoints)
- [ ] No queries inside loops
- [ ] All list endpoints are paginated with max limit enforced
- [ ] Hot paths have caching with clear invalidation strategy
- [ ] Independent operations run in parallel
- [ ] Connection pools are properly sized
- [ ] All tests still pass — no correctness regressions
- [ ] Measure latency improvement (p50, p95, p99)

## Anti-Patterns to Avoid

- Optimizing without measuring (guessing the bottleneck)
- Caching without an invalidation strategy (serving stale data)
- Adding indexes on every column (slows writes, wastes disk)
- Premature denormalization (normalize first, measure, then denormalize with evidence)
- Sacrificing correctness for speed (race conditions, stale reads where freshness matters)
- Over-optimizing cold paths (focus on hot paths that actually get traffic)
