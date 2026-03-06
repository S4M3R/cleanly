---
name: audit-backend
description: Comprehensive backend code quality audit across security, performance, reliability, and observability. Produces a findings report without making changes.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Perform a read-only audit of backend code quality. Generate a findings report with severity ratings and remediation recommendations. **Do NOT modify any code.**

## Discover

Scan the codebase systematically:

1. **API endpoints**: List all routes, their methods, validation, auth checks
2. **Database access**: Find all queries, check for N+1 patterns, missing indexes, raw SQL
3. **Error handling**: How are errors caught, formatted, and returned? Any swallowed exceptions?
4. **Authentication/Authorization**: Are all protected routes actually protected? Row-level security?
5. **Input validation**: Are all endpoints validating input? What library? Any gaps?
6. **Secrets**: Any hardcoded credentials, API keys, or tokens in code?
7. **Logging**: Structured? Correlation IDs? Sensitive data being logged?
8. **Tests**: Coverage patterns, what's tested vs not, test quality
9. **Dependencies**: Outdated packages, known vulnerabilities
10. **Configuration**: Environment variable usage, defaults, missing docs

## Assess Across 6 Dimensions

### 1. Security
- Input validation coverage
- SQL injection vectors (string concatenation in queries)
- Authentication gaps (unprotected endpoints)
- Authorization gaps (missing row-level checks)
- Secrets in code or config files
- CORS configuration
- Rate limiting on sensitive endpoints
- Security headers

### 2. Performance
- N+1 query patterns (queries inside loops)
- Missing database indexes (check foreign keys especially)
- Unbounded queries (no LIMIT/pagination)
- Missing caching opportunities
- Synchronous external calls that could be async
- Connection pool configuration
- SELECT * usage

### 3. Reliability
- Error handling completeness (are all external calls wrapped?)
- Timeout configuration (do all external calls have timeouts?)
- Retry logic for transient failures
- Circuit breakers for external dependencies
- Graceful shutdown handling
- Idempotency of mutations
- Transaction usage for multi-step operations

### 4. Observability
- Structured logging (JSON vs unstructured strings)
- Correlation ID implementation
- Metrics collection (request rate, error rate, latency)
- Health check endpoints
- Error tracking / alerting setup
- Sensitive data in logs

### 5. Data Integrity
- Migration safety (zero-downtime compatible?)
- Foreign key constraints
- Unique constraints where needed
- Transaction boundaries
- Optimistic locking for concurrent access
- Soft delete implementation (if used)

### 6. Code Quality
- Naming consistency
- Dead code / unused imports
- Code duplication
- Separation of concerns (business logic vs HTTP handling)
- Complexity (god functions, deeply nested logic)
- TODO/FIXME/HACK markers

## Report

Generate a structured report:

```
# Backend Audit Report

## Summary
- **Critical**: N issues
- **High**: N issues
- **Medium**: N issues
- **Low**: N issues
- **Positive findings**: N patterns

## Critical Issues
### [SECURITY] SQL injection in user search
- **File**: src/routes/users.ts:45
- **Impact**: Allows arbitrary SQL execution via search parameter
- **Remediation**: Use parameterized query. Run `/secure-backend` to address.

## High Issues
...

## Positive Findings
- ✓ All endpoints use input validation via Zod
- ✓ Structured logging with correlation IDs
- ✓ Database migrations are reversible

## Recommended Actions
1. Run `/secure-backend` to address 3 security issues
2. Run `/optimize-backend` to fix N+1 queries
3. Run `/observe-backend` to add missing metrics
```

### Severity Definitions

| Severity | Criteria |
|----------|----------|
| **Critical** | Security vulnerability, data loss risk, or production-breaking issue |
| **High** | Performance degradation, reliability risk, or significant code quality issue |
| **Medium** | Best practice violation, missing observability, or maintainability concern |
| **Low** | Style inconsistency, minor optimization opportunity, nice-to-have improvement |

## Constraints

- **Read-only**: do NOT modify any code
- **Specific**: cite file:line, not vague observations
- **Prioritized**: most critical issues first
- **Actionable**: every finding includes a remediation recommendation
- **Balanced**: celebrate good patterns, not just problems
- **Honest**: if the codebase is in good shape, say so — don't invent issues
