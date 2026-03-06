---
name: secure-backend
description: Security-focused review and fixes. OWASP Top 10 checks, dependency vulnerability audit, secrets scanning, auth hardening, and injection prevention.
license: MIT
metadata:
  author: S4M3R
  version: "1.0"
---

Focused security review and remediation. Find and fix vulnerabilities following OWASP guidelines.

## Discover

Scan for security issues across these categories:

### Injection Vectors
- String concatenation in SQL queries (SQL injection)
- User input in shell commands (command injection)
- User input in template rendering (XSS / SSTI)
- MongoDB query operators in user input (NoSQL injection)
- User input in file paths (directory traversal)
- Dynamic property access with user input (prototype pollution)

### Authentication & Sessions
- JWT configuration (algorithm, expiry, signing key strength)
- Session management (secure cookie flags, regeneration on login)
- Password storage (bcrypt/argon2/scrypt, not MD5/SHA1/plaintext)
- API key handling (hashed storage, scoped permissions)
- Token refresh flow (rotation, revocation)

### Authorization
- Missing auth middleware on protected routes
- Missing row-level security (user A accessing user B's data)
- Privilege escalation paths (changing role in request body)
- IDOR (Insecure Direct Object Reference) vulnerabilities

### Secrets
- Hardcoded credentials, API keys, tokens in source code
- Secrets in git history (even if removed from current files)
- Secrets in logs or error responses
- `.env` files not in `.gitignore`

### Dependencies
- Known CVEs in dependencies (npm audit / pip audit / cargo audit)
- Outdated packages with security patches available
- Typosquatting risks in dependency names

### Configuration
- CORS misconfiguration (overly permissive origins)
- Missing security headers (HSTS, CSP, X-Frame-Options)
- Debug mode enabled in production
- Default credentials in configuration
- Overly permissive file permissions

## Plan

Prioritize fixes by severity:
1. **Critical**: Active injection vectors, exposed secrets, missing auth
2. **High**: Authorization bypasses, outdated deps with known CVEs
3. **Medium**: Missing security headers, weak configurations
4. **Low**: Best practice improvements, defense-in-depth additions

## Execute

### Fix Injection Vectors
- Replace string concatenation with parameterized queries
- Sanitize user input before any dynamic operation
- Use allowlists for dynamic column names, sort fields, etc.
- Add input length limits to prevent DoS via large payloads

### Fix Auth Issues
- Add auth middleware to unprotected routes
- Add row-level security checks (ownership verification on every resource access)
- Validate that role/permission changes require appropriate authorization
- Ensure password hashing uses bcrypt/argon2 with appropriate cost factor

### Fix Secrets
- Move hardcoded secrets to environment variables
- Add secret files to `.gitignore`
- Add pre-commit hook to detect secrets (git-secrets, detect-secrets)
- If secrets were in git history, rotate them immediately

### Fix Dependencies
- Update dependencies with known CVEs
- Run `npm audit fix` / equivalent for the project's package manager
- Pin dependency versions for reproducible builds
- Consider adding automated dependency update tooling (Dependabot, Renovate)

### Fix Configuration
- Set specific CORS origins (not `*` with credentials)
- Add security headers via middleware
- Disable debug mode in production configuration
- Set secure cookie flags (httpOnly, Secure, SameSite=Strict)

## Verify

- [ ] No SQL injection vectors (all queries parameterized)
- [ ] No hardcoded secrets in source code
- [ ] All protected routes have auth middleware
- [ ] All resource access checks ownership/permissions
- [ ] Dependencies have no known critical/high CVEs
- [ ] Security headers are set
- [ ] CORS is properly configured
- [ ] All tests still pass

## Anti-Patterns to Avoid

- Rolling custom encryption or auth (use established libraries)
- Storing secrets in code "temporarily"
- Disabling security features for development convenience in shared config
- Trusting client-side validation as a security boundary
- Security through obscurity (hiding endpoints instead of protecting them)
- Blanket `try/catch` that swallows security-relevant errors
