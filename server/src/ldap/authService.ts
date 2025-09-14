import jwt from 'jsonwebtoken';
import { ldapService, LDAPUser } from './ldapService';
import { supabase } from '../lib/supabaseClient';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Make sure to set this in your environment variables
const TOKEN_EXPIRY = '24h';

export interface AuthResponse {
    user: {
        id: string;
        ldap_uid: string;
        name: string;
        email: string;
        role: string;
        department_id: string;
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
        // First try to find the user by LDAP UID
        const { data: existingUser, error: searchError } = await supabase
            .from('users')
            .select('*')
            .eq('ldap_uid', ldapUser.uid)
            .single();

        if (searchError && searchError.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error('Error searching for user:', searchError);
            return null;
        }

        if (existingUser) {
            // Update existing user if needed
            const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update({
                    name: ldapUser.name,
                    email: ldapUser.email,
                    role: ldapUser.role,
                    // department_id will be handled separately if needed
                })
                .eq('id', existingUser.id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating user:', updateError);
                return null;
            }

            return updatedUser;
        } else {
            // Create new user
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    ldap_uid: ldapUser.uid,
                    name: ldapUser.name,
                    email: ldapUser.email,
                    role: ldapUser.role,
                    // department_id will need to be mapped from LDAP department
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating user:', createError);
                return null;
            }

            return newUser;
        }
    }

    private generateToken(user: any): string {
        return jwt.sign(
            {
                id: user.id,
                role: user.role,
                ldap_uid: user.ldap_uid,
            },
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