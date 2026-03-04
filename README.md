# Heaven Bakers - Point of Sale System

A full-stack Point of Sale (POS) system built with React (Vite) frontend and Node.js/Express backend with PostgreSQL database. Features include inventory management, sales tracking, customer loyalty, expense tracking, and comprehensive reporting with PDF/Excel exports.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 13+
- Docker Desktop (optional, for containerized deployment)

### Local Development Setup

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd Heaven_Bakers
```

2. **Backend setup**

```bash
cd backend
npm install
```

Create a `.env` file in `backend`:

```env
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/Heaven_Bakers
JWT_SECRET=your-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Start the backend:

```bash
npm start
```

Backend runs at `http://localhost:5000`

3. **Frontend setup**

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

4. **Login**

- Username: `admin`
- Password: `admin123`

### Docker Deployment

For production deployment with Docker, see [QUICK_START_GUIDE.md](docs/QUICK_START_GUIDE.md) for detailed instructions.

Quick Docker start:

```bash
docker compose up -d
```

Access at `http://localhost:8080` (or configured domain)

## 📁 Project Structure

```
Heaven_bakers/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── middleware/  # Auth & error handling
│   │   ├── services/    # Business logic
│   │   ├── database.sql # Database schema
│   │   └── db.ts       # Database connection
│   ├── index.ts        # Server entry point
│   └── Dockerfile      # Backend container config
│
├── frontend/            # React/Vite application
│   ├── src/
│   │   ├── pages/      # Application pages
│   │   ├── components/ # Reusable components
│   │   └── services/   # API client & utilities
│   └── Dockerfile      # Frontend container config
│
├── docker-compose.yml   # Multi-container orchestration
├── scripts/            # Utility scripts
├── sql/                # SQL migrations and queries
└── docs/               # Documentation

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for complete directory structure.
```

## 🎯 Features

### Core Functionality

- **Sales Management** - Process sales, generate invoices, receipt printing
- **Inventory Control** - Track stock levels, low stock alerts, product management
- **Purchase Orders** - Manage vendor purchases and stock replenishment
- **Customer Loyalty** - Points system, customer tracking
- **Expense Tracking** - Record and categorize business expenses
- **Vendor Management** - Maintain vendor information and purchase history
- **User Management** - Role-based access control (Admin/Cashier)

### Reporting & Analytics

- **Sales Reports** - Daily, product-wise, invoice-level analysis
- **Inventory Reports** - Stock levels, movement tracking
- **Purchase Reports** - Vendor analysis, purchase history
- **Export Options** - Excel and PDF exports for all reports
- **Detailed PDF Reports** - Narrative reports with breakdowns and summaries

### Technical Features

- **WhatsApp Integration** - Receipt delivery via WhatsApp
- **Barcode Support** - Product scanning and barcode generation
- **Error Logging** - Comprehensive error tracking and monitoring
- **Receipt Printing** - Thermal printer support (XP-80C)
- **Real-time Updates** - Live inventory and sales tracking
- **Responsive Design** - Works on desktop and tablet devices

## 🔧 Configuration

### Environment Variables

**Backend (.env)**

```env
PORT=5000
DATABASE_URL=postgres://user:password@host:port/database
JWT_SECRET=your-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
WHATSAPP_ENABLED=true
```

**Docker Deployment (.env.docker)**

```env
POSTGRES_USER=heaven_user
POSTGRES_PASSWORD=heaven_password
POSTGRES_DB=Heaven_Bakers
JWT_SECRET=your-production-secret
```

### Database

The database schema is automatically created on first startup. Tables include:

- users (authentication)
- products (inventory items)
- customers (loyalty program)
- vendors (suppliers)
- sales_invoices & sales_items
- purchases & purchase_items
- expenses
- loyalty_transactions
- error_logs

See `backend/src/database.sql` for complete schema.

## 📊 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user
- `GET /api/auth/me` - Get current user

### Sales

- `GET /api/sales` - List all sales
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get sale details
- `GET /api/sales/invoice/:id` - Get invoice

### Inventory

- `GET /api/inventory` - List products
- `POST /api/inventory` - Add product
- `PUT /api/inventory/:id` - Update product
- `DELETE /api/inventory/:id` - Delete product

### Reporting

- `GET /api/sales/report` - Sales report with filters
- `GET /api/inventory/report` - Inventory report
- `GET /api/purchases/report` - Purchase report

For complete API documentation, see individual route files in `backend/src/routes/`

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Building for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Code Structure

**Backend Routes:**

- `auth.ts` - Authentication endpoints
- `sales.ts` - Sales and invoices
- `inventory.ts` - Product management
- `purchases.ts` - Purchase orders
- `expenses.ts` - Expense tracking
- `customers.ts` - Customer management
- `vendors.ts` - Vendor management
- `loyalty.ts` - Loyalty program
- `barcode.ts` - Barcode operations
- `print.ts` - Receipt printing
- `whatsapp.ts` - WhatsApp integration
- `logs.ts` - Error log retrieval

**Frontend Pages:**

- Dashboard - Overview and quick stats
- Sales - Process new sales
- Inventory - Manage products
- Purchase - Create purchase orders
- Expenses - Track expenses
- Loyalty - Customer loyalty management
- Vendors - Vendor information
- Reports - Analytics and exports
- Settings - User management

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- SQL injection protection via parameterized queries
- CORS configuration for API security
- Environment variable protection
- Session management

See [docs/RBAC_DOCUMENTATION.md](docs/RBAC_DOCUMENTATION.md) for detailed role permissions.

## 📝 Logging & Monitoring

The application includes comprehensive error logging:

- Frontend error boundary
- Backend error middleware
- Database error logging
- API endpoint: `GET /api/logs` (Admin only)

## 🐳 Docker Deployment

The application is fully containerized with:

- Backend service (Node.js)
- Frontend service (Static files served via serve)
- PostgreSQL database
- Persistent volumes for data

See [docs/QUICK_START_GUIDE.md](docs/QUICK_START_GUIDE.md) for complete Docker setup instructions.

## 🔄 Backup & Restore

### Database Backup

```bash
# Local
pg_dump -U postgres Heaven_Bakers > backup.sql

# Docker
docker compose exec postgres pg_dump -U heaven_user Heaven_Bakers > backup.sql
```

### Database Restore

```bash
# Local
psql -U postgres Heaven_Bakers < backup.sql

# Docker
docker compose exec -T postgres psql -U heaven_user -d Heaven_Bakers < backup.sql
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists (auto-created on first run)

**Port Already in Use**

- Backend (5000): Check for other Node processes
- Frontend (5173): Check for other Vite servers
- Docker (8080): Check for other containers

**Login Issues**

- Restart backend to re-run admin seeding
- Check database users table for admin entry
- Verify JWT_SECRET is set

**Export/Print Issues**

- Ensure user is logged in
- Check browser console for errors
- Verify API endpoints are accessible

### Logs

```bash
# Docker logs
docker compose logs -f backend
docker compose logs -f frontend

# Application logs
# Access via frontend: Settings > Error Logs (Admin only)
```

## 📚 Additional Documentation

- [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) - Complete directory structure
- [docs/QUICK_START_GUIDE.md](docs/QUICK_START_GUIDE.md) - Docker setup
- [docs/DOCKER.md](docs/DOCKER.md) - Docker deployment details
- [docs/RBAC_DOCUMENTATION.md](docs/RBAC_DOCUMENTATION.md) - Role-based access control
- [docs/BARCODE_SCANNING_GUIDE.md](docs/BARCODE_SCANNING_GUIDE.md) - Barcode implementation
- [docs/WHATSAPP_INTEGRATION_GUIDE.md](docs/WHATSAPP_INTEGRATION_GUIDE.md) - WhatsApp setup
- [docs/CONFIGURE_LOCAL_POSTGRES.md](docs/CONFIGURE_LOCAL_POSTGRES.md) - Database setup

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues and questions:

1. Check existing documentation
2. Review error logs via the application
3. Consult troubleshooting section above

---

**Version:** 1.0.0  
**Last Updated:** November 2024
