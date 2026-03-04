# Heaven Bakers - SQL Scripts

This directory contains SQL scripts for database operations, migrations, and queries.

## Database Schema Management

### add_barcode_columns.sql
Adds barcode-related columns to the products table.

**Purpose:**
- Add `barcode` column to products table
- Add `barcode_image` column for storing image paths
- Enable barcode scanning functionality

**Usage:**
```bash
psql -U postgres -d Heaven_Bakers -f sql/add_barcode_columns.sql
```

### allow_duplicate_barcodes.sql
Modifies barcode constraints to allow duplicate barcodes.

**Purpose:**
- Remove unique constraint on barcode column
- Allow multiple products to share the same barcode
- Support bulk items with common barcodes

**Usage:**
```bash
psql -U postgres -d Heaven_Bakers -f sql/allow_duplicate_barcodes.sql
```

**See also:** [Duplicate Barcode Guide](../docs/DUPLICATE_BARCODE_GUIDE.md)

## Database State Queries

### check_current_state.sql
Queries the current state of the database schema.

**Purpose:**
- View current table structures
- Check column definitions
- Verify indexes and constraints

**Usage:**
```bash
psql -U postgres -d Heaven_Bakers -f sql/check_current_state.sql
```

### check_local_db.sql
Checks the local database configuration and state.

**Purpose:**
- Verify local database setup
- Check table existence
- Validate database connectivity

**Usage:**
```bash
psql -U postgres -d Heaven_Bakers -f sql/check_local_db.sql
```

### check_inventory_sync.sql
Verifies inventory data synchronization.

**Purpose:**
- Check inventory table consistency
- Validate stock levels
- Identify synchronization issues

**Usage:**
```bash
psql -U postgres -d Heaven_Bakers -f sql/check_inventory_sync.sql
```

## Schema Comparison

### compare_schemas.sql
Compares database schemas between environments.

**Purpose:**
- Compare development vs production schemas
- Identify schema differences
- Validate migrations

**Usage:**
```bash
psql -U postgres -d Heaven_Bakers -f sql/compare_schemas.sql
```

## Data Queries

### query_purchases.sql
Queries purchase order data.

**Purpose:**
- Retrieve purchase order information
- Generate purchase reports
- Analyze vendor purchase history

**Usage:**
```bash
psql -U postgres -d Heaven_Bakers -f sql/query_purchases.sql
```

## Database Restoration

### restore_db.sql
Restores database from backup.

**Purpose:**
- Restore database to a previous state
- Recover from data loss
- Apply backup data

**Usage:**
```bash
psql -U postgres -d Heaven_Bakers -f sql/restore_db.sql
```

**Note:** This script should be modified to include your actual backup data.

## Running SQL Scripts

### Method 1: Using psql Command Line

```bash
# Connect to database and run script
psql -U postgres -d Heaven_Bakers -f sql/script_name.sql

# Run with Docker
docker compose exec -T postgres psql -U heaven_user -d Heaven_Bakers < sql/script_name.sql
```

### Method 2: Using psql Interactive Mode

```bash
# Connect to database
psql -U postgres -d Heaven_Bakers

# Run script from within psql
\i sql/script_name.sql
```

### Method 3: Using GUI Tools

You can also run these scripts using:
- pgAdmin
- DBeaver
- DataGrip
- Any PostgreSQL-compatible database tool

## Script Execution Order

For a fresh database setup, run scripts in this order:

1. **Base Schema**: Ensure `backend/src/database.sql` is run first (handled automatically by backend)
2. **Barcode Support**: `add_barcode_columns.sql`
3. **Barcode Configuration**: `allow_duplicate_barcodes.sql` (if needed)
4. **Verification**: `check_current_state.sql` to verify setup

## Prerequisites

- PostgreSQL 13+ installed and running
- Database `Heaven_Bakers` created
- Appropriate user permissions
- psql command-line tool (comes with PostgreSQL)

## Environment-Specific Usage

### Local Development

```bash
# Run a script locally
psql -U postgres -d Heaven_Bakers -f sql/check_current_state.sql
```

### Docker Environment

```bash
# Run a script in Docker container
docker compose exec -T postgres psql -U heaven_user -d Heaven_Bakers < sql/check_current_state.sql
```

### Remote Database

```bash
# Run a script on remote database
psql -h hostname -U username -d Heaven_Bakers -f sql/check_current_state.sql
```

## Best Practices

1. **Backup First**: Always backup your database before running modification scripts
   ```bash
   pg_dump -U postgres Heaven_Bakers > backup_$(date +%Y%m%d).sql
   ```

2. **Test on Development**: Test scripts on a development database first

3. **Review Scripts**: Always review script contents before execution

4. **Transaction Safety**: Wrap destructive operations in transactions
   ```sql
   BEGIN;
   -- Your changes here
   COMMIT; -- or ROLLBACK; if something goes wrong
   ```

5. **Document Changes**: Keep track of which scripts have been run in production

## Creating Backups

### Full Database Backup

```bash
# Local
pg_dump -U postgres Heaven_Bakers > backup.sql

# Docker
docker compose exec postgres pg_dump -U heaven_user Heaven_Bakers > backup.sql
```

### Table-Specific Backup

```bash
# Backup specific table
pg_dump -U postgres -t products Heaven_Bakers > products_backup.sql
```

### Schema Only Backup

```bash
# Backup schema without data
pg_dump -U postgres --schema-only Heaven_Bakers > schema_backup.sql
```

## Restoring from Backup

### Full Database Restore

```bash
# Local (warning: drops and recreates database)
dropdb -U postgres Heaven_Bakers
createdb -U postgres Heaven_Bakers
psql -U postgres Heaven_Bakers < backup.sql

# Docker
docker compose exec -T postgres psql -U heaven_user -d Heaven_Bakers < backup.sql
```

## Common SQL Commands

### Check Database Size

```sql
SELECT pg_size_pretty(pg_database_size('Heaven_Bakers'));
```

### List All Tables

```sql
\dt
```

### Describe Table Structure

```sql
\d products
```

### Show Running Queries

```sql
SELECT pid, query, state FROM pg_stat_activity WHERE datname = 'Heaven_Bakers';
```

## Troubleshooting

### Permission Denied

Ensure your database user has appropriate permissions:
```sql
GRANT ALL PRIVILEGES ON DATABASE Heaven_Bakers TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### Connection Refused

- Verify PostgreSQL is running: `systemctl status postgresql` (Linux) or check Services (Windows)
- Check connection parameters in DATABASE_URL
- Verify firewall settings

### Script Errors

- Check PostgreSQL logs: `/var/log/postgresql/` (Linux) or Event Viewer (Windows)
- Review script syntax
- Ensure database schema is up to date

## Related Documentation

- [Database Connection Guide](../docs/database_connection_guide.md)
- [PostgreSQL Configuration](../docs/CONFIGURE_LOCAL_POSTGRES.md)
- [Docker Setup](../docs/DOCKER.md)
- [Project Structure](../docs/PROJECT_STRUCTURE.md)

## Support

For SQL script issues:
1. Check PostgreSQL error messages
2. Review script contents for syntax errors
3. Verify database connectivity
4. Check database logs for detailed error information
5. Consult PostgreSQL documentation: https://www.postgresql.org/docs/
