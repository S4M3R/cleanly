# Observability

## Three Pillars

| Pillar | What It Tells You | Example |
|--------|-------------------|---------|
| **Logs** | What happened (events) | "User 123 placed order 456" |
| **Metrics** | How much / how often (aggregates) | "Request rate: 500 req/s, Error rate: 0.5%" |
| **Traces** | The journey of a request (flow) | "Request → API → DB → Cache → Response (230ms)" |

All three are needed. Logs without metrics = drowning in events with no context. Metrics without logs = you know something is wrong but not what. Both without traces = you can't follow a request through the system.

## Structured Logging

### Format: JSON, Always
```json
{
  "timestamp": "2024-01-15T10:30:00.123Z",
  "level": "info",
  "service": "order-service",
  "requestId": "req_abc123",
  "userId": "usr_456",
  "message": "Order created",
  "orderId": "ord_789",
  "total": 4999,
  "duration_ms": 45
}
```

### Rules
- **Structured, not strings**: `{ "userId": "123" }` not `"User 123 placed an order"`
- **Consistent fields**: every log line has `timestamp`, `level`, `service`, `requestId`
- **Machine-parseable**: JSON for production, pretty-print for development
- **Context-rich**: include relevant IDs (user, request, resource) in every log line

### Log Levels — Use Them Correctly

| Level | When | Actionable? |
|-------|------|-------------|
| **ERROR** | Something failed that shouldn't have. A bug or system failure. | Yes — investigate immediately |
| **WARN** | Degraded state. Using fallback, approaching limit, retrying. | Yes — investigate soon |
| **INFO** | Business events. Request started/completed, order placed, user signed up. | No — normal operations |
| **DEBUG** | Detailed technical context. Query parameters, response bodies, cache hits. | No — development only |

**Common mistake**: logging expected errors (404, validation failures) as ERROR. These are INFO or WARN. If you alert on every ERROR, make sure only unexpected failures are logged at that level.

## Correlation IDs

### How It Works
1. **Generate** at the edge (API gateway, first service to receive the request)
2. **Propagate** through every service call (HTTP header, queue message attribute)
3. **Include** in every log line within that request
4. **Return** in error responses so support can trace issues

### Header Convention
```
X-Request-Id: req_abc123
```
Or use W3C Trace Context:
```
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
```

### Implementation
- Middleware generates or extracts correlation ID from incoming request
- Logging library automatically includes it in every log line (e.g., via async context / thread-local)
- HTTP clients automatically forward it in outgoing requests
- Queue producers include it in message metadata

## Metrics

### RED Method (for services)
- **R**ate: requests per second
- **E**rrors: errors per second (and error rate %)
- **D**uration: latency distribution (p50, p95, p99)

### USE Method (for resources)
- **U**tilization: how busy is it? (CPU %, memory %, disk %, connection pool %)
- **S**aturation: how queued is it? (queue depth, thread pool queue length)
- **E**rrors: error count for this resource

### Key Metrics to Track

**Request metrics:**
- Request rate (by endpoint, method, status code)
- Error rate (4xx, 5xx separately)
- Latency percentiles: p50 (median), p95, p99
- In-flight requests (concurrent)

**Resource metrics:**
- Database: query duration, connection pool utilization, active connections
- Cache: hit rate, miss rate, eviction rate
- Queue: depth, consumer lag, processing time
- Memory: heap usage, GC pause time
- CPU: utilization per core

**Business metrics:**
- Signups per minute, orders per hour, revenue per day
- Feature usage rates
- Conversion funnel drop-off points

### Percentiles vs Averages
**Never use averages for latency.** An average of 50ms hides the fact that 1% of users experience 5000ms.

Always track: p50 (median), p95 (most users), p99 (worst 1%). Alert on p95 or p99, not average.

## Distributed Tracing

### When You Need It
- Multiple services handling a single request
- Unclear where latency is being spent
- Complex async flows (request → queue → worker → callback)

### Implementation
- Create a span for every external call (database, HTTP, cache, queue)
- Include: operation name, duration, status, relevant attributes
- Parent-child relationships form the trace tree
- Sampling: trace 100% in dev, 1-10% in production (configurable)

### Span Attributes
```
span.name = "db.query"
span.attributes = {
  "db.system": "postgresql",
  "db.statement": "SELECT * FROM orders WHERE user_id = $1",
  "db.operation": "SELECT",
  "db.table": "orders"
}
```

## Health Checks

### Three Types

| Check | Purpose | What It Verifies |
|-------|---------|-----------------|
| **Liveness** (`/healthz`) | Is the process alive? | Process is running, not deadlocked |
| **Readiness** (`/readyz`) | Can it serve traffic? | Dependencies are connected (DB, cache, etc.) |
| **Startup** (`/startupz`) | Has it finished starting? | Initialization complete (migrations, cache warming) |

### Rules
- Liveness: lightweight, no dependency checks (just return 200)
- Readiness: check critical dependencies (DB connection, required services)
- Don't check non-critical dependencies in readiness (optional cache, analytics)
- Return structured status:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy", "latency_ms": 2 },
    "redis": { "status": "healthy", "latency_ms": 1 },
    "stripe": { "status": "degraded", "message": "Elevated latency" }
  }
}
```

## Alerting

### Principles
- **Alert on symptoms, not causes**: "Error rate > 5%" not "CPU > 80%"
- **Every alert must be actionable**: if you can't do anything about it, it's not an alert
- **Alert on SLO burn rate**: "Burning through error budget 10x faster than expected"
- **Include runbook links**: every alert should link to a runbook explaining what to do
- **Avoid alert fatigue**: too many alerts = all alerts get ignored

### Recommended Alerts
- Error rate > threshold (5%) for > 5 minutes
- p99 latency > SLO target for > 5 minutes
- Queue depth growing for > 10 minutes (consumers not keeping up)
- Database connection pool > 80% utilization
- Disk usage > 80%
- Certificate expiring in < 30 days
- Zero traffic (complete outage, possibly undetected)

## Anti-Patterns

- `console.log("error:", err)` as the logging strategy
- Logging PII, passwords, tokens, or credit card numbers
- Unstructured string logs (`"User " + userId + " failed to..."`)
- No correlation IDs (can't trace a request across services)
- Alerting on every single error instead of error rate
- Using only averages for latency (hides tail latency)
- No health check endpoints
- Health checks that take > 1 second (they run frequently)
- Logging at DEBUG level in production by default
- Not monitoring queue depth or consumer lag
