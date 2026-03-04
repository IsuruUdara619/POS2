# Role-Based Access Control (RBAC) Documentation

## Overview
This document describes the role-based access control system implemented in the Heaven Bakers POS application.

---

## Default Login Credentials

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Admin
- **Access**: Full access to all modules including user management

### Creating Additional Users
Once logged in as an admin, navigate to the Settings page (gear icon) to create additional users with different roles.

---

## User Roles

### 1. Admin
- **Description**: Full system access with user management capabilities
- **Permissions**: 
  - Can access all modules
  - Can create, update, and delete users
  - Can change user roles
  - Exclusive access to Settings page

### 2. Manager
- **Description**: Operational management access without user administration
- **Permissions**: 
  - Can access all operational modules
  - Cannot access Settings page
  - Cannot manage users

### 3. Cashier
- **Description**: Limited access for point-of-sale operations
- **Permissions**: 
  - Can access Sales, Inventory, and Loyalty modules only
  - Cannot access administrative or procurement modules

---

## Access Control Matrix

| Module          | Admin | Manager | Cashier | Description                           |
|-----------------|-------|---------|---------|---------------------------------------|
| **Dashboard**   | ✓     | ✓       | ✓       | View sales, profit, and metrics       |
| **Products**    | ✓     | ✓       | ✗       | Manage product catalog                |
| **Vendors**     | ✓     | ✓       | ✗       | Manage vendor information             |
| **Purchase**    | ✓     | ✓       | ✗       | Create and manage purchase orders     |
| **Inventory**   | ✓     | ✓       | ✓       | View and manage stock levels          |
| **Sales**       | ✓     | ✓       | ✓       | Process customer transactions         |
| **Expenses**    | ✓     | ✓       | ✗       | Record and track business expenses    |
| **Reports**     | ✓     | ✓       | ✗       | Generate business reports             |
| **Loyalty**     | ✓     | ✓       | ✓       | Manage customer loyalty program       |
| **Settings**    | ✓     | ✗       | ✗       | User management and system settings   |

**Legend:**
- ✓ = Access Granted
- ✗ = Access Denied

---

## Navigation Bar Visibility

### Admin View
```
Products | Vendors | Purchase | Inventory | Sales | Expenses | Reports | Loyalty | [Settings Icon] | Home | Logout
```

### Manager View
```
Products | Vendors | Purchase | Inventory | Sales | Expenses | Reports | Loyalty | Home | Logout
```

### Cashier View
```
Inventory | Sales | Loyalty | Home | Logout
```

---

## Security Features

### Route Protection
- All routes are protected and require authentication
- Unauthorized access attempts automatically redirect to the Sales page
- JWT tokens expire after 1 hour

### Backend API Protection
- All user management endpoints require admin authentication
- Role-based middleware validates user permissions on each request
- Password hashing using bcrypt for secure storage

---

## User Management (Admin Only)

### Creating a New User
1. Log in with admin credentials
2. Click the **Settings** icon (gear icon) in the navigation bar
3. Click **Add User** button
4. Fill in the form:
   - Username (required)
   - Password (required)
   - Role (select from dropdown: Admin, Manager, or Cashier)
5. Click **Create**

### Updating User Role
1. Navigate to Settings page
2. Find the user in the table
3. Select the new role from the dropdown
4. Changes are saved automatically

### Deleting a User
1. Navigate to Settings page
2. Find the user in the table
3. Click the **Delete** button
4. Confirm the deletion

---

## Initial Setup

### 1. Seed Admin Account
After starting the backend server, ensure the admin account is created:

**Option A**: Using the seed endpoint (if configured)
```bash
POST http://localhost:5000/api/auth/seed-admin
```

**Option B**: Using environment variables
Set in your `.env` file:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 2. First Login
1. Navigate to the login page
2. Enter admin credentials:
   - Username: `admin`
   - Password: `admin123`
3. You will be redirected to the Dashboard

### 3. Create Additional Users
1. Click the Settings icon (gear icon)
2. Create manager and cashier accounts as needed

---

## Best Practices

### For Admins
- Change the default admin password immediately after first login
- Create unique accounts for each employee
- Regularly review user access and remove inactive accounts
- Use Manager role for supervisory staff
- Use Cashier role for frontline sales staff

### For All Users
- Keep login credentials secure
- Log out after each session
- Report any suspicious activity immediately

---

## Troubleshooting

### Issue: Cannot access certain pages
**Solution**: Check your user role. You may not have permission to access that module.

### Issue: Redirected to Sales page when clicking a link
**Solution**: This is expected behavior when you don't have access to that module.

### Issue: Settings icon not visible
**Solution**: Settings is only visible to admin users. Contact your administrator if you need access.

---

## Technical Details

### Database Schema
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'cashier' 
         CHECK (role IN ('admin', 'manager', 'cashier'))
);
```

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/seed-admin` - Create/update admin account

#### User Management (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user role
- `DELETE /api/users/:id` - Delete user

---

## Support

For additional support or questions about the RBAC system, please contact your system administrator.

---

**Document Version**: 1.0  
**Last Updated**: November 25, 2025  
**System**: Heaven Bakers POS
