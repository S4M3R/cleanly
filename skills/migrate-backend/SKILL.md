---
name: migrate-backend
description: Review database migrations for safety. Zero-downtime compatibility, reversibility, data preservation, and index impact.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Review database migrations for production safety. Ensure zero-downtime compatibility, reversibility, and data integrity.

## Discover

1. **Pending migrations**: Read all pending/new migration files
2. **Current schema**: Understand the current database state
3. **Deployment strategy**: Rolling deploy? Blue-green? Does old code run alongside new code?
4. **Table sizes**: Are affected tables large (> 1M rows)? This affects lock duration.
5. **Active queries**: What queries hit the affected tables? Will they break?

## Assess Each Migration

### Zero-Downtime Compatibility
During a rolling deploy, both old code (v1) and new code (v2) run against the same database. Every migration must be safe for both versions.

**Ask**: Can v1 code work correctly against the new schema?

### Safe Operations (apply freely)
- `ADD COLUMN` (nullable, or with a DEFAULT value)
- `CREATE TABLE`
- `CREATE INDEX CONCURRENTLY` (Postgres — does not lock the table)
- `ADD CONSTRAINT ... NOT VALID` (Postgres — validates later without lock)

### Unsafe Operations (need expand-contract pattern)

| Operation | Risk | Safe Alternative |
|-----------|------|-----------------|
| `DROP COLUMN` | v1 code still reads it | Deploy v2 (stops reading), THEN drop in next migration |
| `RENAME COLUMN` | v1 code uses old name | Add new column → backfill → deploy v2 → drop old column |
| `ALTER COLUMN TYPE` | May lock table, may fail | Add new column → backfill → deploy v2 → drop old |
| `ADD NOT NULL` (no default) | Fails for existing NULL rows | Add default → backfill NULLs → add constraint |
| `CREATE INDEX` (non-concurrent) | Locks table for writes | Use `CREATE INDEX CONCURRENTLY` |
| `DROP TABLE` | v1 code still queries it | Deploy v2 (stops querying), THEN drop |

### Data Preservation
- Does this migration lose data? (Dropping columns, changing types, truncation)
- Is there a backfill needed? (New column derived from existing data)
- Is the backfill idempotent? (Safe to re-run if it fails mid-way)

### Reversibility
- Is there a down/rollback migration?
- Does the rollback actually work? (Test it)
- Is the rollback safe? (Won't lose data added after the up migration)

### Lock Impact
- For large tables: does this migration acquire exclusive locks?
- How long will the lock be held? (On a 10M row table, ALTER COLUMN can lock for minutes)
- Can we do this during a maintenance window, or must it be zero-downtime?

## Plan

For each issue found, recommend the safe approach:

### Expand-Contract Pattern (for renames, type changes, drops)
```
Migration 1 (expand): Add new column, add dual-write logic
Deploy v2:            Code writes to both old and new, reads from new
Migration 2:          Backfill old rows to new column
Migration 3 (contract): Drop old column (after confirming no readers)
```

### Large Table Operations
```
-- Instead of:
CREATE INDEX idx_orders_user_id ON orders(user_id);  -- LOCKS TABLE

-- Use:
CREATE INDEX CONCURRENTLY idx_orders_user_id ON orders(user_id);  -- NO LOCK
```

### Backfill Pattern
```sql
-- Process in batches to avoid long locks
UPDATE orders SET new_column = old_column
WHERE new_column IS NULL
AND id > :last_processed_id
ORDER BY id
LIMIT 10000;
```

## Report

Generate a migration safety report:

```
# Migration Safety Report

## Migration: 20240115_add_user_email_index
✅ SAFE — Creates index concurrently, no lock

## Migration: 20240115_rename_user_name_to_full_name
❌ UNSAFE — Column rename breaks v1 code
**Recommendation**: Use expand-contract pattern (3 migrations instead of 1)

## Migration: 20240115_add_not_null_to_status
⚠️ CAUTION — Existing rows may have NULL values
**Recommendation**: Backfill NULLs first, then add constraint with NOT VALID + VALIDATE
```

## Anti-Patterns to Avoid

- Dropping columns in the same deploy that stops using them
- Adding NOT NULL without a default on a populated table
- Non-concurrent index creation on large tables
- Mixing schema changes and data backfills in one migration
- Renaming columns directly (use expand-contract)
- Not testing down migrations
- Running data backfills that touch every row in a single transaction
- Assuming migration will be fast because "it's just one column" (table size matters)
