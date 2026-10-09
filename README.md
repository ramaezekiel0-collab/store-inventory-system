# Store Inventory System

A small inventory management application built as a multi-container stack. The project demonstrates Docker, Docker Compose, Nginx reverse proxy, PostgreSQL persistence, and a Jenkins pipeline that automatically builds, tests, deploys, and verifies the system.

## Team members and roles
- Project Lead / Scrum Master: [Student Name]
- DevOps / CI-CD Engineer: [Student Name]
- Infrastructure Engineer: [Student Name]
- Backend and Database Engineer: [Student Name]
- Frontend, QA & Documentation Lead: [Student Name]

## Project overview
This system includes a simple frontend for managing inventory items and placing basic customer orders. It is split into three application modules:

1. Frontend UI
   - Displays current stock
   - Allows adding inventory items
   - Shows the current build/version label

2. Inventory API
   - Reads and writes inventory data in PostgreSQL
   - Endpoints: `GET /health`, `GET /api/items`, `GET /api/items/:id`, `POST /api/items`, `PUT /api/items/:id`

3. Orders API
   - Records orders and statuses
   - Endpoints: `GET /health`, `GET /api/orders`, `POST /api/orders`, `PUT /api/orders/:id/status`

A PostgreSQL database stores the persistent data in a named Docker volume, and a reverse proxy directs traffic to the correct service.

## Architecture

- `Nginx` listens on port 80 and routes:
  - `/` → frontend
  - `/api/items/*` → inventory-api
  - `/api/orders/*` → orders-api
- `PostgreSQL` stores the inventory and order tables in `db-data`
- `Jenkins` runs in a separate Docker Compose stack and triggers on SCM changes

## Prerequisites
- Docker Desktop or Docker Engine
- Docker Compose
- Git
- Browser for verification

## Quick start
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd store-inventory-system
   ```

2. Copy the sample environment file and update values if needed:
   ```bash
   cp .env.example .env
   ```

3. Start the application stack:
   ```bash
   docker compose up -d --build
   ```

4. Open the app in the browser:
   ```text
   http://localhost
   ```

5. Check health endpoints:
   ```bash
   curl http://localhost/health
   curl http://localhost/api/items
   curl http://localhost/api/orders
   ```

## Stop the stack
```bash
docker compose down
```

To remove the persistent database volume:
```bash
docker compose down -v
```

## Jenkins setup
Start Jenkins from its own compose file:
```bash
cd infra/jenkins
docker compose up -d --build
```

Open:
```text
http://localhost:8081
```

Then:
1. Unlock Jenkins with the password from:
   ```bash
   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```
2. Install suggested plugins and Docker Pipeline
3. Create an admin user
4. Add credentials if needed for Git or environment secrets

## Jenkins pipeline
The repository includes a declarative `Jenkinsfile` with this flow:
- Checkout
- Test
- Build Images
- Deploy
- Smoke Test

The pipeline is set to check for changes with Poll SCM and can be upgraded to a GitHub webhook trigger for instant updates.

## Production-ready notes
This is a classroom/lab setup. For a real production deployment you would avoid mounting the host Docker socket directly and would use more isolated build agents or a dedicated CI/CD environment.

## Useful commands
```bash
docker compose ps
docker compose logs -f

docker exec -it store-postgres psql -U storeuser -d store_inventory
```

## File structure
```text
store-inventory-system/
├── .env.example
├── .gitignore
├── Jenkinsfile
├── docker-compose.yml
├── README.md
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── server.js
│   └── public/
│       ├── index.html
│       └── app.js
├── inventory-api/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── server.js
│   └── tests/
│       └── server.test.js
├── orders-api/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── server.js
│   └── tests/
│       └── server.test.js
├── proxy/
│   ├── Dockerfile
│   └── nginx.conf
├── db/
│   └── init.sql
├── infra/
│   └── jenkins/
│       ├── Dockerfile
│       └── docker-compose.yml
└── docs/
```
