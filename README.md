# Cleanly Backend Skills

[Impeccable](https://impeccable.style) gave AI agents design fluency. **Cleanly does the same for backend engineering.** 14 production-grade skills that teach AI agents to write code that survives contact with real users — not just the happy path.

## Install

```bash
npx skills add S4M3R/cleanly
```

## Skills

### Write
| Skill | What it does | Example prompt |
|-------|-------------|----------------|
| **backend-design** | Write production-grade code with error handling, security, performance, and observability | *"Build a REST API for user management"* — agent adds validation, auth, error responses, structured logging |

### Harden
| Skill | What it does | Example prompt |
|-------|-------------|----------------|
| **secure-backend** | OWASP Top 10 checks, dependency audit, secrets scanning, auth hardening | *"Review auth for vulnerabilities"* — finds SQL injection vectors, missing rate limits, hardcoded secrets |
| **harden-backend** | Input validation, auth checks, rate limiting, error boundaries | *"Harden the payments endpoint"* — adds Zod schemas, timeout on Stripe calls, idempotency keys |

### Optimize
| Skill | What it does | Example prompt |
|-------|-------------|----------------|
| **optimize-backend** | Detect N+1 queries, improve caching, tune connection pools | *"Why is the dashboard slow?"* — finds N+1 in user list, adds Redis cache, suggests composite index |
| **scale-backend** | Identify scalability bottlenecks, assess horizontal scaling readiness | *"Can this handle 10x traffic?"* — flags stateful sessions, single DB bottleneck, missing queue |

### Observe
| Skill | What it does | Example prompt |
|-------|-------------|----------------|
| **observe-backend** | Structured logging, metrics, distributed tracing, health checks | *"Add observability"* — replaces console.log with structured JSON, adds correlation IDs, Prometheus metrics |
| **audit-backend** | Read-only audit across security, performance, reliability | *"Audit the codebase"* — produces severity-rated report: 2 critical, 5 high, 8 medium findings |

### Quality
| Skill | What it does | Example prompt |
|-------|-------------|----------------|
| **test-backend** | Identify test gaps, design strategies, generate scaffolding | *"What's not tested?"* — maps coverage gaps, generates integration test stubs for untested endpoints |
| **polish-backend** | Consistent naming, remove dead code, align patterns | *"Clean up the services directory"* — standardizes error format, removes 3 dead exports, aligns naming |
| **extract-backend** | Extract shared services, middleware, utilities | *"Reduce duplication"* — extracts shared auth middleware, consolidates 4 duplicate validation helpers |

### Operate
| Skill | What it does | Example prompt |
|-------|-------------|----------------|
| **migrate-backend** | Review migrations for zero-downtime safety | *"Review this migration"* — flags non-reversible column drop, suggests backfill strategy, checks index impact |

### Understand
| Skill | What it does | Example prompt |
|-------|-------------|----------------|
| **explain-backend** | Mermaid diagrams, annotated code, architecture walkthroughs | *"Explain the order flow"* — generates sequence diagram from request to DB, annotates middleware chain |
| **document-backend** | Generate API docs, OpenAPI specs, inline documentation | *"Generate API docs"* — produces OpenAPI 3.1 spec with request/response examples for all endpoints |
| **teach-backend** | One-time setup to gather your stack and conventions | *"Set up backend context"* — scans project, asks clarifying questions, writes Backend Context to CLAUDE.md |

## Inspired by

Cleanly is inspired by [Impeccable](https://impeccable.style) by [Paul Bakaus](https://github.com/pbakaus) — which brings design fluency to AI agents for frontend work. Cleanly brings the same philosophy to the backend: structured skills that give agents the vocabulary and checklists to produce production-quality code.

## License

MIT
