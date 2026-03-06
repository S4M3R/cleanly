---
name: observe-backend
description: Add or improve observability. Structured logging, metrics collection, distributed tracing, health checks, and alerting rules.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Make the backend observable. If you can't see what's happening in production, you can't debug it.

## Discover

Assess current observability state:

1. **Logging**: Is it structured (JSON)? Or unstructured strings? What library? What fields are consistent?
2. **Correlation IDs**: Is there a request ID? Is it propagated to all log lines? Is it returned in error responses?
3. **Metrics**: Are request rate, error rate, latency tracked? What system (Prometheus, StatsD, Datadog)?
4. **Tracing**: Are external calls (DB, HTTP, cache) traced? What library (OpenTelemetry, Jaeger)?
5. **Health checks**: Is there a `/health` or `/ready` endpoint? Do they check dependencies?
6. **Alerting**: Are there alert rules? On what conditions? Are there runbooks?
7. **Sensitive data**: Is PII, credentials, or tokens being logged?

## Plan

Prioritize by observability maturity:

### Level 1: Basics (start here if nothing exists)
1. Structured logging (JSON) with consistent fields
2. Request ID middleware (generate + propagate + log)
3. Error logging with context

### Level 2: Operational
4. Request timing middleware (latency per endpoint)
5. Health check endpoints (liveness + readiness)
6. Key metrics: request rate, error rate, latency p95/p99

### Level 3: Advanced
7. Distributed tracing spans on external calls
8. Business metrics (signups/min, orders/hour)
9. Alerting rules on SLO violations
10. Dashboard for key service metrics

## Execute

### Structured Logging
- Replace `console.log` / `print()` with a structured logging library
- Every log line includes: `timestamp`, `level`, `service`, `requestId`, `message`
- Business events at INFO: "Order created", "User signed up", "Payment processed"
- Errors at ERROR with: stack trace, request context, user ID (not PII)
- Expected failures (404, validation) at INFO or WARN — NOT ERROR

### Correlation IDs
- Add middleware that:
  1. Extracts `X-Request-Id` from incoming request (or generates one)
  2. Stores it in request context (async context / thread-local / request-scoped)
  3. Logger automatically includes it in every log line
  4. HTTP clients forward it in outgoing requests
  5. Error responses include it as `requestId`

### Request Timing
- Add middleware that logs: method, path, status code, duration_ms for every request
- Record latency as a histogram metric (for p50/p95/p99 calculation)
- Tag metrics with: endpoint, method, status code group (2xx, 4xx, 5xx)

### Health Checks
- `GET /healthz` — liveness: return 200 if process is alive (no dependency checks)
- `GET /readyz` — readiness: check DB connection, cache connection, critical services
- Return structured response:
  ```json
  { "status": "healthy", "checks": { "database": "healthy", "redis": "healthy" } }
  ```
- Don't check non-critical dependencies in readiness

### Distributed Tracing
- Add tracing spans for: database queries, HTTP client calls, cache operations, queue operations
- Include relevant attributes: operation name, target, duration, status
- Use W3C Trace Context headers for propagation between services
- Set sampling rate: 100% in development, 1-10% in production

### Alerting
- Error rate > 5% for > 5 minutes → page
- p99 latency > SLO for > 5 minutes → page
- Queue depth growing for > 10 minutes → warn
- Connection pool > 80% utilization → warn
- Health check failing → page
- Zero traffic for > 5 minutes → page (possible outage)
- Every alert includes: description, severity, runbook link

### Remove Sensitive Data from Logs
- Audit existing logs for: passwords, tokens, API keys, credit card numbers, SSN, email addresses
- Add redaction middleware or configure the logger to mask sensitive fields
- Never log full request bodies on auth endpoints

## Verify

- [ ] All logs are structured JSON with consistent fields
- [ ] Correlation ID is generated, propagated, and included in every log line
- [ ] Error responses include requestId
- [ ] Request timing is logged for every endpoint
- [ ] Health check endpoints exist and verify critical dependencies
- [ ] No sensitive data in logs
- [ ] Metrics are being collected (if metrics system exists)
- [ ] All tests still pass

## Anti-Patterns to Avoid

- Logging PII, passwords, or tokens
- Using `console.log("Error: " + err)` as the logging strategy
- Logging expected errors (404, validation) at ERROR level (creates noise)
- No correlation ID (impossible to trace a request across log lines)
- Alerting on every error instead of error rate (alert fatigue)
- Health checks that take > 1 second or check non-critical services
- Averages for latency metrics (use percentiles — p50, p95, p99)
- DEBUG level logging in production by default
