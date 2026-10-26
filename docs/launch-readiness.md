# BizBridge Launch Readiness

This checklist separates checks verified in the source/test environment from
checks that require the production hosting and database accounts.

## Verified in the repository

- The frontend API base URL is configured in
  `BizBridge.Client/api-config.js`.
- The API CORS policy includes the production Netlify and Pages origins.
- Public Explore posts and products respond successfully from the deployed API.
- The production frontend and API CORS preflight were reachable during the
  October 2026 launch review.
- API integration tests use an isolated SQLite database and do not mutate
  production data.

## Production configuration — verify in the hosting dashboard

Set secrets in the API host's protected environment settings, not in
`appsettings.json`, the frontend, source control, or browser storage:

- `ConnectionStrings__DefaultConnection`
- `Jwt__Key` (use a strong, randomly generated signing key)
- `Jwt__Issuer` and `Jwt__Audience` (match the values expected by the API)
- Cloudinary credentials if production image uploads are enabled:
  `Cloudinary__CloudName`, `Cloudinary__ApiKey`, and `Cloudinary__ApiSecret`

After changing settings, restart/redeploy the API and verify registration,
login, image uploads (if enabled), and the public Explore endpoints. Never
paste production credentials into an issue, chat, commit, or test output.

## Database migrations — do not run before backup verification

The migrations in `BizBridge.Api/Migrations` describe the intended schema, but
the local launch review could not determine which migrations are applied:
the local connection-string setting is a placeholder. This is not evidence
that the production database is current.

Before applying migrations:

1. Confirm the production database and target environment in the provider
   dashboard.
2. Take a fresh provider-managed backup and confirm it completed.
3. Confirm a restore to a separate staging database has been tested.
4. Review pending migrations and any destructive operations.
5. Apply migrations from a secured deployment environment with credentials
   supplied through that environment; do not place a connection string in a
   command history or source file.
6. Verify application startup and core flows against the migrated database.

Use EF Core's migration-list command with the secured deployment environment
to inspect applied/pending migrations. Only run `dotnet ef database update`
after the steps above and explicit approval for the target database.

## Backup and recovery policy

Configure and record these values in the database provider:

- Automated backup frequency and retention period.
- Recovery point objective (maximum acceptable data loss) and recovery time
  objective (maximum acceptable restoration time).
- Point-in-time recovery availability, if supported.
- Named owner responsible for monitoring backup failures.
- Date and result of the most recent restore drill into a non-production
  database.

A backup is not considered verified until a restore has succeeded and the
application can read the restored data. Do not test restoration over the
production database.

## Errors and support channel

The API emits a sanitized Problem Details response for unhandled exceptions;
server-side logs should retain diagnostic details. Review host logs without
exposing tokens, passwords, connection strings, or personal financial data.

The approved public support link is
<https://bizbridgefrontend.netlify.app/explore.html>. It is displayed in the
landing page, Explore page, and dashboard footers. This currently points to
Explore rather than a dedicated support form or contact page; replace it with
an actual support channel when one is available.
