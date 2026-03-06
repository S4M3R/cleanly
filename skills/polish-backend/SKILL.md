---
name: polish-backend
description: Clean up backend code. Consistent naming, remove dead code, align patterns, improve readability, standardize error handling and response formats.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Final quality pass for backend code. Fix naming, remove dead code, align patterns, improve readability. No behavior changes — only clarity and consistency.

## Discover

Scan for inconsistencies and code quality issues:

1. **Naming**: Inconsistent conventions (camelCase mixed with snake_case, singular mixed with plural)
2. **Dead code**: Unused functions, unreachable code paths, commented-out blocks, unused imports
3. **Duplication**: Same logic copy-pasted across multiple files
4. **Response formats**: Some endpoints return `{ data }`, others return bare objects, others wrap in `{ success, data }`
5. **Error handling**: Some endpoints use error middleware, others catch inline, some swallow errors
6. **File organization**: Related code scattered across unrelated directories
7. **Magic values**: Hardcoded strings, numbers, URLs without named constants
8. **Comments**: Outdated comments, TODO/FIXME/HACK markers, obvious comments (`// get user`)
9. **Imports**: Unused imports, inconsistent import ordering
10. **Types**: Missing type annotations (TypeScript `any`, Python missing hints), inconsistent type usage

## Plan

Group changes to minimize review complexity:

1. **Naming standardization** — rename for consistency (files, functions, variables, routes)
2. **Dead code removal** — delete unused functions, imports, commented-out code
3. **Pattern alignment** — standardize response format, error handling, validation approach
4. **Magic value extraction** — named constants for repeated values
5. **Comment cleanup** — remove outdated/obvious comments, update TODOs
6. **Import cleanup** — remove unused, organize consistently

## Execute

### Naming
- Pick one convention and apply everywhere: camelCase for JS/TS, snake_case for Python/Ruby/Go
- Route paths: kebab-case, plural nouns (`/order-items`, not `/orderItem` or `/order_item`)
- File names: match the project convention (if most files are kebab-case, use kebab-case)
- Database columns: match the ORM convention or project standard
- Be consistent within each layer — don't mix conventions

### Dead Code
- Delete unused functions (check for dynamic usage / reflection before deleting)
- Delete commented-out code blocks (git has history if you need it)
- Delete unused imports
- Delete unused variables
- Delete empty catch blocks (either handle the error or let it propagate)

### Response Format
- Standardize across all endpoints:
  ```
  Success: { "data": ... }  or  { "data": ..., "meta": { ... } }
  Error:   { "error": { "code": "...", "message": "..." } }
  ```
- Ensure all list endpoints return the same pagination structure
- Ensure all error responses use the same format

### Error Handling
- All endpoints should use the same error handling pattern (middleware-based, not inline try/catch per route)
- Custom error classes for domain errors (NotFoundError, ValidationError, etc.)
- Error middleware maps custom errors to HTTP status codes
- No inline `try/catch` that returns error responses directly in route handlers

### Constants
- Extract magic strings: status values, error codes, config keys
- Extract magic numbers: timeouts, limits, thresholds
- Group related constants: `ORDER_STATUS.PENDING`, `ORDER_STATUS.SHIPPED`

## Verify

- [ ] Naming is consistent across the codebase
- [ ] No unused imports, functions, or variables
- [ ] All endpoints use the same response format
- [ ] All endpoints use the same error handling pattern
- [ ] No commented-out code blocks
- [ ] No magic values (hardcoded strings/numbers used in multiple places)
- [ ] All tests pass — no functional changes
- [ ] Git diff shows only cleanup, no behavior changes

## Anti-Patterns to Avoid

- Refactoring and changing behavior at the same time (separate concerns)
- Renaming public API fields without a migration plan (breaks clients)
- Removing "dead" code that is used via reflection, dynamic dispatch, or external tools
- Over-commenting (don't add JSDoc to every function — only complex ones)
- Bikeshedding on naming when there's a bigger issue to solve
- Introducing a new pattern to "standardize" when the existing pattern works fine
