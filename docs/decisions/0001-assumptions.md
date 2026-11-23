# ADR 0001: Initial Architecture Decisions and Assumptions

## Context
The sysTrol ERP system provides project step lifecycle tracking, timesheet management, and multi-role administration.

## Decisions

### 1. Step Count and Sequencing
Fourteen distinct steps are defined in forward order:
1. ENQUIRY
2. SALES_VISIT
3. PROCUREMENT
4. ENGINEERING
5. MANUFACTURING
6. DISPATCH
7. ERECTION
8. COMMISSIONING
9. COLD_TRIAL
10. HOT_TRIAL
11. PERFORMANCE_GUARANTEE_TEST
12. MOM_AND_HANDOVER
13. PAYMENT
14. AMC

Steps advance forward through statuses: NOT_STARTED -> INITIATED -> IN_PROGRESS -> COMPLETED. Overlapping steps are permitted.

### 2. Frontend Framework
React 18.3 with TypeScript 5.x and Vite 6. React Router 6 is used for navigation, and TanStack Query 5 manages server state.

### 3. Project Assignment Matrix
Admins manage explicit assignments linking employees to projects. Timesheet row entry is restricted to assigned, active projects.

### 4. Standard Working Hours and Break
Standard schedule spans 9:00 AM to 6:00 PM (9 hours total), structured as 8 regular hours plus a 1-hour lunch break. Excess time is recorded as overtime. Parameters are configurable by the super admin via policy settings.

### 5. Timesheet Authorization Workflow
Timesheet weeks follow the lifecycle: OPEN -> SUBMITTED -> APPROVED or RETURNED. Ended weeks automatically transition to SUBMITTED. RETURNED reopens only that specific week without allowing future day entries. Self-approval by admins is blocked.

### 6. User Hierarchy and Creation
Admins create, edit, and revoke employees. The super admin alone creates, restores, or revokes admins.

### 7. Super Admin Principal
The super admin principal is credentialed via environment variables (`SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD_HASH`) using Argon2, and does not exist as a database user row. Password rotation is restricted to a dedicated CLI command.

### 8. Authoritative Timezone
All date, time, and week boundary calculations are determined by the server using the configured company timezone (`Asia/Kolkata` by default).

### 9. Brand Assets
Application icons and palette tokens are derived programmatically from the source favicon asset, standardizing green (30%) and navy (10%) roles against neutral backgrounds (60%).
