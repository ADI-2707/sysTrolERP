# sysTrol ERP Developer Setup Guide

This guide covers setting up, running, testing, and developing sysTrol ERP locally.

---

## 1. System Requirements

- **Node.js**: `v22.x LTS` or higher
- **npm**: `v10.x` or higher
- **Python**: `3.11` or `3.12`
- **Database**:
  - Development: SQLite (built-in default)
  - Production: PostgreSQL 16+

---

## 2. Monorepo Architecture

```
systrol-erp/
  backend/
    config/settings/     # Split settings (base, dev, prod, test)
    apps/
      core/              # Common utilities, error envelope, timezone, health
      accounts/          # Custom User, authentication, Argon2, super admin
      employees/         # Employee directory, creation, edit, recovery
      projects/          # 14 standard steps, sub-steps, assignments
      timesheets/        # Weekly timesheet grid, submission, authorization
      audit/             # Append-only audit logs, export streaming
      telemetry/         # HTTP request logs, error traces, summary metrics
  frontend/
    apps/
      web/               # Vite + React 18 SPA application
    packages/
      ui/                # Zero-dependency design system & SVG charts
  scripts/               # Comment-free scanner & verification scripts
  docs/                  # Architecture decisions and developer guides
  Justfile               # Task runner definitions
```

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env` in the repository root:

```bash
cp .env.example .env
```

### Environment Keys

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DEBUG` | Enables Django debug mode and detailed logs | `True` (dev) / `False` (prod) |
| `SECRET_KEY` | Cryptographic secret for signing sessions & tokens | High-entropy random string |
| `DATABASE_URL` | Database connection URL (SQLite or PostgreSQL) | `sqlite:///db.sqlite3` |
| `COMPANY_TIMEZONE` | Single company timezone for week calculations | `Asia/Kolkata` |
| `SUPER_ADMIN_USERNAME` | Principal username for the host-seeded super admin | `superadmin` |
| `SUPER_ADMIN_PASSWORD_HASH` | Argon2 hash of the super admin password | Generated via CLI |
| `ALLOWED_HOSTS` | Comma-separated allowed hostnames | `localhost,127.0.0.1` |

---

## 4. Super Admin Credentials Setup

The Super Admin account is an unmanaged system principal seeded via environment variables rather than database records. Its password cannot be changed via the web UI.

To generate an Argon2 password hash:

```bash
python backend/manage.py generate_super_admin_hash
```

Enter your chosen master password when prompted. The command prints the Argon2 hash string. Copy this value into your `.env` file:

```ini
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD_HASH=$argon2id$v=19$m=65536,t=3,p=4$...
```

---

## 5. Database Setup & Seeding

Run database migrations to initialize tables and constraints:

```bash
npm run migrate
# or: python backend/manage.py migrate
```

### Seeding Demo Data

The seeder creates:
- **4 Administrators**: `Alice Henderson` (`SYS-0001`), `Bob Vance` (`SYS-0002`), `Charlie Patel` (`SYS-0003`), `Diana Prince` (`SYS-0004`)
- **60 Employees**: `SYS-0005` to `SYS-0064` across Engineering, Manufacturing, Quality, Sales, and Field Service
- **12 Industrial Projects**: Varied progress through 14 standard steps, plus custom sub-steps
- **Assignments**: Cross-project employee team assignments
- **3 Weeks of Timesheets**: Historical approved records, submitted records with returned notes, and current open week

```bash
npm run seed
# or: python backend/manage.py seed_demo
```

To wipe and re-seed from scratch:

```bash
npm run seed:fresh
# or: python backend/manage.py seed_demo --clear
```

### Default Demo Credentials

| Role | Username / Identifier | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | Configured in `.env` | Full system access, recovery, audit telemetry, timesheet policy |
| **Administrator** | `SYS-0001` or `alice.henderson@systrol.local` | `DemoAdmin123!` | Projects, employees, timesheet approvals, system audit |
| **Administrator** | `SYS-0002` or `bob.vance@systrol.local` | `DemoAdmin123!` | Projects, employees, timesheet approvals, system audit |
| **Employee** | `SYS-0005` or `aarav.chopra.5@systrol.local` | `DemoUser123!` | Own timesheets, assigned projects view |

---

## 6. Running the Development Servers

### Frontend & Backend (Separate Terminals)

**Terminal 1 - Backend API:**
```bash
python backend/manage.py runserver 0.0.0.0:8000
```

**Terminal 2 - Frontend SPA:**
```bash
npm run dev --workspace=@systrol/web
```

The frontend will be available at `http://localhost:5173`, proxying `/api` requests to `http://localhost:8000`.

---

## 7. Testing & Quality Enforcement

### Zero Comments Policy
Source code files in this monorepo (`.py`, `.ts`, `.tsx`, `.css`, `.js`) must contain **zero comments**. Run the automated checker before every commit:

```bash
python scripts/check_no_comments.py
```

### Backend Test Suite
```bash
pytest backend
```

### Frontend Test Suite
```bash
npm run test --workspaces
```

### Full Production Build
```bash
npm run build --workspaces
```

---

## 8. Root Task Runner Commands

sysTrol supports both npm scripts and `just` commands:

| Action | npm command | just command |
| :--- | :--- | :--- |
| Run frontend dev | `npm run dev` | `just dev-frontend` |
| Run backend dev | `npm run dev:backend` | `just dev-backend` |
| Build all packages | `npm run build` | `just build` |
| Run all tests | `npm run test` | `just test` |
| Run backend tests | `npm run test:backend` | `just test-backend` |
| Run frontend tests | `npm run test:frontend` | `just test-frontend` |
| Check comment rules | `npm run lint` | `just lint` |
| Seed demo data | `npm run seed` | `just seed` |
| Apply migrations | `npm run migrate` | `just migrate` |
