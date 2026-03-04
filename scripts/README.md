# Heaven Bakers - Utility Scripts

This directory contains utility scripts for database operations, barcode management, and testing.

## Database Connection Scripts

### test_db.js
Tests the database connection using the DATABASE_URL from environment variables.

**Usage:**
```bash
cd scripts
node test_db.js
```

**Purpose:**
- Verify database connectivity
- Test PostgreSQL connection parameters
- Troubleshoot connection issues

### test_local_connection.js
Tests connection to the local PostgreSQL database.

**Usage:**
```bash
cd scripts
node test_local_connection.js
```

**Purpose:**
- Verify local database setup
- Test connection to localhost PostgreSQL
- Debug local development environment

## Barcode Management Scripts

### generate_barcode_images.js
Generates barcode images for products in the database.

**Usage:**
```bash
cd scripts
node generate_barcode_images.js
```

**Purpose:**
- Create barcode images from product codes
- Generate printable barcode labels
- Update product records with barcode image paths

### auto_generate_barcodes.js
Automatically generates barcodes for products that don't have them.

**Usage:**
```bash
cd scripts
node auto_generate_barcodes.js
```

**Purpose:**
- Assign barcodes to products without them
- Generate sequential barcode numbers
- Batch barcode generation

### regenerate_all_barcodes.js
Regenerates all barcodes in the system.

**Usage:**
```bash
cd scripts
node regenerate_all_barcodes.js
```

**Warning:** This will overwrite existing barcodes. Use with caution.

**Purpose:**
- Reset all product barcodes
- Fix barcode inconsistencies
- Migrate to new barcode format

### check_barcodes.js
Checks the status of barcodes in the database.

**Usage:**
```bash
cd scripts
node check_barcodes.js
```

**Purpose:**
- List products without barcodes
- Identify duplicate barcodes
- Validate barcode data integrity

### run_barcode_migration.js
Runs barcode-related database migrations.

**Usage:**
```bash
cd scripts
node run_barcode_migration.js
```

**Purpose:**
- Add barcode columns to database
- Update database schema for barcode support
- Apply barcode-related migrations

## Data Export Scripts

### export_purchases.js
Exports purchase data to Excel format.

**Usage:**
```bash
cd scripts
node export_purchases.js
```

**Purpose:**
- Export purchase history to Excel
- Generate purchase reports
- Backup purchase data

## General Migration Scripts

### run_migration.js
Runs general database migrations.

**Usage:**
```bash
cd scripts
node run_migration.js
```

**Purpose:**
- Apply database schema changes
- Run SQL migration files
- Update database structure

## Prerequisites

All scripts require:
- Node.js 18+
- PostgreSQL database running
- Environment variables configured (DATABASE_URL)
- Required npm packages installed (see root `package.json`)

## Environment Setup

Create a `.env` file in the project root:

```env
DATABASE_URL=postgres://username:password@localhost:5432/Heaven_Bakers
```

## Installing Dependencies

From the project root:

```bash
npm install
```

This installs required packages:
- `pg` - PostgreSQL client
- `dotenv` - Environment variable management
- `canvas` - Image generation for barcodes
- `jsbarcode` - Barcode generation library
- `xlsx` - Excel file generation

## Common Issues

### Database Connection Errors
- Verify PostgreSQL is running
- Check DATABASE_URL in .env file
- Ensure database exists and is accessible

### Barcode Generation Failures
- Verify canvas package is properly installed
- Check file system permissions for image output
- Ensure products table exists in database

### Permission Errors
- Run with appropriate user permissions
- Check database user has required privileges
- Verify file system write permissions

## Script Dependencies

Some scripts depend on database schema being up to date:
1. Run `run_migration.js` first to ensure schema is current
2. Then run barcode scripts for barcode-related operations
3. Export scripts require populated data in the database

## Best Practices

1. **Backup Before Migrations:** Always backup your database before running migration scripts
2. **Test Scripts:** Test scripts on a development database first
3. **Read Script Contents:** Review script code to understand what it does before running
4. **Environment Variables:** Keep sensitive data in .env files, never commit them
5. **Error Logs:** Check console output for error messages and warnings

## Related Documentation

- [Database Setup Guide](../docs/CONFIGURE_LOCAL_POSTGRES.md)
- [Barcode Scanning Guide](../docs/BARCODE_SCANNING_GUIDE.md)
- [Duplicate Barcode Guide](../docs/DUPLICATE_BARCODE_GUIDE.md)
- [Project Structure](../docs/PROJECT_STRUCTURE.md)

## Support

For issues with scripts:
1. Check script output for error messages
2. Verify database connectivity with `test_db.js`
3. Review relevant documentation in the `docs/` directory
4. Check database logs for detailed error information
