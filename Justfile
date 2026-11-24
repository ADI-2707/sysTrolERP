default:
    @just --list

dev-backend:
    python backend/manage.py runserver 0.0.0.0:8000

dev-frontend:
    npm run dev --workspace=@systrol/web

build:
    npm run build --workspaces

test:
    pytest backend
    npm run test --workspaces

test-backend:
    pytest backend

test-frontend:
    npm run test --workspaces

test-e2e:
    npx playwright test

lint:
    python scripts/check_no_comments.py

audit:
    npm audit --omit=dev --audit-level=high
    pip-audit

smoke-deploy:
    python scripts/smoke_test_deploy.py

seed:
    python backend/manage.py seed_demo

migrate:
    python backend/manage.py migrate
