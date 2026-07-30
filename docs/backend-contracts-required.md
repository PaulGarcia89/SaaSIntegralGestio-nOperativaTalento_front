# Backend contracts required by the frontend

The frontend must not invent endpoints or silently persist production workflows in mock data.
The following contracts are required before completing the remaining high-priority flows.

## Secure session (A6)

- The backend must set the refresh token in an `HttpOnly`, `Secure`, `SameSite` cookie.
- Login and refresh responses should return only the short-lived access token to JavaScript.
- Refresh and logout must accept credentials from the cookie and rotate/revoke the session.
- CORS must allow credentials only from approved frontend origins.

Until this contract exists, moving the refresh token between Web Storage mechanisms does not
resolve XSS token extraction and would only disguise the risk.

## Branch context (A3)

Authenticated requests now send the selected authorized branch in `x-branch-id`, alongside
`x-tenant-id`. `/auth/me` remains the source of `allowedBranchIds` and `activeBranchId`.
The backend must reject a branch outside the authenticated user's allowed branch set.

## Subscription access (A4)

`/auth/me` may return:

```json
{
  "subscriptionStatus": "ACTIVE | TRIALING | PAST_DUE | GRACE_PERIOD | SUSPENDED",
  "subscriptionGraceEndsAt": "ISO-8601 timestamp or null"
}
```

When absent, the frontend temporarily falls back to the tenant status already returned by the
existing tenant contract.

## Production workflows (A7)

Contracts are still required for:

- password-reset request and reset-token confirmation;
- public company registration with administrator, plan and enabled modules;
- public vacancy detail and dynamic application form;
- application draft, document upload, validation and final submission;
- vacancy requirements, dynamic form, stages, owners, draft and publish transition;
- interviews, evaluations and reports currently represented by demonstration datasets.

Each endpoint must define validation errors, idempotency/double-submit behavior, tenant and branch
scope, upload limits, and the applicable `401`, `403`, `409`, `422`, `429` and `500` responses.
