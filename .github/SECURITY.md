# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Hebrews Coffee seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to [security@yourcompany.com] with the following information:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your report within 48 hours.
- **Investigation**: We will investigate and validate the reported vulnerability.
- **Updates**: We will keep you informed of our progress.
- **Resolution**: We will work to resolve confirmed vulnerabilities within 90 days.

### Security Measures in Place

- **Authentication**: NextAuth.js with secure session management
- **Database Security**: Parameterized queries via Prisma ORM
- **Environment Variables**: Sensitive data stored in environment variables
- **HTTPS**: All production traffic encrypted
- **Input Validation**: Server-side validation using Zod schemas
- **Access Control**: Route-level authentication middleware
- **Docker Security**: Multi-stage builds with minimal attack surface

### Security Best Practices

When contributing to this project:

1. Never commit secrets, API keys, or passwords
2. Use environment variables for sensitive configuration
3. Validate all user inputs on the server side
4. Follow the principle of least privilege
5. Keep dependencies up to date
6. Use HTTPS in production
7. Sanitize data before database operations

## Vulnerability Disclosure Timeline

- Day 0: Vulnerability reported
- Day 2: Acknowledgment sent
- Day 14: Initial assessment complete
- Day 30: Patch development begins (for confirmed vulnerabilities)
- Day 90: Patch released and advisory published

## Bug Bounty Program

Currently, we do not offer a formal bug bounty program. However, we greatly appreciate responsible disclosure and will acknowledge security researchers who help improve our security posture.