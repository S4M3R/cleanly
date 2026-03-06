# Security

## Authentication

### JWT Best Practices
- **Short expiry**: Access tokens expire in 15-30 minutes
- **Refresh tokens**: Longer-lived (days/weeks), stored securely, rotated on use
- **Storage**: httpOnly, Secure, SameSite=Strict cookies — NOT localStorage (XSS-vulnerable)
- **Payload**: Minimal claims — user ID, roles, expiry. No sensitive data.
- **Signing**: RS256 (asymmetric) for distributed systems, HS256 (symmetric) for single services
- **Validation**: Always validate signature, expiry, issuer, and audience

### Session Management
- Generate cryptographically random session IDs (min 128 bits)
- Regenerate session ID after authentication (prevent session fixation)
- Set absolute expiry (max session lifetime) and idle expiry
- Invalidate sessions on password change and logout
- Store sessions server-side (Redis, DB) — session ID in cookie only

### API Keys
- Generate with sufficient entropy (min 256 bits)
- Hash before storing (never store plaintext)
- Support key rotation (multiple active keys during transition)
- Scope keys to specific permissions
- Log key usage for audit trails

## Authorization

### Principles
- **Always check server-side** — never trust client-side authorization
- **Default deny** — require explicit permission grants
- **Check at the resource level** — not just the endpoint. User A should not access User B's data even if both have the same role.

### Row-Level Security
Every query that returns user-specific data MUST include a user/tenant filter:
```
-- WRONG: relies on application code to filter
SELECT * FROM orders WHERE id = :orderId

-- RIGHT: includes ownership check
SELECT * FROM orders WHERE id = :orderId AND user_id = :userId
```

### RBAC vs ABAC
- **RBAC** (Role-Based): Simple, works for most apps. Roles: admin, editor, viewer.
- **ABAC** (Attribute-Based): Complex, for fine-grained rules. "User can edit documents they own and that are in draft status."
- Start with RBAC. Move to ABAC only when RBAC becomes insufficient.

## Input Validation

### Principles
- **Validate at the boundary** — every HTTP endpoint, queue consumer, webhook handler
- **Allowlist over denylist** — specify what IS valid, not what ISN'T
- **Use schema validation libraries** — Zod, Pydantic, JSON Schema, Joi, class-validator
- **Validate type, length, format, and range** — not just presence

### Common Validations
- **Strings**: Max length, allowed characters, format (email regex, UUID format)
- **Numbers**: Min/max range, integer vs float
- **Arrays**: Max items, item validation
- **Objects**: Required fields, no extra fields (strict mode)
- **Files**: Max size, allowed MIME types, scan for malware

### Sanitization
- **HTML**: Strip or escape HTML tags in user input
- **SQL**: Parameterized queries — no exceptions
- **URLs**: Validate scheme (http/https only), prevent SSRF
- **File paths**: Prevent directory traversal (../)
- **JSON**: Set max depth and size limits to prevent DoS

## Injection Prevention

### SQL Injection
```
-- NEVER: string concatenation
query = "SELECT * FROM users WHERE email = '" + email + "'"

-- ALWAYS: parameterized queries
query = "SELECT * FROM users WHERE email = $1", [email]
```

ORMs are generally safe but watch out for:
- Raw query methods (`.raw()`, `.execute()`)
- Dynamic column names or table names (not parameterizable)
- ORDER BY clauses (validate against an allowlist of column names)

### Command Injection
- Never pass user input to shell commands
- If unavoidable, use library functions that don't invoke a shell (e.g., `execFile` not `exec`)
- Validate input against a strict allowlist

### NoSQL Injection
- MongoDB: validate that query operators (`$gt`, `$where`) are not in user input
- Use schema validation to ensure input types match expectations

## Rate Limiting

### Strategies
- **Fixed window**: Simple, can have burst at window boundaries
- **Sliding window**: Smoother, slightly more complex
- **Token bucket**: Best for APIs — allows bursts while enforcing average rate

### Implementation
- Rate limit by: authenticated user ID (primary), IP address (fallback for unauthenticated)
- Return `429 Too Many Requests` with `Retry-After` header
- Apply stricter limits on sensitive endpoints (login, password reset, signup)
- Consider tiered limits per API plan/role

### Recommended Limits (starting points)
- Login: 5 attempts per minute per account
- Password reset: 3 per hour per account
- API general: 100-1000 req/min per user (depends on use case)
- Signup: 5 per hour per IP

## Secrets Management

### Rules
- **NEVER** in source code, config files, or git history
- **Minimum**: Environment variables (12-factor app)
- **Better**: Secrets manager (AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager)
- **Rotate regularly** — especially after team member departures
- **Scope narrowly** — each service gets only the secrets it needs
- **Audit access** — log who accessed which secrets when

### Git Safety
- Use `.gitignore` for `.env` files
- Use tools like `git-secrets` or `trufflehog` to scan for accidentally committed secrets
- If a secret is committed: rotate it immediately, then remove from history

## Security Headers

Essential HTTP response headers:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS)
- `Content-Security-Policy: default-src 'self'` (CSP — customize per app)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (or SAMEORIGIN if iframes are needed)
- `Referrer-Policy: strict-origin-when-cross-origin`

## CORS

- **Never** use `Access-Control-Allow-Origin: *` in production with credentials
- Specify exact allowed origins
- Limit allowed methods and headers
- Understand that CORS is enforced by browsers, not servers — server-to-server calls bypass it

## Anti-Patterns

- Storing passwords as plaintext or with MD5/SHA1 (use bcrypt/argon2/scrypt)
- Rolling custom encryption or auth systems
- Trusting client-side validation as the only check
- Logging passwords, tokens, or full credit card numbers
- Overly permissive CORS (`*` with credentials)
- No rate limiting on authentication endpoints
- Secrets in git history (even if removed from current files — git remembers)
- Using `eval()` or equivalent with user input
- Not validating file upload types server-side
- Disabling security features "temporarily" in production
