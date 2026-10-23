# BizBridge Secure Software Development Life Cycle

## Scope and security goals

BizBridge handles account credentials, business profiles, and financial
transactions. The MVP should protect account access and prevent one business
owner from reading or changing another owner's records. Financial summaries
and readiness status are informational, not lender decisions or verified
claims.

## Lifecycle controls

### 1. Define

- Identify user data, business records, transaction references, and financial
  totals before adding a feature.
- Record the owner of each data set and the minimum data needed to deliver the
  feature.
- Treat funding-readiness items as sensitive self-reported context; avoid
  presenting them as verified facts.

### 2. Design

- Require authentication for private routes and derive the user identity from
  the validated JWT.
- Check business ownership in the API before returning or changing business
  records. Do not trust a browser-supplied owner ID.
- Use PostgreSQL foreign keys and unique constraints for data integrity.
- Separate automatically derived status from user self-attestation and explain
  what each means in the interface.
- Present financial trends as historical observations, include their date
  range and data basis, and do not label them as guaranteed predictions.

### 3. Implement

- Validate request models and constrain text and numeric input.
- Use Entity Framework Core parameterized queries and database transactions
  where multi-record consistency is required.
- Keep credentials, signing keys, and connection secrets out of source control;
  use deployment secrets or a local secret store.
- Avoid logging passwords, bearer tokens, complete payment references, or
  unnecessary financial details.

### 4. Verify

- Run API integration tests for authentication, owner isolation, validation,
  persistence, and error responses.
- Test both successful and rejected checklist changes, including attempts to
  override automatically derived checks.
- Verify that a new financial insight uses recorded transactions only and that
  warnings state their historical basis.
- Before release, run dependency vulnerability checks and review database
  migrations and authorization changes.

### 5. Release and operate

- Apply reviewed Entity Framework migrations in the deployment environment.
- Store production connection strings and JWT signing keys in managed secrets.
- Use HTTPS in deployed environments and restrict allowed browser origins.
- Monitor authentication failures and API errors without recording secrets.
- Document a response path for suspected unauthorized access or data exposure.

## Current MVP implementation notes

- ASP.NET Core routes use bearer-token authentication.
- Business-scoped finance endpoints check that the authenticated owner matches
  the requested business.
- EF Core maps to PostgreSQL in the application and uses an isolated SQLite
  database for integration tests.
- Readiness checklist updates are stored per business; self-reported entries
  are explicitly labelled as unverified.
- Financial insights are calculated from stored transactions and carry a
  visible basis statement.
- Duplicate payment references create review alerts; an alert is not proof of
  fraud.

This document describes the intended controls and current implementation
boundaries. It is not a claim of formal security certification or a completed
third-party security audit.
