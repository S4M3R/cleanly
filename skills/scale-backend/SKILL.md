---
name: scale-backend
description: Identify scalability bottlenecks and assess horizontal scaling readiness. Statelessness, database bottlenecks, queue capacity, cache strategy.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Assess whether the backend can scale horizontally and identify bottlenecks that will break under load.

## Discover

### Statelessness Check
- Is there in-process state? (in-memory caches, session stores, uploaded files stored locally)
- Can the app run behind a load balancer with multiple instances?
- Does it use sticky sessions? (symptom of stateful design)
- Are background jobs tied to a specific instance?

### Database Bottlenecks
- Single database instance for all reads and writes?
- Connection pool sizing: at N instances × pool_size connections, does the DB hit max_connections?
- Write-heavy tables that will contend under load?
- Large tables that will slow down without partitioning?

### Cache Architecture
- In-process cache only? (each instance has its own cache — inconsistent, duplicated)
- Distributed cache (Redis)? Properly configured?
- Cache invalidation working across instances?

### Queue / Background Jobs
- Single worker instance? (can it scale?)
- Job locking: will multiple instances process the same job?
- Queue depth monitoring: will it grow unbounded under load?

### External Dependencies
- Rate-limited external APIs that cap throughput?
- Shared resources (file system, local storage) that don't work multi-instance?
- DNS resolution caching for external services?

### Data Volume
- Tables growing unbounded? (no archival strategy)
- Logs and events accumulating? (storage costs, query performance)
- Large file storage strategy? (object storage vs database)

## Plan

Categorize findings:

1. **Blockers**: things that MUST change before scaling (in-process state, file system dependency)
2. **Bottlenecks**: things that will slow down under load (single DB, no caching, N+1 queries)
3. **Risks**: things that might break at scale (connection pool limits, rate-limited APIs)
4. **Ready**: things that already work at scale (stateless services, distributed cache, queues)

## Execute

### Externalize State
- Move in-memory sessions to Redis or database
- Move file uploads to object storage (S3, GCS)
- Move in-process cache to Redis (or add distributed cache layer)
- Ensure no local file system dependencies for application data

### Database Scaling
- **Read replicas**: route read queries to replicas, writes to primary
- **Connection pooling**: use a connection pooler (PgBouncer, ProxySQL) between app and DB
- **Query optimization**: fix N+1s, add indexes, optimize slow queries (do this BEFORE scaling hardware)
- **Partitioning**: for very large tables, partition by date or tenant

### Queue Scaling
- Ensure multiple workers can process from the same queue safely
- Add distributed locking for jobs that must not run concurrently
- Monitor consumer lag and auto-scale workers based on queue depth
- Implement backpressure (reject or slow producers when consumers can't keep up)

### Caching Strategy
- Add distributed cache for hot read paths
- Cache invalidation that works across all instances
- Consider multi-level caching: L1 (in-process, short TTL) → L2 (Redis, longer TTL)
- Cache stampede protection for popular keys

### Graceful Operations
- Graceful shutdown: finish in-flight requests before stopping
- Health checks: liveness + readiness for load balancer integration
- Connection draining: stop accepting new connections, finish existing ones
- Rolling deploys: ensure new and old versions can coexist

## Verify

- [ ] Application runs correctly with 2+ instances behind a load balancer
- [ ] No data corruption under concurrent access
- [ ] No in-process state that's lost on restart
- [ ] Connection pool total across all instances fits within DB max_connections
- [ ] Health checks support load balancer integration
- [ ] Background jobs don't double-process with multiple workers
- [ ] Cache is consistent across instances

## Anti-Patterns to Avoid

- In-process caching as the only cache layer with multiple instances (inconsistent)
- Assuming a single database will scale forever
- Sticky sessions as a substitute for statelessness (fragile, uneven load distribution)
- Forgetting database connection limits when adding instances (10 instances × 20 connections = 200)
- Scaling hardware before optimizing queries (throwing money at a bad query)
- No graceful shutdown (kill -9 drops in-flight requests)
- No monitoring on queue depth (queues grow silently until everything breaks)
