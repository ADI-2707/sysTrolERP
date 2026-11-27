# sysTrol ERP - User Operations Manual

Welcome to the **sysTrol ERP User Operations Manual**. This document describes the operating procedures, business rules, workflows, and access control matrix for all sysTrol ERP modules.

---

## 1. Access Matrix & User Roles

sysTrol ERP enforces a strict three-tier role-based access model:

| Capability | Super Administrator | Administrator | Employee |
|---|---|---|---|
| **Own Timesheet Entry** | No (System Principal) | Yes | Yes |
| **View Team Timesheets** | Yes (All) | Yes (All) | No (Own only) |
| **Approve / Return Timesheets** | Yes (All) | Yes (Not own) | No |
| **Emergency Timesheet Override** | Yes (Audited) | No | No |
| **Create & Edit Projects** | Yes | Yes | No |
| **Manage Project Steps & Sub-steps** | Yes | Yes | No |
| **Assign Employees to Projects** | Yes | Yes | No |
| **Create & Revoke Employees** | Yes | Yes | No |
| **Create & Revoke Admins** | Yes | No | No |
| **Clear Account Lockout** | Yes | No | No |
| **Audit Logs & Telemetry View** | All (including Super-only) | General logs | No |
| **Export Audit Logs (CSV / Gzip)** | Yes | Yes | No |
| **Change Own Password** | Via CLI command only | Yes (Web UI) | Yes (Web UI) |

---

## 2. Time Tracking & Timesheet Management

### Company Hours & Policy
- **Standard Company Workday**: 09:00 to 18:00 (9 hours total), comprising **8 regular hours** and a **1-hour break**.
- **Timezone**: All company records and week boundaries operate under **Asia/Kolkata** (server-enforced).
- **Hour Increment**: Timesheet hours are logged in 0.25h (15-minute) increments.
- **Overtime Calculation**: Any hours logged beyond 8 regular hours per day are automatically tracked as overtime.

### Timesheet Editability Rules
A cell in the timesheet grid is editable if and only if all of the following conditions are met:
1. **Week Status**: The timesheet week status is `OPEN` or `RETURNED`.
2. **Date Boundaries**: The date belongs to the currently active Monday-to-Sunday week.
3. **No Future Dates**: The date is not after today (`date <= today`).
4. **Assignment**: The project is active and assigned to the employee.

### Timesheet Lifecycle Workflow
```
[ OPEN ] ──(Week End / Auto-Submit)──> [ SUBMITTED ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       v                                           v
                 [ APPROVED ]                                 [ RETURNED ]
              (Locked permanently)                   (Re-opened for corrections)
                                                                   │
                                                                   └──(Resubmit)──> [ SUBMITTED ]
```

- **Auto-Submission**: Every Sunday at 23:59 company time, the background worker automatically transitions all `OPEN` timesheets to `SUBMITTED`.
- **Review & Approval**: Administrators review submitted timesheets. An admin cannot approve their own timesheet.
- **Return with Reason**: If corrections are required, the reviewer returns the timesheet with an explanatory note. The week returns to `RETURNED` status, allowing the employee to correct past days.
- **Super Admin Override**: In exceptional circumstances, the Super Administrator can force an edit on any week with a mandatory audit justification.

---

## 3. Project Lifecycle Management

### 14 Canonical Stages
sysTrol projects follow a 14-stage standard execution pipeline:

1. `ENQUIRY`: Initial client enquiry and requirements capture.
2. `SALES_VISIT`: On-site client assessment and technical discussions.
3. `PROCUREMENT`: Material sourcing and vendor purchase orders.
4. `ENGINEERING`: Detailed design, schematics, and engineering sign-off.
5. `MANUFACTURING`: Production and assembly at fabrication facilities.
6. `DISPATCH`: Packaging, logistics, and shipping to client site.
7. `ERECTION`: Physical positioning and mechanical erection.
8. `COMMISSIONING`: Electrical, pneumatic, and control system setup.
9. `COLD_TRIAL`: Dry testing without materials/load.
10. `HOT_TRIAL`: Live testing under process load.
11. `PERFORMANCE_GUARANTEE_TEST`: Demonstration of contractual metrics.
12. `MOM_AND_HANDOVER`: Minutes of Meeting and client handover signing.
13. `PAYMENT`: Final billing and retention payment release.
14. `AMC`: Annual Maintenance Contract operations.

### Step Progression Rules
- **Status Options**: `NOT_STARTED` -> `INITIATED` -> `IN_PROGRESS` -> `COMPLETED`, plus terminal `SKIPPED`.
- **Forward-Only**: Once a step reaches `COMPLETED` or `SKIPPED`, it is permanently locked and cannot regress.
- **Predecessor Prerequisite (Option B)**: Step 1 (`ENQUIRY`) can initiate at any time. Any subsequent step can only initiate if its immediate predecessor is `IN_PROGRESS`, `COMPLETED`, or `SKIPPED`. Downstream steps cannot leapfrog unstarted predecessors.
- **Closure Hard Gates**: `MOM_AND_HANDOVER`, `PAYMENT`, and `AMC` have a hard barrier requiring all prior engineering, trial, and execution stages to be `COMPLETED` or `SKIPPED`.
- **Skipping Steps**: If a project scope excludes a stage (e.g. client handles civil/erection work), administrators can mark the step as `SKIPPED` with a documented reason. Skipped steps count as resolved and satisfy prerequisites for later steps.

### Sub-step Insertion Rules
Administrators can insert custom sub-steps to handle project-specific tasks:
- **Insertion Point**: Sub-steps are inserted *after* an existing step.
- **Boundaries**: Nothing can be inserted before `ENQUIRY` or after `AMC`.
- **Completed Step Boundary**: The chosen step position must be greater than or equal to the highest `COMPLETED` step. Completed history cannot be retroactively modified.
- **Editing & Deletion**: Only custom sub-steps can be deleted or renamed, and only while in `NOT_STARTED` status.

---

## 4. Employee Management & Security

### Account Creation
- Administrators create employee profiles.
- System automatically issues the next sequential employee code (`SYS-0001`, `SYS-0002`).
- A secure temporary password is generated and displayed once.
- Employees must change their password upon their initial login (`must_change_password` gate).

### Account Lockout
- **Threshold**: 5 consecutive failed login attempts within 15 minutes locks the account.
- **Resolution**: The lock expires automatically after 15 minutes, or the Super Administrator can immediately clear the lockout from the Admin Recovery panel.

### Revocation & Session Invalidation
- When an employee or administrator is revoked:
  - `is_active` is set to `False`.
  - All existing user sessions are instantly deleted from the database.
  - Any subsequent API requests using previous session cookies are immediately rejected with `401 Unauthorized`.

---

## 5. Audit Logging & Telemetry

### Append-Only Guarantee
All system mutations, administrative overrides, password resets, and approval decisions write immutable records to the `AuditLog` table. Modification or deletion of audit records is blocked at the database and application levels.

### Log Export
Administrators can export filtered audit trails directly from the Web UI:
- **CSV Export**: Direct download for spreadsheet review.
- **Gzip Export (`.csv.gz`)**: Compressed archive format for long-term compliance storage.
