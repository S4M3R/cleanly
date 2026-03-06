---
name: test-backend
description: Identify test gaps, suggest testing strategies, and generate test scaffolding for backend code. Unit, integration, and contract tests.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Find what's not tested, design a testing strategy, and generate test scaffolding.

## Discover

Map the test landscape:

1. **What exists**: test files, test runner, test configuration, coverage reports
2. **What's tested**: which modules/endpoints have tests? What kind (unit, integration, e2e)?
3. **What's NOT tested**: which modules/endpoints have zero tests?
4. **Test quality**: are tests testing behavior or implementation? Are they brittle? Do they use real DBs or mocks?
5. **Test infrastructure**: fixtures/factories, test database setup, mock utilities, CI integration
6. **Flaky tests**: tests that fail intermittently (timing issues, shared state, network calls)

## Plan

Prioritize by risk (highest risk of breakage + highest impact):

### Testing Pyramid
```
        ╱ E2E ╲           Few: critical user flows only
       ╱ Integration ╲     Some: API endpoints, DB queries
      ╱    Unit Tests   ╲  Many: business logic, utilities
```

### Priority Order
1. **Business logic** — pure functions with complex rules (highest ROI)
2. **API endpoints** — integration tests hitting real routes with test DB
3. **Error paths** — invalid input, not found, unauthorized, conflict
4. **Edge cases** — empty arrays, null values, concurrent access, boundary values
5. **Data access** — complex queries, transactions, migrations
6. **External integrations** — mocked/stubbed, testing the contract

## Execute

### Test Structure
Each test file should follow Arrange → Act → Assert:

```
describe("OrderService.createOrder", () => {
  // Happy path
  it("creates an order with valid input", async () => { ... })

  // Validation errors
  it("rejects empty cart", async () => { ... })
  it("rejects invalid product ID", async () => { ... })

  // Auth errors
  it("rejects unauthenticated request", async () => { ... })

  // Business rules
  it("applies discount for orders over $100", async () => { ... })
  it("calculates tax based on shipping address", async () => { ... })

  // Edge cases
  it("handles concurrent orders for last item in stock", async () => { ... })
})
```

### Unit Tests
- Test pure business logic functions in isolation
- Mock/stub external dependencies (DB, HTTP, cache)
- Fast: should run in milliseconds
- Cover: happy path, error cases, edge cases, boundary values

### Integration Tests
- Test API endpoints with a real test database
- Use transactions or truncation to isolate between tests
- Test the full request lifecycle: validation → auth → business logic → persistence → response
- Cover: successful operations, validation errors, auth errors, not found, conflict

### Test Data
- Use factories/fixtures for consistent test data creation
- Don't share mutable state between tests
- Each test creates its own data and cleans up after
- Use realistic data (not "test", "foo", "bar")

### What to Mock
- **Mock**: External HTTP APIs, email services, payment gateways, file storage
- **Don't mock**: Your own database (use a test instance), your own code (test the real thing)
- **Contract tests**: Verify your mocks match the real API's behavior

## Verify

- [ ] Critical business logic has unit tests
- [ ] API endpoints have integration tests (happy path + errors)
- [ ] Test data is isolated between tests (no shared mutable state)
- [ ] External dependencies are mocked with realistic responses
- [ ] Tests run in any order without failing (no interdependencies)
- [ ] Tests pass in CI, not just locally
- [ ] Error paths are tested, not just happy paths

## Anti-Patterns to Avoid

- Testing implementation details (which internal method was called, query structure)
- Tests tightly coupled to ORM internals (break when ORM version changes)
- Skipping error path testing (only testing happy path)
- Using production databases for tests
- Tests that depend on execution order
- Tests with `sleep()` calls (use polling or waitFor patterns)
- Mocking everything (including your own code) — test real behavior
- Tests that test the framework (testing that Express routes work, not your logic)
- No assertion in a test (test that always passes)
- Giant test setup that's hard to understand (keep each test self-contained)
