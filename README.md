# Cleanly Backend Skills

A collection of production-grade backend skills for AI coding agents. Each skill provides structured guidance for a specific backend engineering concern — from writing code to auditing, hardening, and scaling it.

## Install

```bash
npx skills add S4M3R/cleanly
```

## Skills

| Skill | Description |
|-------|-------------|
| **backend-design** | Write production-grade backend code with error handling, security, performance, and observability |
| **audit-backend** | Read-only code quality audit across security, performance, reliability, and observability |
| **secure-backend** | OWASP Top 10 checks, dependency audit, secrets scanning, auth hardening |
| **harden-backend** | Input validation, auth checks, rate limiting, error boundaries, defensive patterns |
| **optimize-backend** | Detect N+1 queries, improve caching, tune connection pools, reduce latency |
| **scale-backend** | Identify scalability bottlenecks and assess horizontal scaling readiness |
| **observe-backend** | Structured logging, metrics, distributed tracing, health checks, alerting |
| **test-backend** | Identify test gaps, suggest strategies, generate test scaffolding |
| **migrate-backend** | Review migrations for zero-downtime safety, reversibility, data preservation |
| **polish-backend** | Consistent naming, remove dead code, align patterns, improve readability |
| **extract-backend** | Extract shared services, middleware, utilities from duplicated code |
| **document-backend** | Generate API docs, OpenAPI specs, README files, inline documentation |
| **explain-backend** | Explain code with Mermaid diagrams, annotated snippets, and walkthroughs |
| **teach-backend** | One-time setup to gather stack, conventions, and infrastructure context |

## Usage

Skills are activated automatically by your AI agent when they match the current task. You can also invoke them directly:

```
/audit-backend
/secure-backend target=auth
/optimize-backend
```

## License

MIT
