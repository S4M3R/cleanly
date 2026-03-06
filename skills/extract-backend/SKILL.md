---
name: extract-backend
description: Extract shared services, middleware, utilities, and reusable modules from backend code. Reduce duplication and establish clear boundaries.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Identify duplicated logic and repeated patterns, then extract them into shared, reusable modules with clean interfaces.

## Discover

Find extraction opportunities:

1. **Duplicated business logic**: Same validation rules, same calculations, same transformations across multiple endpoints
2. **Repeated middleware patterns**: Auth checks, logging, error handling, rate limiting implemented differently per route
3. **Common database queries**: Same query patterns (find by ID + ownership check) repeated in multiple services
4. **Utility functions**: String formatting, date manipulation, slug generation scattered across files
5. **Shared types/DTOs**: Same data shapes defined in multiple places
6. **Configuration access**: Config values read differently in different places

## Assess Value

Apply the **Rule of Three**: extract only when a pattern appears 3+ times. Not everything should be shared.

Questions to ask:
- Is this truly the same logic, or just superficially similar?
- Would a shared version simplify or complicate the code?
- Does this pattern have a natural interface, or would extraction force an awkward API?
- Will this extracted module have a single owner, or will changes require coordinating multiple teams?

## Plan

For each extraction:
- **What**: the specific pattern to extract
- **Where**: which module/directory it belongs in
- **Interface**: the public API of the extracted module
- **Migration**: how to update existing call sites
- **Dependencies**: what the extracted module depends on (keep minimal)

## Execute

### Middleware Extraction
- Auth middleware: single, configurable middleware for auth checks
- Validation middleware: wraps schema validation for any endpoint
- Error handling middleware: catch-all with consistent error formatting
- Request logging middleware: timing, method, path, status, duration
- Rate limiting middleware: configurable per-route limits

### Service Extraction
- Extract business logic from route handlers into service modules
- Services take dependencies via constructor/function parameters (not global imports)
- Services return domain objects, not HTTP responses
- Services throw domain errors, not HTTP errors (let middleware translate)

### Utility Extraction
- Group utilities by domain: `date-utils`, `string-utils`, `crypto-utils`
- Each utility function: pure, well-typed, tested
- Don't create a single `utils.ts` junk drawer — keep modules focused

### Type Extraction
- Shared request/response types in a `types` or `dto` directory
- Domain models separate from API DTOs
- Generate types from schema when possible (Zod infer, Pydantic model)

### Query Pattern Extraction
- Common query patterns as reusable functions (findByIdWithOwnership, paginatedList)
- Keep it simple — don't build a custom query builder unless you truly need one
- Type-safe: extracted queries return typed results

## Migrate

After extraction:
1. Update all call sites to use the shared version
2. Verify behavior is identical (tests pass)
3. Delete the old implementations
4. Check for circular dependencies (extracted module should not import from feature modules)

## Verify

- [ ] No circular dependencies
- [ ] Extracted modules have clear, minimal interfaces
- [ ] All call sites updated to use shared versions
- [ ] Old implementations deleted
- [ ] All tests pass
- [ ] Module dependency direction is clear (shared modules don't depend on feature modules)

## Anti-Patterns to Avoid

- Extracting after one use (wait for the Rule of Three)
- Creating a `utils.ts` or `helpers.ts` junk drawer
- Deep inheritance hierarchies (prefer composition)
- Over-abstracting with too many layers of indirection
- Extracting code that is superficially similar but semantically different
- Creating "framework" code for problems that don't need a framework
- Shared modules with too many dependencies (they should be lean)
