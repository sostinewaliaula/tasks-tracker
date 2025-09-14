import ldap from 'ldapjs';
import { LDAP_CONFIG, LDAP_ATTRIBUTES, GROUP_ROLE_MAPPING } from './config';

export interface LDAPUser {
    uid: string;
    email: string;
    name: string;
    department: string;
    role: 'admin' | 'manager' | 'employee';
}

class LDAPService {
    private client: ldap.Client;

    constructor() {
        this.client = ldap.createClient({
            url: LDAP_CONFIG.url,
            ...LDAP_CONFIG.options,
        });

        this.client.on('error', (err) => {
            console.error('LDAP connection error:', err);
        });
    }

    async authenticate(username: string, password: string): Promise<LDAPUser | null> {
        try {
            // Construct user DN
            const userDN = `uid=${username},${LDAP_CONFIG.userDN}`;

            // Attempt to bind with user credentials
            await this.bind(userDN, password);

            // If bind successful, search for user attributes
            const user = await this.searchUser(username);
            if (!user) {
                throw new Error('User not found after successful authentication');
            }

            // Get user's groups and determine role
            const role = await this.getUserRole(username);
            
            return {
                uid: user.uid,
                email: user.mail,
                name: user.cn,
                department: user.departmentNumber,
                role: role || 'employee', // Default to employee if no role mapping found
            };
        } catch (error) {
            console.error('Authentication error:', error);
            return null;
        }
    }

    private async bind(dn: string, password: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.client.bind(dn, password, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    private async searchUser(username: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const opts = {
                filter: `(uid=${username})`,
                scope: 'sub' as const,
                attributes: LDAP_ATTRIBUTES.user,
            };

            this.client.search(LDAP_CONFIG.userDN, opts, (error, res) => {
                if (error) {
                    reject(error);
                    return;
                }

                let user: any = null;

                res.on('searchEntry', (entry) => {
                    user = entry.object;
                });

                res.on('error', (err) => {
                    reject(err);
                });

                res.on('end', () => {
                    resolve(user);
                });
            });
        });
    }

    private async getUserRole(username: string): Promise<'admin' | 'manager' | 'employee'> {
        return new Promise((resolve, reject) => {
            const opts = {
                filter: `(&(objectClass=groupOfNames)(member=uid=${username},${LDAP_CONFIG.userDN}))`,
                scope: 'sub' as const,
                attributes: LDAP_ATTRIBUTES.group,
            };

            this.client.search(LDAP_CONFIG.groupDN, opts, (error, res) => {
                if (error) {
                    reject(error);
                    return;
                }

                let role: 'admin' | 'manager' | 'employee' = 'employee';

                res.on('searchEntry', (entry) => {
                    const groupName = entry.object.cn;
                    const mappedRole = GROUP_ROLE_MAPPING[groupName];
                    if (mappedRole) {
                        role = mappedRole as 'admin' | 'manager' | 'employee';
                    }
                });

                res.on('error', (err) => {
                    reject(err);
                });

                res.on('end', () => {
                    resolve(role);
                });
            });
        });
    }
}

export const ldapService = new LDAPService();