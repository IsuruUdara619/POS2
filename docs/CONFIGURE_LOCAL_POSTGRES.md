# Configure Local PostgreSQL for Docker Access

## The Problem
The Docker containers cannot connect to your local PostgreSQL because:
1. PostgreSQL is only listening on localhost (127.0.0.1)
2. PostgreSQL's access rules (pg_hba.conf) don't allow Docker connections

## Solution - Configure PostgreSQL

### Step 1: Find PostgreSQL Configuration Files

Your PostgreSQL config files are typically in:
- Windows: `C:\Program Files\PostgreSQL\[version]\data\`
- Or check: `C:\PostgreSQL\[version]\data\`

You need to edit two files:
1. `postgresql.conf`
2. `pg_hba.conf`

### Step 2: Edit postgresql.conf

1. Open `postgresql.conf` as Administrator
2. Find the line: `#listen_addresses = 'localhost'`
3. Change it to: `listen_addresses = '*'`
4. Save the file

### Step 3: Edit pg_hba.conf

1. Open `pg_hba.conf` as Administrator
2. Add this line at the end:
   ```
   host    all             all             172.16.0.0/12          md5
   ```
   This allows Docker containers to connect (Docker uses 172.x.x.x network)

3. Save the file

### Step 4: Restart PostgreSQL Service

1. Open Services (Win+R, type `services.msc`)
2. Find "postgresql-x64-[version]" service
3. Right-click → Restart

### Step 5: Ensure Heaven_Bakers Database Exists

Open pgAdmin or psql and run:
```sql
CREATE DATABASE "Heaven_Bakers";
```

### Step 6: Restart Docker Containers

```bash
docker-compose restart
```

## Alternative: Use Windows Host IP Instead

If the above doesn't work, you can use your actual Windows IP:

1. Get your Windows IP:
   ```cmd
   ipconfig
   ```
   Look for "IPv4 Address" (usually 192.168.x.x)

2. Edit docker-compose.yml and replace `host.docker.internal` with your IP:
   ```yaml
   DATABASE_URL: postgres://postgres:postgres@192.168.x.x:5432/Heaven_Bakers
   ```

3. Restart containers:
   ```bash
   docker-compose restart
   ```

## Verify Connection

After configuration, test with:
```bash
docker exec heaven_bakers_backend node /app/test_local_connection.js
```

You should see: ✓ Connection successful
