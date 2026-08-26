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

## Restaurant inventory Phase 1

The restaurant inventory API must enforce these rules server-side; hiding a button in the frontend is not an authorization control:

- Every request must validate that the authenticated tenant owns the selected branch and warehouse, and that the warehouse belongs to that branch.
- Mutating endpoints must accept `Idempotency-Key` and return the original result for a repeated key instead of applying a second inventory movement.
- Create, confirm, cancel and approve actions must have separate permission checks. At minimum: receipt create/confirm, recipe manage, operation create/confirm, count approve, adjustment create, transfer manage and inventory settings manage.
- Confirmed or approved documents must be immutable except through an explicit reversal workflow that creates a compensating movement.
- The API must expose the complete sales-import lifecycle: configure, column mapping, product mapping, preview, process and history. Current frontend adapters intentionally fail with `404` until these endpoints exist.
- Transactional operations must update the document, balances, lots and movements atomically, with a conflict response for stale previews or duplicate state transitions.

## Restaurant inventory Phase 3: advanced control

The advanced control workspace consumes these backend contracts. The frontend does not generate
FEFO, variance, shrinkage or audit facts locally:

- `GET /restaurant-inventory/alerts/expiry` returns lots ordered by expiration date, remaining
  quantity, days remaining and a server-calculated severity. `POST /restaurant-inventory/alerts/expiry/{id}/acknowledge`
  must be idempotent.
- `GET /restaurant-inventory/stock-count-schedules` and `POST /restaurant-inventory/stock-count-schedules`
  support partial scope (warehouse, zones or ingredients), recurrence and the next execution date.
- `GET /restaurant-inventory/analytics/variance` compares theoretical and counted quantities and
  costs for the selected tenant, branch, warehouse and period.
- `GET /restaurant-inventory/alerts/shrinkage` returns server-detected unexplained variance,
  threshold, cost impact and lifecycle status.
- `GET /restaurant-inventory/audit-log` returns append-only events. Events must be immutable,
  tenant-scoped and include actor, action, entity, timestamp, before/after snapshots and integrity
  metadata such as a hash or chain reference.
- Permissions must be evaluated per operation: expiry alert read, count scheduling, variance read,
  shrinkage read and audit read. Broad `restaurant_inventory.view/manage` permissions may remain as
  compatibility fallbacks during migration, but must not replace backend authorization.

## Restaurant inventory Phase 4: commercial intelligence

The commercial intelligence workspace consumes these backend contracts:

- `GET /restaurant-inventory/commercial/demand-forecast` returns forecast quantities, confidence
  and bounds by period, ingredient, branch and warehouse. The forecasting model and exclusions for
  stockouts or incomplete sales history must be calculated server-side.
- `GET /restaurant-inventory/commercial/branch-costs` returns purchase, consumption, inventory,
  food cost and variance metrics by branch and period.
- `GET /restaurant-inventory/commercial/recipe-margins` returns portions, revenue, cost, margin and
  margin percentage by recipe and period, using confirmed sales and current recipe costs.
- `GET /restaurant-inventory/commercial/unit-comparison` returns normalized metrics across branches
  or operating units with ranking and period-over-period change.
- `GET|POST /restaurant-inventory/commercial/commissaries` manages central production and its
  branch/item scope. Transfers and production remain separate inventory transactions.
- `GET|POST /restaurant-inventory/commercial/purchase-budgets` returns and creates budgets with
  committed, received, remaining and utilization values. Purchase confirmation must reject or flag
  budget overrun according to the configured policy.
- Permissions must include `restaurant_inventory.commercial.view`,
  `restaurant_inventory.commissary.manage` and `restaurant_inventory.budgets.manage`.
- All metrics must be tenant-scoped, branch-aware, period-filterable and based only on confirmed
  transactions. Mutations require idempotency and an immutable audit event.
