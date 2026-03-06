# Async Patterns

## When to Go Async

Move work out of the synchronous request path when:

- **Long-running**: operation takes > 500ms (report generation, file processing)
- **Eventual consistency is OK**: result doesn't need to be in the response (email, notification)
- **Fan-out**: one event triggers multiple actions (order placed → send email + update inventory + notify warehouse)
- **Unreliable dependency**: third-party API that's slow or flaky (payment webhook delivery, SMS)
- **Rate-limited**: external API has a low rate limit (batch and throttle via queue)

## Message Queues

### Delivery Semantics

| Semantics | Guarantee | Tradeoff |
|-----------|-----------|----------|
| **At-most-once** | May lose messages | Fastest, simplest |
| **At-least-once** | May deliver duplicates | Most common — requires idempotent consumers |
| **Exactly-once** | No loss, no duplicates | Hardest, often achieved via at-least-once + deduplication |

**Recommendation**: use at-least-once delivery with idempotent consumers. This is the most practical approach.

### Dead Letter Queues (DLQ)
Messages that fail processing after N retries go to the DLQ instead of being lost.

- Configure max retry attempts (3-5 typically)
- DLQ messages must be monitored and investigated
- Include original error and retry count in DLQ metadata
- Build tooling to replay DLQ messages after fixing the bug

### Message Ordering
- **FIFO queues**: guarantee order within a partition/group
- **Standard queues**: no ordering guarantee, higher throughput
- **Recommendation**: only use FIFO when ordering matters (financial transactions). Use standard queues for everything else.

### Backpressure
When consumers can't keep up:
- Monitor queue depth — alert when growing
- Scale consumers horizontally (add more workers)
- Implement rate limiting on producers if consumers can't scale
- Use bounded queues that reject new messages when full (fail-fast)

## Event-Driven Architecture

### Event Types

| Type | Purpose | Example |
|------|---------|---------|
| **Event notification** | "Something happened" (minimal data, consumer fetches details) | `{ "type": "order.created", "orderId": "123" }` |
| **Event-carried state transfer** | "Something happened, here's the data" (consumer has all it needs) | `{ "type": "order.created", "order": { ... full object } }` |
| **Event sourcing** | Events ARE the source of truth (state is derived from event log) | Full event log replayed to build current state |

### Event Schema Design
```json
{
  "id": "evt_abc123",
  "type": "order.created",
  "version": "1.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "source": "order-service",
  "correlationId": "req_xyz789",
  "data": {
    "orderId": "ord_456",
    "userId": "usr_789",
    "total": 4999,
    "currency": "USD"
  }
}
```

### Rules
- **Include enough context**: consumer should be able to process without calling back to the producer
- **Version your events**: schema will evolve. Include version field.
- **Use past tense**: `order.created`, `payment.failed`, `user.signed_up`
- **Make events immutable**: once published, never modify. Publish correction events instead.

### Event Sourcing
Store events as the source of truth. Current state is computed by replaying events.

When to use:
- Full audit trail required (financial systems, compliance)
- Need to answer "how did we get to this state?"
- Complex domain with many state transitions

When NOT to use:
- Simple CRUD apps (massive overkill)
- When you need to query current state efficiently (requires maintaining projections)
- When the team isn't experienced with the pattern

## Background Jobs

### Design Principles
- **Idempotent**: safe to run twice (use idempotency keys or natural idempotency)
- **Atomic**: either fully complete or fully fail — no partial state
- **Timeout-aware**: set a max execution time, fail gracefully
- **Restartable**: can be picked up again after a crash

### Retry Strategy
```
Attempt 1: immediate
Attempt 2: 30 seconds
Attempt 3: 2 minutes
Attempt 4: 15 minutes
Attempt 5: → dead letter queue
```

Use exponential backoff with jitter. Never retry indefinitely.

### Graceful Shutdown
When the process receives SIGTERM:
1. Stop accepting new jobs
2. Wait for current job to finish (with a timeout)
3. If timeout reached, release the job back to the queue for another worker
4. Exit cleanly

### Progress Tracking
For long-running jobs, report progress:
```json
{
  "jobId": "job_123",
  "status": "running",
  "progress": 45,
  "startedAt": "2024-01-15T10:30:00Z",
  "estimatedCompletion": "2024-01-15T10:35:00Z"
}
```

### Deduplication
Prevent the same job from running concurrently:
- Use distributed locks (Redis SETNX with TTL)
- Use database unique constraints on job key
- Use queue-level deduplication (SQS deduplication ID)

## Saga Pattern

For distributed transactions spanning multiple services:

### Orchestration (centralized coordinator)
One service (the orchestrator) tells each service what to do:
```
Orchestrator → Order Service: create order
Orchestrator → Payment Service: charge payment
Orchestrator → Inventory Service: reserve items
If payment fails → Orchestrator → Order Service: cancel order
```

### Choreography (decentralized, event-driven)
Each service listens for events and acts:
```
Order created → Payment service charges
Payment succeeded → Inventory service reserves
Inventory reserved → Notification service sends confirmation
Payment failed → Order service cancels
```

### Compensating Transactions
When a step fails, undo previous steps:
- `createOrder` → compensate with `cancelOrder`
- `chargePayment` → compensate with `refundPayment`
- `reserveInventory` → compensate with `releaseInventory`

Design every action with its compensation in mind.

### Choosing
- **Orchestration**: simpler to understand, easier to manage complex flows, single point of failure
- **Choreography**: more decoupled, no single point of failure, harder to reason about

## Idempotency

### Why It's Critical in Async
Message queues deliver at-least-once. If your consumer isn't idempotent, you get:
- Double charges
- Duplicate emails
- Duplicate inventory decrements

### Implementation Patterns
1. **Idempotency key**: store processed message IDs, skip duplicates
2. **Natural idempotency**: SET operations are naturally idempotent (SET status = 'active')
3. **Database constraints**: unique indexes prevent duplicate inserts
4. **Deduplication window**: store processed IDs for 24-48 hours, then expire

### Example
```
-- Consumer receives "charge payment" message
-- 1. Check if already processed
SELECT 1 FROM processed_messages WHERE message_id = 'msg_123'
-- 2. If not processed, do the work
INSERT INTO payments (order_id, amount, ...) VALUES (...)
-- 3. Mark as processed (in same transaction)
INSERT INTO processed_messages (message_id) VALUES ('msg_123')
```

## Pub/Sub Patterns

### Topic Design
- One topic per event type: `order.created`, `payment.failed`
- Or one topic per domain with event type as attribute: topic `orders`, attribute `type=created`
- Prefer specific topics for simple systems, domain topics for complex systems

### Fan-Out
One event → multiple consumers:
```
order.created →
  ├── email-service (sends confirmation)
  ├── inventory-service (reserves items)
  ├── analytics-service (tracks conversion)
  └── notification-service (pushes to mobile)
```

Each consumer has its own subscription/queue and processes independently.

## Anti-Patterns

- Fire-and-forget without dead letter queues (messages silently lost)
- No idempotency in queue consumers (duplicate processing)
- Unbounded queue growth without monitoring or alerting
- Synchronous-looking code that hides async complexity
- Not handling partial failures in distributed transactions
- No graceful shutdown (jobs killed mid-execution)
- Infinite retries (retrying forever instead of using DLQ)
- Polling for completion instead of using events/callbacks
- Tight coupling between producer and consumer (producer knows consumer implementation)
- Processing order-dependent messages without FIFO guarantees
