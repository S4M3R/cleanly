---
name: document-backend
description: Generate or improve API documentation, OpenAPI/Swagger specs, README files, and inline code documentation for backend services.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Generate or improve backend documentation. Focus on what developers need to get started, integrate, and debug.

## Discover

Inventory current state:

1. **README**: Does it exist? Is it up to date? Does it cover setup, running, testing, deploying?
2. **API docs**: OpenAPI/Swagger spec? Is it generated from code or manual? Is it current?
3. **Inline docs**: Are complex functions documented? Are public APIs documented?
4. **Environment variables**: Are they documented? With descriptions, types, defaults, examples?
5. **Error codes**: Is there a list of error codes and their meanings?
6. **Architecture**: Are there ADRs (Architecture Decision Records) or architecture diagrams?
7. **Endpoints**: Full list of all routes, methods, auth requirements, request/response shapes

## Plan

Determine what documentation is needed based on gaps:

### Essential (every project needs these)
- README with setup/run/test/deploy instructions
- Environment variable documentation
- API endpoint reference (OpenAPI or markdown)

### Important (for team projects)
- Error code reference
- Authentication/authorization guide
- Database schema overview

### Nice to Have
- ADRs for key decisions
- Architecture diagrams
- Contributing guide

## Execute

### README
Generate or update with these sections:
```markdown
# Project Name
Brief description of what this service does.

## Prerequisites
- Language/runtime version
- Database (type, version)
- Other dependencies (Redis, etc.)

## Getting Started
1. Clone the repo
2. Install dependencies: `command here`
3. Set up environment: `cp .env.example .env`
4. Run migrations: `command here`
5. Start the server: `command here`

## Running Tests
`command here`

## Environment Variables
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| DATABASE_URL | PostgreSQL connection string | Yes | — |
| REDIS_URL | Redis connection string | No | localhost:6379 |
| JWT_SECRET | Secret for signing JWTs | Yes | — |

## API Overview
Brief description of main endpoints. See [API docs](link) for full reference.

## Deployment
How to deploy this service.
```

### OpenAPI Spec
Generate from code if possible (decorators, annotations, schema definitions). If not, create manually:
- Every endpoint: path, method, summary, description
- Request body: schema with types, required fields, examples
- Response: success schema + error schemas for each status code
- Authentication: security schemes (Bearer, API key, etc.)
- Include realistic examples for request/response bodies

### Environment Variables
Document every env var:
- Name, description, type (string, number, boolean, URL)
- Required vs optional
- Default value (if any)
- Example value
- Where to get it (e.g., "Get from Stripe dashboard")

### Error Codes
Document all custom error codes:
```markdown
| Code | HTTP Status | Description | Resolution |
|------|------------|-------------|------------|
| VALIDATION_FAILED | 422 | Request body validation failed | Check `details` array for field-specific errors |
| NOT_FOUND | 404 | Requested resource does not exist | Verify the resource ID |
| RATE_LIMITED | 429 | Too many requests | Wait and retry after `Retry-After` seconds |
```

### Inline Documentation
- Document complex business logic (the "why", not the "what")
- Document non-obvious behavior (side effects, implicit ordering, gotchas)
- Document public API functions (parameters, return values, errors thrown)
- Don't document obvious code (avoid `// increment counter` above `counter++`)

## Verify

- [ ] README setup instructions work from scratch (follow them yourself)
- [ ] All endpoints are documented
- [ ] All environment variables are documented
- [ ] OpenAPI spec validates (use a linter)
- [ ] Error codes are documented with resolution steps
- [ ] No sensitive information in documentation (real API keys, production URLs)

## Anti-Patterns to Avoid

- Documentation that duplicates code (comments that say what the code already says)
- Stale documentation (worse than no documentation — misleads)
- Documenting internal implementation in public API docs
- Missing error response documentation (only documenting success)
- README that assumes tribal knowledge ("you know how to set up the DB")
- Generated documentation with no human review (may include irrelevant details)
