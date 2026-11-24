# sysTrol ERP

Industrial enterprise resource planning system with 14-stage project tracking, strict daily timesheets, append-only audit logging, and role-based administration.

---

## Features

- **14-Stage Project Lifecycle**: Complete tracking across `ENQUIRY`, `SALES_VISIT`, `PROCUREMENT`, `ENGINEERING`, `MANUFACTURING`, `DISPATCH`, `ERECTION`, `COMMISSIONING`, `COLD_TRIAL`, `HOT_TRIAL`, `PERFORMANCE_GUARANTEE_TEST`, `MOM_AND_HANDOVER`, `PAYMENT`, and `AMC`.
- **Dynamic Sub-step Insertion**: Flexible sub-step insertion rules preserving historical completed milestones.
- **Strict Timesheet Workflow**: Cell-level editability rules, 0.25h increments, daily regular vs overtime hour tracking, automatic Sunday week submission, and multi-tier approval flows.
- **Security & Multi-Tier RBAC**: Super Administrator (env-only credentials), Administrators, and Employees with Argon2 password hashing, lockout throttles, and immediate revocation session termination.
- **Append-Only Audit & Telemetry**: Immutable audit trails, HTTP traffic capture, error logs with trace drawers, and streaming CSV/Gzip log exports.
- **Zero-Comment Architecture**: 100% comment-free source code across Python, TypeScript, and CSS enforced in CI.
- **Rigorous Test Suite**: 96% backend unit/integration coverage, full Vitest component & a11y (axe-core) suites, and Playwright critical journey E2E specs.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.12, Django 5.2 LTS, Django REST Framework, drf-spectacular, psycopg 3, Gunicorn |
| **Authentication** | Session cookies, CSRF protection, Argon2 hashing, environment-only Super Admin principal |
| **Database** | SQLite (development/tests), PostgreSQL 16 (production) |
| **Frontend** | Node 22 LTS, React 18.3, Vite 6, TypeScript 5.x (strict), React Router 6, TanStack Query 5 |
| **Design System** | Custom `@systrol/ui` design system with CSS Modules, token variables, light/dark themes, zero icon/UI libraries |
| **Testing** | pytest-django, coverage.py (85%+ gate), Vitest, Testing Library, axe-core, Playwright |
| **DevOps** | Multi-stage Dockerfiles, Docker Compose, Nginx reverse proxy, automated cron tasks |

---

## Documentation

- [Developer Setup Guide](docs/developer-setup-guide.md)
- [Production Deployment Guide](docs/deployment.md)
- [User Operations Manual](docs/user-manual.md)
- [OpenAPI 3.0 Specification](docs/openapi.json)
- [Initial Architecture Decisions](docs/decisions/0001-assumptions.md)

---

## Quick Start (Development)

```bash
# 1. Install frontend dependencies
npm ci

# 2. Set up backend virtual environment
python -m venv .venv
.\.venv\Scripts\pip install --upgrade pip setuptools
.\.venv\Scripts\pip install -e "backend[dev]"

# 3. Apply database migrations and seed demo data
npm run migrate
npm run seed

# 4. Start backend and frontend development servers
npm run dev:backend
npm run dev:frontend
```

---

## Production Deployment (Docker Compose)

```bash
# Build and run containers in background
docker compose up -d --build

# Run database migrations
docker compose exec backend python manage.py migrate --noinput

# Run deployment smoke test
python scripts/smoke_test_deploy.py --base-url http://localhost
```

---

## Testing & Quality Assurance

```bash
# Run all unit tests
npm test

# Run accessibility sweep
npm run test --workspace=@systrol/web -- src/test/a11ySweep.test.tsx

# Run dependency audits
npm run audit
& .\.venv\Scripts\pip-audit.exe

# Run comment checker (enforces zero comments)
python scripts/check_no_comments.py
```
