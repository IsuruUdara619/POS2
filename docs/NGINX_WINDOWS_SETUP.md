# Nginx Setup Guide for Windows - Heaven Bakers

This guide will help you set up Nginx as a reverse proxy on Windows to access your Heaven Bakers application at **http://heavenbaker.com/application**

## Prerequisites

- Windows 10/11 or Windows Server
- Docker Desktop installed and running
- Administrator access to your computer

## Architecture Overview

```
Browser (http://heavenbaker.com/application)
         ↓
    Nginx on Windows (Port 80)
         ↓
    ├─→ Frontend Docker Container (Port 8080)
    └─→ Backend Docker Container (Port 5000)
         ↓
    PostgreSQL Docker Container (Port 5432)
```

## Step 1: Download and Install Nginx for Windows

### Option A: Official Build (Recommended)

1. **Download Nginx:**
   - Go to http://nginx.org/en/download.html
   - Download the latest stable Windows version (e.g., `nginx-1.24.0.zip`)

2. **Extract Nginx:**
   ```cmd
   # Extract to a simple path like:
   C:\nginx
   ```

3. **Verify Installation:**
   ```cmd
   cd C:\nginx
   nginx -v
   ```

### Option B: Using Chocolatey

```powershell
# Run PowerShell as Administrator
choco install nginx -y
```

## Step 2: Configure Windows Hosts File

1. **Open Notepad as Administrator:**
   - Search for "Notepad" in Start Menu
   - Right-click → "Run as administrator"

2. **Open hosts file:**
   ```
   File → Open → C:\Windows\System32\drivers\etc\hosts
   ```

3. **Add this line at the end:**
   ```
   127.0.0.1    heavenbaker.com
   127.0.0.1    www.heavenbaker.com
   ```

4. **Save the file** (Ctrl+S)

5. **Verify the change:**
   ```cmd
   ping heavenbaker.com
   ```
   You should see: `Pinging heavenbaker.com [127.0.0.1]`

## Step 3: Configure Nginx

### Replace Nginx Configuration

1. **Navigate to nginx config directory:**
   ```cmd
   cd C:\nginx\conf
   ```

2. **Backup original config:**
   ```cmd
   copy nginx.conf nginx.conf.backup
   ```

3. **Copy the reverse proxy config:**
   - Copy the `nginx-reverse-proxy.conf` file from your project
   - Rename it to `nginx.conf`
   - Place it in `C:\nginx\conf\`

   **OR manually create the config:**
   
   Create/Edit `C:\nginx\conf\nginx.conf` with this content:

   ```nginx
   worker_processes  1;

   events {
       worker_connections  1024;
   }

   http {
       include       mime.types;
       default_type  application/octet-stream;
       sendfile        on;
       keepalive_timeout  65;

       # Upstream configuration for Docker containers
       upstream heavenbaker_frontend {
           server localhost:8080;
       }

       upstream heavenbaker_backend {
           server localhost:5000;
       }

       server {
           listen 80;
           server_name heavenbaker.com www.heavenbaker.com;

           # Increase buffer sizes for large requests
           client_max_body_size 50M;
           client_body_buffer_size 128k;

           # Security headers
           add_header X-Frame-Options "SAMEORIGIN" always;
           add_header X-Content-Type-Options "nosniff" always;
           add_header X-XSS-Protection "1; mode=block" always;

           # Proxy settings
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;

           # Backend API routes
           location /application/api/ {
               proxy_pass http://heavenbaker_backend/api/;
               proxy_buffering off;
               proxy_connect_timeout 60s;
               proxy_send_timeout 60s;
               proxy_read_timeout 60s;
           }

           # Frontend application
           location /application {
               proxy_pass http://heavenbaker_frontend;
               proxy_redirect off;
           }

           # Redirect root to application
           location = / {
               return 301 /application;
           }

           # Health check
           location /health {
               access_log off;
               return 200 "OK\n";
               add_header Content-Type text/plain;
           }
       }
   }
   ```

## Step 4: Test Nginx Configuration

```cmd
cd C:\nginx
nginx -t
```

Expected output:
```
nginx: the configuration file C:\nginx/conf/nginx.conf syntax is ok
nginx: configuration file C:\nginx/conf/nginx.conf test is successful
```

## Step 5: Start Docker Containers

1. **Navigate to your project:**
   ```cmd
   cd C:\Users\dilan\OneDrive\Desktop\Heaven_bakers
   ```

2. **Start Docker containers:**
   ```cmd
   docker compose up -d
   ```

3. **Verify containers are running:**
   ```cmd
   docker compose ps
   ```

   You should see:
   - heaven_bakers_db (port 5432)
   - heaven_bakers_backend (port 5000)
   - heaven_bakers_frontend (port 8080)

## Step 6: Start Nginx

### Start Nginx

```cmd
cd C:\nginx
start nginx
```

### Verify Nginx is Running

```cmd
tasklist /fi "imagename eq nginx.exe"
```

You should see two nginx.exe processes (master + worker)

## Step 7: Access Your Application

Open your browser and go to:

**http://heavenbaker.com/application**

You should see the Heaven Bakers login page!

## Managing Nginx

### Stop Nginx
```cmd
cd C:\nginx
nginx -s stop
```

### Reload Configuration (after changes)
```cmd
cd C:\nginx
nginx -s reload
```

### Restart Nginx
```cmd
cd C:\nginx
nginx -s stop
start nginx
```

### Check if Nginx is Running
```cmd
tasklist /fi "imagename eq nginx.exe"
```

## Setting Up Nginx as a Windows Service (Optional)

To have Nginx start automatically with Windows:

### Using NSSM (Non-Sucking Service Manager)

1. **Download NSSM:**
   - Go to https://nssm.cc/download
   - Download and extract to `C:\nginx\nssm`

2. **Install Nginx as a Service:**
   ```cmd
   # Run Command Prompt as Administrator
   cd C:\nginx\nssm\win64
   nssm install nginx C:\nginx\nginx.exe
   ```

3. **Configure Service:**
   - Application Path: `C:\nginx\nginx.exe`
   - Startup directory: `C:\nginx`
   - Service name: `nginx`

4. **Start the Service:**
   ```cmd
   nssm start nginx
   ```

5. **Set to Auto-start:**
   ```cmd
   sc config nginx start= auto
   ```

## Troubleshooting

### Port 80 Already in Use

**Problem:** Nginx won't start because port 80 is in use

**Solution:**
```cmd
# Find what's using port 80
netstat -ano | findstr :80

# Stop the service (if it's IIS)
iisreset /stop

# Or use different port in nginx.conf
listen 8000;
# Then access: http://heavenbaker.com:8000/application
```

### Nginx Won't Start

**Check logs:**
```cmd
cd C:\nginx\logs
type error.log
```

**Common issues:**
- Port already in use
- Configuration syntax error (run `nginx -t`)
- Missing permissions

### Docker Containers Not Accessible

**Verify containers are running:**
```cmd
docker compose ps
```

**Check if ports are accessible:**
```cmd
curl http://localhost:8080
curl http://localhost:5000/api/auth/login
```

**View container logs:**
```cmd
docker compose logs backend
docker compose logs frontend
```

### Can't Access heavenbaker.com

**Verify hosts file:**
```cmd
type C:\Windows\System32\drivers\etc\hosts | findstr heavenbaker
```

**Flush DNS cache:**
```cmd
ipconfig /flushdns
```

**Try with different browsers or incognito mode**

### 502 Bad Gateway

This means Nginx can't reach your Docker containers.

**Solutions:**
1. Ensure Docker containers are running: `docker compose ps`
2. Check port mappings in `docker-compose.yml`
3. Verify Docker Desktop is running
4. Restart containers: `docker compose restart`

## Testing Checklist

- [ ] Docker Desktop is running
- [ ] All 3 containers are running (`docker compose ps`)
- [ ] Hosts file contains heavenbaker.com entry
- [ ] Nginx configuration test passes (`nginx -t`)
- [ ] Nginx is running (`tasklist | findstr nginx`)
- [ ] Frontend accessible: http://localhost:8080
- [ ] Backend accessible: http://localhost:5000
- [ ] Application loads: http://heavenbaker.com/application

## Firewall Configuration

If accessing from other devices on your network:

1. **Open Windows Defender Firewall**
2. **Add Inbound Rule:**
   - Port: 80
   - Protocol: TCP
   - Action: Allow
   - Profile: All
   - Name: "Nginx HTTP"

## Backup and Restore

### Backup Configuration
```cmd
copy C:\nginx\conf\nginx.conf C:\nginx\conf\nginx.conf.backup
```

### Restore Configuration
```cmd
copy C:\nginx\conf\nginx.conf.backup C:\nginx\conf\nginx.conf
nginx -s reload
```

## Production Considerations

For production deployment:

1. **Use HTTPS:**
   - Set up SSL certificate
   - Configure nginx for port 443
   - Redirect HTTP to HTTPS

2. **Security:**
   - Change database passwords
   - Update JWT_SECRET
   - Enable Windows Firewall
   - Keep Nginx updated

3. **Monitoring:**
   - Set up log rotation
   - Monitor nginx access/error logs
   - Set up Docker container monitoring

4. **Backup:**
   - Automated database backups
   - Configuration backups
   - Regular testing of restore procedures

## Quick Reference Commands

```cmd
# Start everything
cd C:\Users\dilan\OneDrive\Desktop\Heaven_bakers
docker compose up -d
cd C:\nginx
start nginx

# Stop everything
cd C:\nginx
nginx -s stop
cd C:\Users\dilan\OneDrive\Desktop\Heaven_bakers
docker compose down

# Restart nginx only
cd C:\nginx
nginx -s stop
start nginx

# View logs
cd C:\nginx\logs
type access.log
type error.log

# Docker logs
cd C:\Users\dilan\OneDrive\Desktop\Heaven_bakers
docker compose logs -f

# Test configuration
cd C:\nginx
nginx -t
```

## Support

If you encounter issues:

1. Check nginx error logs: `C:\nginx\logs\error.log`
2. Check Docker container logs: `docker compose logs`
3. Verify all services are running
4. Review this troubleshooting section

---

**You're all set!** Access your application at **http://heavenbaker.com/application** 🎉
