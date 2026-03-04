# Database Connection Issue - Two Separate Databases

## The Problem:

You have TWO PostgreSQL databases running:

### 1. Docker PostgreSQL (Where your data IS stored)
- **Host**: localhost
- **Port**: 5432
- **Database**: Heaven_Bakers
- **Username**: heaven_user
- **Password**: heaven_password
- **Data Status**: ✅ INV-16 and INV-17 ARE HERE

### 2. Local PostgreSQL (Where you're looking)
- **Host**: localhost
- **Port**: 5432
- **Database**: Heaven_Bakers
- **Username**: postgres
- **Password**: postgres
- **Data Status**: ❌ INV-16 and INV-17 are NOT here

## Why This Happened:

The Docker backend container uses the DATABASE_URL from docker-compose.yml:
```
DATABASE_URL=postgres://heaven_user:heaven_password@postgres:5432/Heaven_Bakers
```

But your local backend/.env file points to a different database:
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/Heaven_Bakers
```

## Solution:

### To View Docker Database in pgAdmin/DBeaver:

1. Create a new connection with these settings:
   - **Name**: Docker Heaven_Bakers
   - **Host**: localhost (or 127.0.0.1)
   - **Port**: 5432
   - **Database**: Heaven_Bakers
   - **Username**: heaven_user
   - **Password**: heaven_password

2. Connect and run:
   ```sql
   SELECT * FROM purchases WHERE invoice_no IN ('INV-16', 'INV-17');
   ```

You'll see your data!

## If You Want to Use Local Database Instead:

You would need to modify docker-compose.yml to use postgres:postgres credentials, but that's not recommended as it would require recreating the Docker database.
