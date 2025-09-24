import jwt from 'jsonwebtoken';
import { ldapService, LDAPUser } from './ldapService';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Make sure to set this in your environment variables
const TOKEN_EXPIRY = '24h';

export interface AuthResponse {
    user: {
        id: number;
        ldap_uid: string;
        name: string;
        email: string | null;
        role: 'admin' | 'manager' | 'employee';
        department_id: number | null;
    };
    token: string;
}

class AuthService {
    async authenticate(username: string, password: string): Promise<AuthResponse | null> {
        try {
            // Authenticate with LDAP
            const ldapUser = await ldapService.authenticate(username, password);
            if (!ldapUser) {
                return null;
            }

            // Find or create user in local database
            const user = await this.findOrCreateUser(ldapUser);
            if (!user) {
                throw new Error('Failed to create or update user in database');
            }

            // Generate JWT token
            const token = this.generateToken(user);

            return {
                user,
                token,
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    }

    private async findOrCreateUser(ldapUser: LDAPUser) {
        console.log('LDAP User data:', ldapUser); // Debug log
        const existing = await prisma.user.findUnique({ where: { ldapUid: ldapUser.uid } });
        const defaultEmailDomain = process.env.LDAP_DEFAULT_EMAIL_DOMAIN || 'turnkeyafrica.com';
        const resolvedEmail = ldapUser.email ?? `${ldapUser.uid}@${defaultEmailDomain}`;

        const userData = {
            name: ldapUser.name ?? ldapUser.uid,
            email: resolvedEmail,
        };
        console.log('User data to store:', userData); // Debug log

        if (existing) {
            const updated = await prisma.user.update({
                where: { id: existing.id },
                data: userData,
            });
            console.log('Updated user:', updated); // Debug log
            return updated;
        }

        const created = await prisma.user.create({
            data: {
                ldapUid: ldapUser.uid,
                ...userData,
                role: 'employee',
            },
        });
        console.log('Created user:', created); // Debug log
        return created;
    }

    private generateToken(user: any): string {
        return jwt.sign(
            { id: user.id, role: user.role, ldap_uid: user.ldapUid },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );
    }

    verifyToken(token: string): any {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }
}

export const authService = new AuthService();