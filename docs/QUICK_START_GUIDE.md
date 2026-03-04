# Heaven Bakers - Quick Start Guide

Access your application at **http://localhost:3000**!

## What You Have

✅ **Dockerized Application** - Backend, Frontend, and PostgreSQL in containers
✅ **PostgreSQL Database** - Fully integrated and persistent

## Setup Overview (2 Main Steps)

### 1️⃣ Install Docker Desktop
- Download from: https://docs.docker.com/desktop/install/windows-install/
- Install and restart your computer
- Open Docker Desktop and ensure it's running

### 2️⃣ Start Everything
```cmd
# Start Docker containers
cd C:\Users\dilan\OneDrive\Desktop\Heaven_bakers
docker compose up -d
```

## Access Your Application

🌐 **Main URL:** http://localhost:3000
🔐 **Login:** admin / admin123 (default credentials)

## Project Structure

```
Heaven_bakers/
├── backend/              # Node.js/Express API
│   ├── Dockerfile        # Backend container config
│   ├── src/             # API routes and services
│   └── .dockerignore    # Build optimization
│
├── frontend/            # React/Vite application
│   ├── Dockerfile       # Multi-stage build
│   ├── src/            # React components
│   └── .dockerignore   # Build optimization
│
├── docker-compose.yml   # Orchestrates all services
│
└── Documentation/
    ├── DOCKER.md                  # Docker deployment guide
    └── README_DOCKER_SETUP.md     # Docker quick start
```

## Key Configuration Files

### docker-compose.yml
Defines 3 services:
- **postgres** (port 5432) - Database
- **backend** (port 5000) - API server
- **frontend** (port 3000) - Web application

## Daily Operations

### Start Application
```cmd
# Terminal 1: Start Docker
cd C:\Users\dilan\OneDrive\Desktop\Heaven_bakers
docker compose up -d
```

### Stop Application
```cmd
# Stop Docker
cd C:\Users\dilan\OneDrive\Desktop\Heaven_bakers
docker compose down
```

### View Logs
```cmd
# Docker logs
docker compose logs -f
```

### Restart Services
```cmd
# Restart Docker containers
docker compose restart
```

## Troubleshooting

### Application Not Loading
1. Check Docker is running: `docker compose ps`
2. Check logs for errors

### Port Conflicts
```cmd
# Check what's using port 3000
netstat -ano | findstr :3000
```

### Database Connection Issues
```cmd
# Access database
docker compose exec postgres psql -U heaven_user -d Heaven_Bakers

# View backend logs
docker compose logs backend
```

## Environment Configuration

### Default Credentials
- **Database:** heaven_user / heaven_password
- **Admin User:** admin / admin123
- **JWT Secret:** (auto-generated, change in production)

### Change Credentials
Edit `.env` file or environment variables in `docker-compose.yml`

## Backup & Restore

### Backup Database
```cmd
docker compose exec postgres pg_dump -U heaven_user Heaven_Bakers > backup.sql
```

### Restore Database
```cmd
docker compose exec -T postgres psql -U heaven_user -d Heaven_Bakers < backup.sql
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Windows Host                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Browser: http://localhost:3000                       │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │ Docker: Frontend                                     │  │
│  │ Port 3000                                            │  │
│  │ (React/Vite/Serve)                                   │  │
│  └─────────┬────────────────────────────┬───────────────┘  │
│            │                            │                   │
│            │                            │                   │
│  ┌─────────▼──────────┐    ┌──────────▼────────────────┐  │
│  │ Docker: Backend    │    │ Docker: PostgreSQL        │  │
│  │ Port 5000          │    │ Port 5432                 │  │
│  │ (Node.js/Express)  │◄───┤ (Database)                │  │
│  └────────────────────┘    └───────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Persistent Volumes:                                  │ │
│  │  • postgres_data - Database storage                  │ │
│  │  • whatsapp_data - WhatsApp sessions                 │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Next Steps After Setup

1. ✅ Change default admin password
2. ✅ Update JWT secret in production
3. ✅ Set up automated database backups
4. ✅ Configure SSL/HTTPS for production
5. ✅ Review security settings

## Documentation Links

- **Docker Guide:** `DOCKER.md` - Detailed Docker operations
- **Docker Quick Start:** `README_DOCKER_SETUP.md` - Docker basics

## Support & Resources

- **Docker Docs:** https://docs.docker.com/
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

## Common Commands Reference

```cmd
# === DOCKER COMMANDS ===
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose ps                 # View running containers
docker compose logs -f            # Follow logs
docker compose restart            # Restart all services
docker compose build              # Rebuild images

# === SYSTEM COMMANDS ===
netstat -ano | findstr :3000        # Check port 3000 usage

# === DATABASE COMMANDS ===
docker compose exec postgres psql -U heaven_user -d Heaven_Bakers
```

## Production Deployment Notes

When deploying to production:

1. **Security:**
   - Change all default passwords
   - Use strong JWT_SECRET (32+ characters)
   - Enable HTTPS with SSL certificates
   - Update CORS settings

2. **Performance:**
   - Remove development volumes from docker-compose.yml
   - Enable gzip compression
   - Set up CDN for static assets
   - Configure proper caching headers

3. **Monitoring:**
   - Set up log aggregation
   - Configure health checks
   - Monitor resource usage
   - Set up alerts

4. **Backup:**
   - Automated daily database backups
   - Configuration file backups
   - Test restore procedures regularly

---

**Ready to start?** Follow the setup steps above, then access your application at **http://localhost:3000** 🚀
