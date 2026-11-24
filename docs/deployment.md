# sysTrol ERP - Production Deployment Guide

This guide covers deploying sysTrol ERP in production using Docker Compose or standalone Linux servers.

---

## 1. System Architecture

sysTrol ERP consists of three primary components:
1. **Web Frontend (Nginx)**: Serves the compiled React SPA, handles client-side routing, enforces security headers, and proxies `/api/` traffic to the backend.
2. **Backend Application (Gunicorn + Django)**: Python 3.12 WSGI application serving DRF REST APIs, business logic, authorization rules, and database migrations.
3. **Database (PostgreSQL 16)**: Persistent relational database storing users, projects, timesheet entries, and audit logs.

```
                  +----------------------------------+
                  |           Client Browser         |
                  +----------------------------------+
                                   |
                             HTTPS (443/80)
                                   v
                  +----------------------------------+
                  |     Nginx Reverse Proxy / SPA    |
                  +----------------------------------+
                        |                      |
            / (SPA static files)        /api/* (HTTP Proxy)
                        |                      |
                        v                      v
                  [Static Build]      +--------------------+
                                      | Gunicorn / Django  |
                                      +--------------------+
                                               |
                                        PostgreSQL 16
```

---

## 2. Environment Configuration

Create a production `.env` file in the project root:

```ini
# Core Django Configuration
DEBUG=False
SECRET_KEY=generate-a-strong-random-64-character-secret-key-here
ALLOWED_HOSTS=erp.yourcompany.com,localhost

# Database Configuration
DATABASE_URL=postgres://systrol:your_secure_db_password@postgres:5432/systrol

# Company Timezone
COMPANY_TIMEZONE=Asia/Kolkata

# Super Administrator Credentials (Environment-Only, Not in Database)
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD_HASH=$argon2id$v=19$m=65536,t=3,p=4$your-generated-argon2-hash-here

# Security Headers & SSL
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
```

### Generating Super Admin Password Hash

Run the management command to generate an Argon2 password hash:

```bash
python backend/manage.py generate_super_admin_hash --password "YourStrongPassword123!"
```

Copy the generated hash into `SUPER_ADMIN_PASSWORD_HASH` in `.env`.

---

## 3. Docker Compose Deployment (Recommended)

### Step 1: Clone Repository and Configure Environment

```bash
git clone https://github.com/your-org/sysTrolERP.git
cd sysTrolERP
cp .env.example .env
# Edit .env with production secrets
nano .env
```

### Step 2: Build and Start Containers

```bash
docker compose up -d --build
```

### Step 3: Run Migrations and Verify Health

```bash
# Execute migrations
docker compose exec backend python manage.py migrate --noinput

# Collect static assets
docker compose exec backend python manage.py collectstatic --noinput

# Verify container health
docker compose ps
```

### Step 4: Run Deployment Smoke Test

```bash
python scripts/smoke_test_deploy.py --base-url http://localhost
```

---

## 4. Standalone Linux VM Deployment (Systemd + Nginx)

### Step 1: Install PostgreSQL 16

```bash
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16 python3.12 python3.12-venv python3.12-dev libpq-dev nginx
```

Create the database and database user:

```bash
sudo -u postgres psql -c "CREATE USER systrol WITH PASSWORD 'your_secure_db_password';"
sudo -u postgres psql -c "CREATE DATABASE systrol OWNER systrol;"
```

### Step 2: Set Up Backend

```bash
sudo useradd -r -s /bin/false -d /opt/systrol systrol
sudo mkdir -p /opt/systrol
sudo chown systrol:systrol /opt/systrol

cd /opt/systrol
sudo -u systrol git clone https://github.com/your-org/sysTrolERP.git app
cd /opt/systrol/app
sudo -u systrol python3.12 -m venv .venv
sudo -u systrol .venv/bin/pip install --upgrade pip setuptools
sudo -u systrol .venv/bin/pip install -e "backend"

sudo -u systrol .venv/bin/python backend/manage.py migrate
sudo -u systrol .venv/bin/python backend/manage.py collectstatic --noinput
```

### Step 3: Configure Systemd Service

Create `/etc/systemd/system/systrol-backend.service`:

```ini
[Unit]
Description=sysTrol ERP Backend Service
After=network.target postgresql.service

[Service]
User=systrol
Group=systrol
WorkingDirectory=/opt/systrol/app/backend
EnvironmentFile=/opt/systrol/app/.env
ExecStart=/opt/systrol/app/.venv/bin/gunicorn \
    --workers 4 \
    --threads 2 \
    --worker-class gthread \
    --bind 127.0.0.1:8000 \
    config.wsgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now systrol-backend
sudo systemctl status systrol-backend
```

---

## 5. Automated Maintenance & Cron Schedules

Configure cron jobs to execute automated week closing and telemetry log retention pruning:

```bash
sudo crontab -u systrol -e
```

Add the following entries:

```cron
# Auto-submit open timesheet weeks every Sunday at 23:59 company time
59 23 * * 0 /opt/systrol/app/.venv/bin/python /opt/systrol/app/backend/manage.py close_weeks

# Prune audit and request logs based on retention settings daily at 02:00
0 2 * * * /opt/systrol/app/.venv/bin/python /opt/systrol/app/backend/manage.py prune_logs
```

---

## 6. Backup and Recovery

### PostgreSQL Backup

```bash
# Automated daily backup
pg_dump -U systrol -h localhost -d systrol -F c -f /var/backups/systrol_$(date +%Y%m%d_%H%M%S).dump
```

### PostgreSQL Restore

```bash
pg_restore -U systrol -h localhost -d systrol --clean --if-exists /var/backups/systrol_20261124.dump
```
