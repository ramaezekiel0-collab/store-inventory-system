# Store Inventory System

A containerized multi-service inventory and order management system built with Docker, NGINX, PostgreSQL, and Jenkins. The project demonstrates full CI/CD automation: code is tested, Docker images are built, deployed, and verified by smoke tests before release.

## Project Overview

This project simulates a small e-commerce / retail management system with three main modules:

- Frontend: web UI served through a reverse proxy
- Inventory API: manages product inventory and stock data
- Orders API: manages customer orders and statuses
- Database: PostgreSQL for persistent storage
- Jenkins: runs the CI/CD pipeline to test, build, deploy, and verify the application

## Team Members and Roles

- Rama, Ezekiel P. â€” Project Lead / DevOps Engineer
- Ong, Jhieffer Drake S. â€” Backend Engineer
- Carbungco, Sherwin L. â€” Infrastructure Engineer
- Malong, Gian Jose B. â€” Frontend / QA Lead
- Paras, Rafael John S. â€” Documentation / Presentation Lead

## Architecture

```text
Browser
  |
  v
http://localhost/
  |
  v
NGINX Proxy (port 80)
  |------------------------------|
  |                              |
  v                              v
Frontend                     Inventory API
(port 3000)                  (port 5000)
  |                              |
  |                              v
  |                         PostgreSQL
  |                         (persistent volume)
  |
  v
Orders API
(port 5001)
```

## System Components

### 1. Frontend
- Provides the user-facing inventory and order interface
- Queries backend APIs through the reverse proxy
- Displays a visible build/version label for deployment verification

### 2. Inventory API
- Handles product inventory data
- Endpoints include:
  - GET /health
  - GET /api/items
  - POST /api/items

### 3. Orders API
- Handles customer orders and order status
- Endpoints include:
  - GET /health
  - GET /api/orders
  - POST /api/orders

### 4. PostgreSQL Database
- Stores application data in a named Docker volume
- Persists after container restarts or redeployments

### 5. Jenkins CI/CD Pipeline
- Runs inside a Docker container
- Pulls code from GitHub
- Runs tests
- Builds Docker images
- Deploys the stack
- Executes smoke tests for health and API endpoints

## Required Tools

- Docker Desktop / Docker Engine
- Docker Compose
- Git
- Jenkins running in Docker

## Prerequisites

Before starting the project, ensure the following are installed:

```bash
docker --version
docker compose version
git --version
```

## Local Setup

Clone the repository:

```bash
git clone https://github.com/ramaezekiel0-collab/store-inventory-system.git
cd store-inventory-system
```

Create your environment file:

```bash
cp .env.example .env
```

Start the full stack:

```bash
docker compose up -d --build
```

Check the containers:

```bash
docker compose ps
```

Verify services:

- Frontend: http://localhost/
- Inventory API: http://localhost/api/items
- Orders API: http://localhost/api/orders
- Health check: http://localhost/health

## Jenkins Setup

Jenkins is hosted separately from the application stack to keep the deployment environment isolated.

Start Jenkins:

```bash
cd infra/jenkins
docker compose up -d --build
```

Open Jenkins in the browser:

```text
http://localhost:8081
```

### Jenkins Requirements
- Install suggested plugins
- Add Docker Pipeline plugin
- Create admin user
- Verify Docker access using:

```bash
docker exec jenkins docker ps
```

### Jenkins Pipeline Trigger

For the classroom setup, the pipeline is configured to use Poll SCM or GitHub webhook-based trigger, depending on the environment.

A typical Poll SCM schedule is:

```text
H/2 * * * *
```

This checks the repository every 2 minutes.

## Jenkins Pipeline Stages

The Jenkinsfile is stored at the repository root and contains the following stages:

1. Checkout
2. Test
3. Build Images
4. Deploy
5. Smoke Test

### Pipeline Behavior
- If tests fail, the pipeline stops before deployment
- Broken changes do not reach the running application
- Images are tagged with the build number for traceability
- The deployment step uses the current version and shows whether the app is live

## Smoke Tests

The smoke test verifies:

- /health returns HTTP 200
- /api/items returns valid JSON data
- /api/orders returns valid JSON data

## Quality Gates and Deployment Safety

The project follows quality-gate rules:

- failing tests prevent deployment
- previous version stays live while a broken build is rejected
- PostgreSQL data remains after deployments because it is stored in a named volume
- older image tags can be redeployed for rollback

## Persistence and Rollback

### Database Persistence

PostgreSQL stores its data in a named Docker volume mounted at
`/var/lib/postgresql/data`. In this Compose project, the expected volume name is
`store-inventory-system-collab_db-data`.

List the volumes:

```powershell
docker volume ls
```

Check the database container and volume configuration:

```powershell
docker inspect store-postgres --format '{{json .Mounts}}'
```

Database records should remain after restarting or recreating the PostgreSQL
container as long as the named volume is retained. Never use `docker compose down -v`
when you need to preserve project data.

### Rollback Demonstration (PowerShell)

The current working release is version 24. Local images for the frontend and both
APIs are available for version 23, but a version 23 proxy image is not currently
available. Therefore, the example below rolls back only the frontend and API
services and leaves the existing proxy and database running.

First, confirm that the required images exist:

```powershell
docker image inspect store-inventory-system-collab/frontend:23
docker image inspect store-inventory-system-collab/inventory-api:23
docker image inspect store-inventory-system-collab/orders-api:23
```

Roll back those three services:

```powershell
$env:APP_VERSION = "23"
docker compose up -d --no-deps --no-build inventory-api orders-api frontend
```

Verify the deployment:

```powershell
docker compose ps
Invoke-WebRequest -UseBasicParsing http://localhost/health
Invoke-RestMethod http://localhost/api/items
Invoke-RestMethod http://localhost/api/orders
```

Restore version 24 afterward:

```powershell
$env:APP_VERSION = "24"
docker compose up -d --no-deps --no-build inventory-api orders-api frontend proxy
```

Verify the endpoints again before concluding the demonstration. The rollback
example assumes version 23 is compatible with the current database schema.
Do not claim a successful rollback until the commands and verification have
actually passed. Jenkins deployments use the Jenkins build number for image tags.

## Troubleshooting

### Jenkins cannot access Docker
Check:

```bash
docker exec jenkins docker ps
```

If it fails, ensure the Docker socket is mounted correctly and the Jenkins container is running with permissions to access it.

### NGINX returns 502 or 404
Verify the proxy configuration is routing `/api/items` and `/api/orders` correctly to the backend services.

### Duplicate key errors during tests
This was resolved by ensuring each test begins with a clean database state using `TRUNCATE TABLE` before each test run.

## Project Status

This project is complete and the full pipeline is working end-to-end:

- build succeeds
- tests pass
- images build
- deploy occurs
- smoke tests pass
- app is live on localhost

## Important Notes

- Real secrets must not be committed to Git
- Use `.env` locally and store production secrets in Jenkins Credentials
- Production-grade security would use dedicated build agents and controlled Docker permissions instead of mounting the host Docker socket directly

## References

- Docker Documentation
- Jenkins Documentation
- PostgreSQL Documentation
- NGINX Documentation

## License

This project is created for academic purposes under the course requirements for BSIT/ITE 303.

