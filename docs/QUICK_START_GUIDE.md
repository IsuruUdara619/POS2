# Heaven Bakers - Quick Start Guide

Access your application at **http://heavenbaker.com/application** instead of localhost!

## What You Have

✅ **Dockerized Application** - Backend, Frontend, and PostgreSQL in containers
✅ **Nginx Reverse Proxy** - Clean URL routing on Windows
✅ **Custom Domain** - Access via heavenbaker.com locally
✅ **PostgreSQL Database** - Fully integrated and persistent

## Setup Overview (3 Main Steps)

### 1️⃣ Install Docker Desktop
- Download from: https://docs.docker.com/desktop/install/windows-install/
- Install and restart your computer
- Open Docker Desktop and ensure it's running

### 2️⃣ Install & Configure Nginx
- Download from: http://nginx.org/en/download.html
- Extract to `C:\nginx`
- Configure as per `NGINX_WINDOWS_SETUP.md`

### 3️⃣ Start Everything
```cmd
# Start Docker containers
cd C:\Users\dilan\OneDrive\Desktop\Heaven_bakers
docker compose up -d

# Start Nginx (from another terminal)
cd C:\nginx
start nginx
```

## Access Your Application

🌐 **Main URL:** http://heavenbaker.com/application
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
│   ├── nginx.conf       # Container nginx config
│   ├── src/            # React components
│   └── .dockerignore   # Build optimization
│
├── docker-compose.yml   # Orchestrates all services
├── nginx-reverse-proxy.conf  # Windows nginx config
│
└── Documentation/
    ├── NGINX_WINDOWS_SETUP.md    # Detailed nginx setup
    ├── DOCKER.md                  # Docker deployment guide
    └── README_DOCKER_SETUP.md     # Docker quick start
```

## Key Configuration Files

### docker-compose.yml
Defines 3 services:
- **postgres** (port 5432) - Database
- **backend** (port 5000) - API server
- **frontend** (port 8080) - Web application

### nginx-reverse-proxy.conf
Routes requests:
- `heavenbaker.com/application` → Frontend (8080)
- `heavenbaker.com/application/api/*` → Backend (5000)

### Windows hosts file
Maps domain to localhost:
```
127.0.0.1    heavenbaker.com
```

## Daily Operations

### Start Application
```cmd
# Terminal 1: Start Docker
cd C:\Users\dilan\OneDrive\Desktop\Heaven_bakers
docker compose up -d

# Terminal 2: Start Nginx
cd C:\nginx
start nginx
```

### Stop Application
```cmd
# Stop Nginx
cd C:\nginx
nginx -s stop

# Stop Docker
cd C:\Users\dilan\OneDrive\Desktop\Heaven_bakers
docker compose down
```

### View Logs
```cmd
# Docker logs
docker compose logs -f

# Nginx logs
cd C:\nginx\logs
type error.log
type access.log
```

### Restart Services
```cmd
# Restart Docker containers
docker compose restart

# Reload Nginx config
cd C:\nginx
nginx -s reload
```

## Troubleshooting

### Application Not Loading
1. Check Docker is running: `docker compose ps`
2. Check Nginx is running: `tasklist | findstr nginx`
3. Verify hosts file: `ping heavenbaker.com`
4. Check logs for errors

### Port Conflicts
```cmd
# Check what's using port 80
netstat -ano | findstr :80

# Stop IIS if needed
iisreset /stop
```

### Database Connection Issues
```cmd
# Access database
docker compose exec postgres psql -U heaven_user -d Heaven_Bakers

# View backend logs
docker compose logs backend
```

### 502 Bad Gateway
- Ensure Docker containers are running
- Restart Docker: `docker compose restart`
- Check nginx config: `nginx -t`

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
│  │ Browser: http://heavenbaker.com/application          │  │
│  └───────────────────────┬──────────────────────────────┘  │
│                          │                                  │
│  ┌───────────────────────▼──────────────────────────────┐  │
│  │ Nginx Reverse Proxy (Port 80)                        │  │
│  │ C:\nginx\                                            │  │
│  └─────────┬────────────────────────────┬───────────────┘  │
│            │                            │                   │
│  ┌─────────▼──────────┐    ┌──────────▼────────────────┐  │
│  │ Docker: Frontend   │    │ Docker: Backend          │  │
│  │ Port 8080          │    │ Port 5000                │  │
│  │ (React/Vite/Nginx) │◄───┤ (Node.js/Express)        │  │
│  └────────────────────┘    └──────────┬────────────────┘  │
│                                       │                    │
│                            ┌──────────▼────────────────┐  │
│                            │ Docker: PostgreSQL        │  │
│                            │ Port 5432                 │  │
│                            │ (Database)                │  │
│                            └───────────────────────────┘  │
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

- **Nginx Setup:** `NGINX_WINDOWS_SETUP.md` - Complete nginx installation guide
- **Docker Guide:** `DOCKER.md` - Detailed Docker operations
- **Docker Quick Start:** `README_DOCKER_SETUP.md` - Docker basics

## Support & Resources

- **Nginx Docs:** http://nginx.org/en/docs/
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

# === NGINX COMMANDS ===
cd C:\nginx
start nginx                       # Start nginx
nginx -s stop                     # Stop nginx
nginx -s reload                   # Reload config
nginx -t                          # Test config
tasklist | findstr nginx          # Check if running

# === SYSTEM COMMANDS ===
ping heavenbaker.com              # Test domain resolution
netstat -ano | findstr :80        # Check port 80 usage
ipconfig /flushdns                # Clear DNS cache

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

**Ready to start?** Follow the setup steps above, then access your application at **http://heavenbaker.com/application** 🚀
