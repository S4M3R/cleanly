---
name: teach-backend
description: One-time setup that gathers your backend stack, conventions, infrastructure context, and operational requirements. Saves to your AI config file for persistent context in future sessions.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

One-time setup to establish backend context for this project. Scan the codebase, ask clarifying questions, and persist the context so all future backend commands have the right information.

## Phase 1: Codebase Exploration

Silently scan the project to discover as much as possible before asking questions:

1. **Stack detection**: Read package.json / requirements.txt / go.mod / Cargo.toml / pom.xml / build.gradle — identify language, framework, ORM, database driver, testing framework
2. **Directory structure**: Understand the project layout — where are routes, services, models, middleware, migrations, tests?
3. **Configuration**: Read .env.example, config files, docker-compose.yml — identify database type, cache (Redis?), queue (SQS, RabbitMQ?), cloud provider
4. **Existing patterns**: Sample 3-5 route handlers and services to understand current conventions for error handling, validation, logging, response format
5. **CI/CD**: Check for GitHub Actions, Dockerfile, deployment configs
6. **Testing**: What test runner, where are tests, what's the coverage pattern?
7. **Documentation**: Existing README, OpenAPI specs, ADRs

## Phase 2: Clarifying Questions

Using the information gathered, ask targeted questions ONLY about gaps. Skip anything already answered by the codebase scan. Group questions by category:

### Stack (if not detected)
- Primary language and runtime version
- Database type and version
- Cache layer (Redis, Memcached, none)
- Message queue (SQS, RabbitMQ, Kafka, none)
- Cloud provider and hosting (AWS, GCP, containers, serverless)

### Conventions (if not evident from code)
- Naming conventions (camelCase vs snake_case in code and DB)
- Error handling approach (custom error classes? error middleware?)
- Logging strategy (structured? what library?)
- API response format (envelope? specific structure?)

### Infrastructure
- Deployment method (containers, serverless, VMs, PaaS)
- Environments (dev, staging, production)
- Secrets management (env vars, Vault, cloud secrets manager)

### Operational Requirements
- Uptime/SLA targets
- Expected traffic patterns (requests/sec, peak times)
- Data sensitivity (PII, financial, healthcare — GDPR, HIPAA, SOC2?)
- On-call / incident response process

### Team Context
- Team size and backend experience level
- Code review process
- Deployment frequency
- Testing expectations (what level of coverage?)

## Phase 3: Write Context

Synthesize everything into a **Backend Context** section and write it to the project's `CLAUDE.md` file (create if it doesn't exist, append if it does).

### Format
```markdown
## Backend Context

### Stack
- **Language**: [detected/answered]
- **Framework**: [detected/answered]
- **Database**: [detected/answered]
- **Cache**: [detected/answered]
- **Queue**: [detected/answered]
- **Hosting**: [detected/answered]

### Conventions
- [naming, error handling, logging, response format conventions]

### Project Structure
- [key directories and their purposes]

### Operational Requirements
- [SLA, traffic, compliance, deployment]

### Guiding Principles
- [3-5 project-specific principles derived from the answers]
  Example: "This is a healthcare app — HIPAA compliance is non-negotiable"
  Example: "Small team, fast iteration — keep architecture simple"
  Example: "High-traffic consumer API — performance and caching are critical"
```

## Phase 4: Confirm

Summarize what was learned and the guiding principles. Ask if anything needs correction.

**IMPORTANT**: This is a one-time setup. If `CLAUDE.md` already has a Backend Context section, inform the user and ask if they want to update it rather than overwriting.
