# Database Setup (MariaDB + Prisma)

This project uses MariaDB for data and Prisma as the ORM. LDAP is only used to verify credentials; roles live in the database.

## Environment
Create `server/.env` with your connection string and secret:

```env
DATABASE_URL="mysql://user:password@localhost:3306/tasks_tracker"
JWT_SECRET="replace-with-strong-secret"
```

## Prisma
- Schema is in `server/prisma/schema.prisma` (includes `Role` enum and `User` model`).
- Generate client and run migrations:

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
```

## Run
- Backend: from project root `npm run server:dev`
- Frontend: from project root `npm run dev` (proxy on `/api`)

## Managing Roles
Promote users via SQL or an admin UI:

```sql
UPDATE User SET role = 'manager' WHERE ldapUid = 'jane.doe';
UPDATE User SET role = 'admin'   WHERE ldapUid = 'john.admin';
```
