# Employee 360 Frontend Design

## Navigation Map

`/employees` remains the canonical employee directory to preserve existing navigation. `/people/employees` is a compatibility alias and is not added as a duplicate navigation item.

- Personas
  - Empleados: `/employees`
  - Onboarding: existing onboarding routes
  - Compliance: existing onboarding compliance route
- Employee 360: `/employees/:id`

## Phase 1 Screens

### Directory

The directory prioritizes search, status, branch and operational state. Desktop uses a structured list; mobile uses employee cards. Selecting an employee opens Employee 360 rather than loading all employee data in the directory.

### New Employee

The employee flow is progressive: basic identity, employment assignment, then review. The current API persists legal display name, email, primary branch, job title and initial status. Personal contact details, compensation, department, supervisor and employment dates are intentionally not collected until their API contracts exist.

### Employee 360

The employee header contains the person, role, branch, active status and document count. Phase 1 enables Overview, Employment and History. Phase 2 adds Documents and Compliance from the employee's real onboarding flow. Compliance is an onboarding score derived from required tasks, blocked or overdue items, and backend alerts; it is not presented as a generic HR compliance record.

## Components

- `EmployeesDirectoryPage`: discovery, filters and list/card presentation.
- `EmployeeCreatePage`: staged employee creation.
- `Employee360Page`: progressive employee dossier.
- Existing `PageHeader`, `Card`, `Badge`, `Tabs`, `Dialog`, `MobileFilterSheet` and `AsyncState` remain the shared design-system primitives.

## States

- Loading: localized skeleton/loading state while the dossier query resolves.
- Empty: directory explains how to create the first employee.
- Error: maps API errors to a non-technical recovery message.
- Not found: Employee 360 returns users to the directory.
- Permission: route policies and `can()` govern available actions; the UI never infers access from role labels.

## Mobile Behavior

- Directory uses cards rather than a horizontally compressed table.
- Dossier tabs are horizontally scrollable.
- Header actions collapse to one primary action and a compact secondary action.
- Cards stack in a single column from 320px upward.

## Permissions

- Read: `employees.read`
- Create: `employees.create`
- Edit / transfer: `employees.update`
- Onboarding documents and onboarding compliance: `onboarding.view`
- Upload and approve onboarding documents: `onboarding.manage`
- Future compensation and sensitive-data actions require dedicated backend permissions before their UI is enabled.

## API Dependencies

Available now:

- `GET /employees`
- `POST /employees`
- `GET /employees/:id`
- `GET /employees/:id/history`
- `PATCH /employees/:id`
- `POST /employees/:id/transfer`
- `GET /onboarding/flows`
- `POST /onboarding/flows/:id/documents`
- `GET /onboarding/documents/:id/download`
- `PATCH /onboarding/documents/:id/review`

Required for later phases:

- Department, supervisor, hire/start dates and employment type.
- Phone, address, preferred name and protected date of birth.
- Compensation and sensitive-data permissions.
- Employee-scoped compliance, training, evaluations, certifications, assets, productivity and audit endpoints.
