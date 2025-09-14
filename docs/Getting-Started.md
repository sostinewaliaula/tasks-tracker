# Getting Started Guide

## Prerequisites
- Node.js 16.x or later
- PostgreSQL database
- Access to LDAP server (ldap://10.176.18.143:389)

## Initial Setup

### 1. Environment Configuration
Create `.env` files in both root and server directories:

```env
# Root .env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Server .env
LDAP_URL=ldap://10.176.18.143:389
LDAP_BIND_DN=your_bind_dn
LDAP_BIND_PASSWORD=your_bind_password
JWT_SECRET=your_jwt_secret
```

### 2. Installation
```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
```

### 3. Database Setup
```bash
cd server
npm run migrate
```

### 4. Running the Application
```bash
# Start the server
cd server
npm run dev

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
2. Follow the existing middleware pattern
3. Use the LDAP authentication service
4. Implement proper error handling

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

## Deployment Checklist
- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Build frontend application
- [ ] Deploy server application
- [ ] Verify LDAP connectivity
- [ ] Test authentication flow
- [ ] Monitor error logs