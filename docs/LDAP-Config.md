# LDAP Configuration Guide

## LDAP Server Details
- **Server URL**: ldap://10.176.18.143:389
- **Bind DN**: uid=admin,ou=people,dc=turnkeyafrica,dc=com
- **Base DN**: dc=turnkeyafrica,dc=com
- **Search Base**: ou=people,dc=turnkeyafrica,dc=com

## Configuration Files
The LDAP configuration is split between two environment files. The server loads `server/.env` automatically at startup, and also falls back to root `.env` if needed.

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000
VITE_LDAP_URL=ldap://10.176.18.143:389
VITE_LDAP_BASE_DN=dc=turnkeyafrica,dc=com
```

### Backend (server/.env)
```env
LDAP_URL=ldap://10.176.18.143:389
LDAP_BIND_DN=uid=admin,ou=people,dc=turnkeyafrica,dc=com
LDAP_BIND_PASSWORD=turnkey4ever
LDAP_BASE_DN=dc=turnkeyafrica,dc=com
LDAP_SEARCH_BASE=ou=people,dc=turnkeyafrica,dc=com
LDAP_DEFAULT_EMAIL_DOMAIN=turnkeyafrica.com

# Required for Prisma/MySQL
DATABASE_URL=mysql://root:password@localhost:3306/tasks_tracker

# JWT for issuing auth tokens
JWT_SECRET=change-me
```

## Security Notes
1. The LDAP bind password should be kept secure and not committed to version control
2. Use appropriate file permissions for .env files
3. Consider using a secrets management system in production

## Testing LDAP Connection
You can test the LDAP connection using the following command:
```bash
ldapsearch -x -H ldap://10.176.18.143:389 -D "uid=admin,ou=people,dc=turnkeyafrica,dc=com" -w 'turnkey4ever' -b "dc=turnkeyafrica,dc=com" dn
```

## Required Actions
1. Verify the .env files are properly configured (especially `DATABASE_URL` and `JWT_SECRET` in `server/.env`)
2. Test LDAP connection using the provided command
3. Ensure proper error handling for LDAP authentication failures
4. Monitor LDAP connection stability

## Troubleshooting
If you encounter LDAP connection issues:
1. Verify network connectivity to LDAP server
2. Check firewall settings
3. Verify bind credentials
4. Ensure proper DN formatting
5. Check server logs for detailed error messages