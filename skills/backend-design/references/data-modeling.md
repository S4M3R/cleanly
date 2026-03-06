# Data Modeling & Schema Design

## Schema Design Principles

- **Start normalized** (3NF) — denormalize with measurement, not intuition
- **Every table gets**: `id`, `created_at`, `updated_at` at minimum
- **Use timestamps with timezone** — always (`timestamptz` in Postgres, UTC storage elsewhere)
- **Never store monetary values as floats** — use integer cents or decimal types

## Naming Conventions

Pick one convention and apply it everywhere:

### SQL (Recommended)
- Table names: plural, snake_case (`order_items`, not `OrderItem` or `orderItems`)
- Column names: snake_case (`created_at`, `user_id`)
- Foreign keys: `<singular_table>_id` (`user_id`, `order_id`)
- Indexes: `idx_<table>_<columns>` (`idx_orders_user_id_created_at`)
- Unique constraints: `uq_<table>_<columns>` (`uq_users_email`)

### General Rules
- Be consistent — the worst convention is an inconsistent one
- Avoid abbreviations (`usr`, `qty`) — use full words (`user`, `quantity`)
- Avoid reserved words as column names (`order`, `user`, `group`)

## Data Types

### IDs
- **UUIDs**: globally unique, no coordination needed, safe for distributed systems. Downside: larger (16 bytes), worse index locality.
- **Auto-increment integers**: smaller, better index performance, sequential. Downside: exposes ordering, doesn't work for distributed ID generation.
- **ULID/KSUID**: sorted UUIDs — get global uniqueness AND index locality.
- **Recommendation**: UUIDs for public-facing IDs, auto-increment for internal primary keys if performance matters. Always expose IDs as strings in APIs.

### JSON Columns (JSONB)
When to use:
- Schema-less metadata that varies per record
- Configuration blobs
- Event payloads where the schema evolves

When NOT to use:
- Data you need to query/filter/join on frequently — normalize it
- Data with a fixed, known schema — use proper columns
- Relational data that belongs in its own table

### Enums
- **Database enums**: type-safe but hard to modify (ALTER TYPE is awkward)
- **Lookup tables**: more flexible, foreign key constraints, easier to add values
- **String columns with CHECK constraint**: simple, works well for small sets
- **Recommendation**: CHECK constraints for stable, small sets. Lookup tables for evolving sets.

## Index Strategy

### When to Index
- Foreign keys (always — prevents full table scans on JOINs)
- Columns used in WHERE clauses frequently
- Columns used in ORDER BY
- Columns used in unique constraints

### When NOT to Index
- Small tables (< 1000 rows) — full scan is fine
- Columns with low cardinality (boolean, status with 3 values) — unless combined in a composite index
- Write-heavy columns where read performance doesn't matter

### Composite Indexes
Column order matters:
1. **Equality columns first** (WHERE status = 'active')
2. **Range columns last** (WHERE created_at > '2024-01-01')
3. Most selective column first within equality columns

Example: `CREATE INDEX idx_orders_status_created ON orders(status, created_at)`
- Supports: `WHERE status = 'active' AND created_at > ...` ✓
- Supports: `WHERE status = 'active'` ✓
- Does NOT support: `WHERE created_at > ...` alone ✗

### Covering Indexes
Include all columns needed by a query to avoid hitting the table:
```sql
CREATE INDEX idx_orders_covering ON orders(user_id, status) INCLUDE (total, created_at)
```

### Partial Indexes
Index only rows that matter:
```sql
CREATE INDEX idx_orders_pending ON orders(created_at) WHERE status = 'pending'
```
Smaller index, faster queries for the specific case.

## Migration Safety

### Zero-Downtime Rules

During a rolling deploy, both old and new code run simultaneously. Migrations must be safe for both versions.

**Safe operations:**
- Add a new column (nullable or with default)
- Add a new table
- Add a new index (CONCURRENTLY)
- Add a new constraint (NOT VALID initially, then validate separately)

**Unsafe operations — use expand-contract pattern:**
- Rename a column → add new column, backfill, deploy code that reads both, drop old column
- Change a column type → same expand-contract
- Drop a column → stop writing in one deploy, drop in the next
- Add NOT NULL → add with default first, backfill, then add constraint

**Never in a single migration:**
- Drop a column that code still references
- Rename a column without the expand-contract pattern
- Add NOT NULL without a default value on an existing column
- Create a regular (non-concurrent) index on a large table (locks the table)

### Data Migrations
- Separate from schema migrations — different files, different execution
- Backfill in batches (1000-10000 rows per batch) to avoid locking
- Make backfills idempotent (safe to re-run)
- Test on a copy of production-sized data before running in production

## Relationships

### Soft Deletes
Tradeoffs:
- **Pro**: Audit trail, easy undo, referential integrity preserved
- **Con**: Every query needs `WHERE deleted_at IS NULL`, complicates unique constraints, data accumulates
- **Recommendation**: Use sparingly. Most data can be hard-deleted. Use soft deletes for compliance requirements or when undo is a core feature. Add a partial index for `WHERE deleted_at IS NULL`.

### Polymorphic Associations
```
-- Approach 1: polymorphic columns (simpler, no FK enforcement)
comments: { commentable_type: "Post", commentable_id: 123 }

-- Approach 2: separate junction tables (FK enforcement, more tables)
post_comments: { post_id, comment_id }
order_comments: { order_id, comment_id }
```
Prefer separate tables when referential integrity matters. Use polymorphic columns for simple cases where you accept the tradeoff.

## Connection Pooling

### Sizing Rule of Thumb
```
pool_size = (2 * cpu_cores) + number_of_disks
```
For a 4-core machine with SSD: ~10 connections.

### Rules
- Set pool minimum (warm connections ready) and maximum
- Set connection timeout (how long to wait for a free connection)
- Set idle timeout (return idle connections to prevent stale connections)
- Monitor pool utilization — if consistently near max, the bottleneck is the database, not the pool

## Query Performance

### EXPLAIN ANALYZE
Always analyze slow queries:
```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT ...
```
Look for:
- Sequential scans on large tables (missing index)
- Nested loops with high row counts (N+1 at the DB level)
- Sort operations on large result sets (add an index for ORDER BY)
- High buffer reads (query touches too much data)

## Anti-Patterns

- No indexes on foreign keys
- Using `SELECT *` — select only needed columns
- Storing money as floats (0.1 + 0.2 ≠ 0.3)
- No `created_at`/`updated_at` timestamps
- Polymorphic foreign keys without validation
- Running non-concurrent `CREATE INDEX` on large tables in production
- Mixing schema and data changes in one migration
- No connection pooling (new connection per request)
- Storing files/blobs in the database (use object storage, store the URL)
- Using auto-increment IDs in public APIs (exposes ordering and count)
