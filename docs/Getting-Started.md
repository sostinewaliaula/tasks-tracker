# Getting Started Guide

## Prerequisites
- Node.js 18+ (tested on Node 22)
- MySQL/MariaDB database
- Access to LDAP server (ldap://10.176.18.143:389)

## Initial Setup

### 1. Environment Configuration
Create `.env` files in both root and server directories. The server loads `server/.env` automatically; a root `.env` is optional and used for frontend vars.

```env
# Root .env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Server .env
PORT=3000
JWT_SECRET=your_jwt_secret

# DB (Prisma)
# Format: mysql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=mysql://root:password@localhost:3306/tasks_tracker

# LDAP
LDAP_URL=ldap://10.176.18.143:389
LDAP_BIND_DN=your_bind_dn
LDAP_BIND_PASSWORD=your_bind_password
LDAP_BASE_DN=dc=turnkeyafrica,dc=com
LDAP_SEARCH_BASE=ou=people,dc=turnkeyafrica,dc=com
LDAP_DEFAULT_EMAIL_DOMAIN=turnkeyafrica.com
```

### 2. Installation
```bash
npm install
```

### 3. Database Setup
```bash
npx prisma generate --schema server/prisma/schema.prisma
npx prisma migrate deploy --schema server/prisma/schema.prisma
```

### 4. Running the Application
```bash
# Start the backend API
npm run server:dev

# In another terminal, start the frontend
npm run dev
```

## Development Workflow

### Frontend Development
1. Components are in `src/components`
2. Pages are in `src/pages`
3. Use the existing component structure
4. Follow the RBAC implementation for new routes

### Backend Development
1. Server code is in `server/src`
2. Env loading handled in `server/src/index.ts` (ESM-safe `import.meta.url`)
3. Prisma schema at `server/prisma/schema.prisma` → client outputs to `server/src/generated/prisma`
4. Use the LDAP authentication service
5. Implement proper error handling

## Testing

### Frontend Testing
1. Test authentication flow
2. Verify role-based access
3. Test responsive design
4. Cross-browser testing

### Backend Testing
1. Test LDAP connectivity
2. Verify JWT token management
3. Test database migrations
4. API endpoint testing
5. Invalid login should return 401, not crash the server

## Deployment Checklist
- [ ] Update environment variables (especially `DATABASE_URL`, `JWT_SECRET`)
- [ ] Run database migrations
- [ ] Build frontend application
- [ ] Deploy server application
- [ ] Verify LDAP connectivity
- [ ] Test authentication flow
- [ ] Monitor error logs