# Employee 360 UX Audit

## Existing Foundations

- The canonical directory is `/employees`; `/people/employees` is already a compatibility route.
- `EmployeesDirectoryPage` supplies branch and status filters, table/card responsiveness, bulk actions, employee creation and shared design-system controls.
- `Employee360Page` already provides the employee header, employment assignments, audit history, onboarding documents and onboarding-derived compliance.
- Onboarding owns document lifecycle, review, expiration and legal compliance. Its document endpoints are reused rather than duplicated.
- Training and inventory are independent modules. Their current APIs are scoped to learner users or assets and do not expose a safe employee-id relationship; they must not be joined client-side by name or email.
- The design system supplies `PageHeader`, cards, tabs, dialogs, feedback states and responsive controls used by the employee area.

## Verified Employee API

`GET /employees/:id/payroll-compliance` returns a tenant- and branch-scoped, read-only employee snapshot with:

- Payroll configuration fields, currently nullable until a payroll integration persists them.
- Masked SSN only, never a full SSN.
- W-4, I-9, E-Verify and Florida New Hire statuses.
- Document and expiration summary, alerts, and employee audit entries.

The backend currently authorizes this endpoint with `employees.read`. It does not yet publish separate compensation, tax, sensitive-document or employee-audit permission codes, nor write endpoints for payroll/tax configuration. The UI therefore treats this snapshot as read-only and never tries to collect or submit sensitive values.

## Phase Delivered

- Employee 360: payroll, tax and eligibility, and masked audit surfaces sourced from the verified snapshot.
- Payroll empty state clearly identifies missing provider configuration rather than rendering placeholder salary data.
- Tax and eligibility use status text and icons, with document links only through the existing permitted document module.
- Auditable alerts and document expirations are surfaced without raw backend errors or sensitive-value diffs.

## Deferred Until Contracts Exist

- Persisting compensation, pay rate, payment method and tax/eligibility information.
- Permission separation for compensation, tax, sensitive documents and employee audit.
- Employee-scoped training, certifications, assets and productivity endpoints.
- Employee creation fields not accepted by `POST /employees`, including personal contact, dates, department, supervisor and payroll configuration.
