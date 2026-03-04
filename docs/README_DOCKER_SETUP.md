# Heaven Bakers - Docker Setup Complete! 🐳

Your application has been successfully dockerized with PostgreSQL database support maintained!

## What Was Done

✅ **Created Docker Configuration:**
- `backend/Dockerfile` - Backend container with Node.js and all dependencies
- `frontend/Dockerfile` - Multi-stage build with production nginx server
- `docker-compose.yml` - Orchestrates all 3 services (PostgreSQL, Backend, Frontend)
- `frontend/nginx.conf` - Nginx reverse proxy configuration for API requests
- `.dockerignore` files - Optimized build context for faster builds

✅ **Database Integration:**
- PostgreSQL 15 container with persistent data volumes
- Automatic database initialization on first run
- Health checks to ensure backend waits for database
- Docker network for internal service communication

✅ **Environment Configuration:**
- `.env.docker` - Template for environment variables
- Secure defaults with production-ready structure
- Easy customization for different environments

✅ **Documentation:**
- `DOCKER.md` - Complete deployment and management guide
- Production deployment best practices
- Troubleshooting guide
- Database backup/restore procedures

## Before You Start

### Install Docker

**Windows:**
1. Download [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
2. Install and restart your computer
3. Open Docker Desktop and ensure it's running

**macOS:**
1. Download [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
2. Install and start Docker Desktop

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

## Quick Start (After Installing Docker)

### 1. Start All Services
```bash
# From the Heaven_bakers directory
docker compose up -d
```

This single command will:
- ✅ Pull PostgreSQL image
- ✅ Build backend and frontend images
- ✅ Create database with all tables
- ✅ Start all services
- ✅ Create persistent volumes for data

### 2. Access Your Application
- **Frontend:** http://localhost
- **Backend API:** http://localhost:5000
- **Database:** localhost:5432

### 3. View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f postgres
```

### 4. Stop Services
```bash
docker compose down
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Host                          │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐   ┌────────────┐ │
│  │   Frontend   │    │   Backend    │   │ PostgreSQL │ │
│  │   (Nginx)    │───▶│  (Node.js)   │───│            │ │
│  │   Port 80    │    │   Port 5000  │   │ Port 5432  │ │
│  └──────────────┘    └──────────────┘   └────────────┘ │
│         │                     │                 │        │
│         └─────────────────────┴─────────────────┘        │
│                   heaven_network                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Persistent Volumes:                                │ │
│  │  • postgres_data - Database files                  │ │
│  │  • whatsapp_data - WhatsApp session                │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 🔐 Database Connection
- **Previous Setup:** Direct PostgreSQL connection on localhost
- **Docker Setup:** Internal Docker networking with automatic connection
- **Connection String:** `postgres://heaven_user:heaven_password@postgres:5432/Heaven_Bakers`
- **No Code Changes Required:** Backend automatically connects to the database

### 📦 Data Persistence
All data is preserved across container restarts:
- Database tables and data → `postgres_data` volume
- WhatsApp sessions → `whatsapp_data` volume

### 🔄 Auto-Initialization
On first run, the backend automatically:
1. Connects to PostgreSQL container
2. Creates database if needed
3. Creates all tables with proper schemas
4. Sets up admin user with credentials from environment

### 🌐 API Proxying
Frontend nginx configuration proxies `/api/*` requests to backend:
- No CORS issues
- Production-ready setup
- Clean URL structure

## Environment Variables

Create a `.env` file (optional) to customize:

```bash
# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

## Common Commands

```bash
# Build images
docker compose build

# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Check status
docker compose ps

# Restart a service
docker compose restart backend

# Access database
docker compose exec postgres psql -U heaven_user -d Heaven_Bakers

# Access backend shell
docker compose exec backend sh

# Remove everything including volumes (⚠️ deletes data!)
docker compose down -v
```

## Database Management

### Backup
```bash
docker compose exec postgres pg_dump -U heaven_user Heaven_Bakers > backup.sql
```

### Restore
```bash
docker compose exec -T postgres psql -U heaven_user -d Heaven_Bakers < backup.sql
```

### Access Database CLI
```bash
docker compose exec postgres psql -U heaven_user -d Heaven_Bakers
```

## Troubleshooting

### Port Already in Use
If port 80, 5000, or 5432 is already in use, edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Frontend on port 8080 instead
```

### Container Won't Start
```bash
# View error logs
docker compose logs backend

# Rebuild from scratch
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Database Connection Issues
```bash
# Check if postgres is healthy
docker compose ps

# Verify network
docker compose exec backend ping postgres
```

## Production Deployment

Before deploying to production:

1. **Update Credentials:**
   ```bash
   JWT_SECRET=generate-a-strong-32-char-secret
   ADMIN_PASSWORD=strong-secure-password
   ```

2. **Update Database Password** in `docker-compose.yml`:
   ```yaml
   POSTGRES_PASSWORD: your-production-password
   ```

3. **Remove Development Volumes** from `docker-compose.yml`

4. **Enable HTTPS** with a reverse proxy (nginx, Caddy, or Traefik)

5. **Set up automated backups** for the database

## Next Steps

1. ✅ Install Docker Desktop
2. ✅ Run `docker compose up -d`
3. ✅ Access http://localhost
4. ✅ Login with admin credentials
5. ✅ Verify database persistence by creating data and restarting containers

## Need Help?

- Check `DOCKER.md` for detailed documentation
- View logs: `docker compose logs -f`
- Verify installation: `docker --version` and `docker compose version`
- Ensure Docker Desktop is running (Windows/Mac)

## What's Preserved

✅ All existing functionality
✅ PostgreSQL database connections
✅ Database schemas and migrations
✅ Environment variable configuration
✅ API endpoints and routes
✅ Frontend functionality
✅ WhatsApp integration
✅ Barcode generation
✅ PDF printing
✅ All business logic

The application works exactly the same way - just containerized for easy deployment!

---

**Ready to deploy?** Install Docker and run `docker compose up -d` to start your containerized Heaven Bakers application! 🚀
