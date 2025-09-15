# LDAP Integration Documentation

## Overview
This document outlines the LDAP integration implemented in the Caava Group Task Tracking System.

## LDAP Configuration
- **Server**: ldap://10.176.18.143:389
- **Integration Type**: Direct LDAP authentication
- **Authentication Flow**: JWT-based token management

## Implementation Details

### Server-side Implementation
- LDAP authentication service configured
- JWT token management implemented
- Role-based access control (RBAC) middleware added

### Database and Roles
- LDAP is used only for identity (login/password verification).
- Roles are managed in the application database (MariaDB) via Prisma.
- New users default to `employee`; admins can promote to `manager` or `admin`.

### Frontend Implementation
- Authentication context with LDAP support
- Protected routes based on user roles
- Login page updated to support LDAP authentication

## Required Actions

### For System Administrators
1. Verify LDAP server connectivity
2. Configure user roles in the system
3. Test authentication flow with LDAP credentials

### For Developers
1. Set `DATABASE_URL` and `JWT_SECRET` in `server/.env`.
2. Run database migrations (`npx prisma migrate dev`).
3. Test authentication flow (LDAP bind → DB upsert → JWT with DB role).

### For End Users
1. Use domain credentials for authentication
2. Contact system administrator for role assignments
3. Report any authentication issues to IT support