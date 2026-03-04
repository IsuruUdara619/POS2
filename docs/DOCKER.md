# Docker Deployment Guide for Heaven Bakers

This guide explains how to run the Heaven Bakers application using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose v2.0 or higher
- 2GB available RAM
- 10GB available disk space

## Quick Start

1. **Clone the repository** (if not already done)
   ```bash
   cd Heaven_bakers
   ```

2. **Configure environment variables** (optional)
   ```bash
   cp .env.docker .env
   # Edit .env with your preferred values
   ```

3. **Build and start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - PostgreSQL: localhost:5432

5. **View logs**
   ```bash
   docker-compose logs -f
   ```

## Detailed Instructions

### Building the Images

Build all Docker images:
```bash
docker-compose build
```

Build a specific service:
```bash
docker-compose build backend
docker-compose build frontend
```

Force rebuild without cache:
```bash
docker-compose build --no-cache
```

### Starting Services

Start all services in detached mode:
```bash
docker-compose up -d
```

Start with logs visible:
```bash
docker-compose up
```

Start specific services:
```bash
docker-compose up -d postgres backend
```

### Stopping Services

Stop all services:
```bash
docker-compose down
```

Stop and remove volumes (⚠️ destroys database data):
```bash
docker-compose down -v
```

### Viewing Logs

View logs for all services:
```bash
docker-compose logs -f
```

View logs for a specific service:
```bash
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f frontend
```

### Database Management

#### Access PostgreSQL CLI
```bash
docker-compose exec postgres psql -U heaven_user -d Heaven_Bakers
```

#### Backup Database
```bash
docker-compose exec postgres pg_dump -U heaven_user Heaven_Bakers > backup.sql
```

#### Restore Database
```bash
docker-compose exec -T postgres psql -U heaven_user -d Heaven_Bakers < backup.sql
```

#### View Database Data
```bash
# List tables
docker-compose exec postgres psql -U heaven_user -d Heaven_Bakers -c "\dt"

# Query data
docker-compose exec postgres psql -U heaven_user -d Heaven_Bakers -c "SELECT * FROM users;"
```

### Container Management

#### View running containers
```bash
docker-compose ps
```

#### Restart a service
```bash
docker-compose restart backend
docker-compose restart postgres
```

#### Execute commands in a container
```bash
# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh

# Run npm commands
docker-compose exec backend npm run typecheck
```

#### View resource usage
```bash
docker stats
```

## Configuration

### Environment Variables

The following environment variables can be customized in `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key-change-in-production` |
| `ADMIN_USERNAME` | Default admin username | `admin` |
| `ADMIN_PASSWORD` | Default admin password | `admin123` |

### Database Connection

The backend connects to PostgreSQL using Docker's internal networking:
- **Host**: `postgres` (container name)
- **Port**: `5432`
- **Database**: `Heaven_Bakers`
- **Username**: `heaven_user`
- **Password**: `heaven_password`

Connection string:
```
postgres://heaven_user:heaven_password@postgres:5432/Heaven_Bakers
```

### Port Mappings

| Service | Container Port | Host Port |
|---------|---------------|-----------|
| Frontend | 3000 | 3000 |
| Backend | 5000 | 5000 |
| PostgreSQL | 5432 | 5432 |

To change host ports, edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"  # Map to host port 8080 instead
```

## Data Persistence

Docker volumes ensure data persists across container restarts:

- **postgres_data**: PostgreSQL database files
- **whatsapp_data**: WhatsApp Web session data

### View volumes
```bash
docker volume ls
```

### Inspect a volume
```bash
docker volume inspect heaven_bakers_postgres_data
```

### Backup volumes
```bash
docker run --rm -v heaven_bakers_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## Development Mode

For development with hot-reload, uncomment the volume mounts in `docker-compose.yml`:

```yaml
backend:
  volumes:
    - ./backend:/app
    - /app/node_modules
```

Then restart:
```bash
docker-compose up -d backend
```

## Production Deployment

For production:

1. **Update environment variables** with strong secrets
   ```bash
   JWT_SECRET=generate-a-strong-random-secret-here
   ADMIN_PASSWORD=use-a-strong-password
   ```

2. **Update database credentials** in `docker-compose.yml`
   ```yaml
   POSTGRES_PASSWORD: use-a-strong-password-here
   ```

3. **Remove development volumes** from `docker-compose.yml`

4. **Use environment variables** for sensitive data
   ```bash
   docker-compose --env-file .env.production up -d
   ```

5. **Set up automatic backups** for the database

## Troubleshooting

### Backend cannot connect to database
```bash
# Check if postgres is healthy
docker-compose ps postgres

# View postgres logs
docker-compose logs postgres

# Verify network connectivity
docker-compose exec backend ping postgres
```

### Port already in use
```bash
# Check what's using the port
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # macOS/Linux

# Change port in docker-compose.yml
ports:
  - "5001:5000"  # Use different host port
```

### Container keeps restarting
```bash
# View logs to see error
docker-compose logs backend

# Check container status
docker-compose ps

# Remove and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Clear everything and start fresh
```bash
# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

### Database initialization issues
```bash
# Remove postgres volume and recreate
docker-compose down
docker volume rm heaven_bakers_postgres_data
docker-compose up -d
```

## Monitoring

### Health Checks

PostgreSQL has a built-in health check. View status:
```bash
docker-compose ps
```

### View Container Stats
```bash
docker stats heaven_bakers_backend heaven_bakers_frontend heaven_bakers_db
```

### Monitor Logs
```bash
# Follow all logs
docker-compose logs -f

# Filter logs
docker-compose logs -f backend | grep ERROR
```

## Updating the Application

1. **Pull latest changes**
   ```bash
   git pull
   ```

2. **Rebuild images**
   ```bash
   docker-compose build
   ```

3. **Restart services**
   ```bash
   docker-compose up -d
   ```

4. **Verify**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

## Security Best Practices

1. ✅ Change default passwords in production
2. ✅ Use strong JWT_SECRET (min 32 characters)
3. ✅ Keep Docker and images updated
4. ✅ Limit exposed ports (comment out postgres port in production)
5. ✅ Use Docker secrets for sensitive data
6. ✅ Regular database backups
7. ✅ Enable firewall rules
8. ✅ Use HTTPS in production

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

## Support

For issues or questions:
1. Check logs: `docker-compose logs -f`
2. Review this documentation
3. Check Docker and Docker Compose versions
4. Ensure sufficient system resources
