# Heaven Bakers - Project Structure

## Overview
This document describes the organization of the Heaven Bakers POS system project.

## Directory Structure

```
Heaven_bakers/
├── backend/                    # Backend API server
│   ├── src/                   # Source code
│   │   ├── routes/           # API route handlers
│   │   ├── middleware/       # Express middleware
│   │   └── services/         # Business logic services
│   ├── data/                 # Data storage
│   └── logs/                 # Application logs
│
├── frontend/                  # Frontend web application
│   ├── src/                  # React source code
│   │   ├── components/       # Reusable React components
│   │   ├── pages/            # Page components
│   │   └── services/         # API and utility services
│   └── dist/                 # Production build output
│
├── docs/                      # Documentation
│   ├── BARCODE_SCANNING_GUIDE.md
│   ├── CONFIGURE_LOCAL_POSTGRES.md
│   ├── database_connection_guide.md
│   ├── DOCKER.md
│   ├── DUPLICATE_BARCODE_GUIDE.md
│   ├── NGINX_WINDOWS_SETUP.md
│   ├── QUICK_START_GUIDE.md
│   ├── RBAC_DOCUMENTATION.md
│   ├── README_DOCKER_SETUP.md
│   └── WHATSAPP_INTEGRATION_GUIDE.md
│
├── scripts/                   # Utility scripts
│   ├── auto_generate_barcodes.js
│   ├── check_barcodes.js
│   ├── export_purchases.js
│   ├── generate_barcode_images.js
│   ├── regenerate_all_barcodes.js
│   ├── run_barcode_migration.js
│   ├── run_migration.js
│   ├── test_db.js
│   └── test_local_connection.js
│
├── sql/                       # SQL scripts and migrations
│   ├── add_barcode_columns.sql
│   ├── allow_duplicate_barcodes.sql
│   ├── check_current_state.sql
│   ├── check_inventory_sync.sql
│   ├── check_local_db.sql
│   ├── compare_schemas.sql
│   ├── query_purchases.sql
│   └── restore_db.sql
│
├── docker-compose.yml         # Docker services configuration
├── nginx-reverse-proxy.conf   # Nginx configuration
├── package.json              # Root dependencies (for utility scripts)
├── .env.docker               # Docker environment variables
└── README.md                 # Main project documentation
```

## Key Files

### Configuration Files
- `docker-compose.yml` - Docker Compose configuration for running the entire stack
- `nginx-reverse-proxy.conf` - Nginx reverse proxy configuration
- `.env.docker` - Environment variables for Docker containers
- `.gitignore` - Git ignore patterns

### Documentation (docs/)
All documentation has been organized in the `docs/` directory for easy access:
- Quick start guides for getting started
- Setup guides for Docker, PostgreSQL, and Nginx
- Feature documentation for barcodes, RBAC, and WhatsApp integration

### Scripts (scripts/)
Utility scripts for database operations and maintenance:
- Barcode generation and migration scripts
- Database testing and connection verification
- Data export utilities

### SQL (sql/)
Database scripts and queries:
- Schema migrations
- Database state checks
- Data restoration scripts

## Running the Project

### Using Docker (Recommended)
```bash
docker-compose up -d
```

### Development Mode
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Documentation Quick Links

- [Quick Start Guide](./QUICK_START_GUIDE.md)
- [Docker Setup](./README_DOCKER_SETUP.md)
- [Database Configuration](./CONFIGURE_LOCAL_POSTGRES.md)
- [Barcode Scanning](./BARCODE_SCANNING_GUIDE.md)
- [WhatsApp Integration](./WHATSAPP_INTEGRATION_GUIDE.md)
- [Role-Based Access Control](./RBAC_DOCUMENTATION.md)

## Support

For issues or questions, please refer to the relevant documentation in the `docs/` directory.
