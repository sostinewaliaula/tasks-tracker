import ldap from 'ldapjs';
import { LDAP_CONFIG, LDAP_ATTRIBUTES } from './config';

export interface LDAPUser {
    uid: string;
    email: string | null;
    name: string;
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
            console.log(`LDAP: authenticate called for identifier: ${username}`);
            // Try direct bind first using common DN/UPN forms
            const plainUser = username.includes('@') ? username.split('@')[0] : username;
            const directCandidates: string[] = [];
            if (username.includes('@')) {
                directCandidates.push(username); // UPN style (email)
            }
            if (LDAP_CONFIG.userDN) {
                directCandidates.push(`uid=${plainUser},${LDAP_CONFIG.userDN}`);
                directCandidates.push(`cn=${plainUser},${LDAP_CONFIG.userDN}`);
            }

            for (const candidate of directCandidates) {
                try {
                    console.log(`LDAP: trying direct bind with ${candidate}`);
                    await this.bind(candidate, password);
                    // After successful bind, prefer a base search on the exact DN to get attributes (including mail)
                    const byDn = await this.searchEntryByDn(candidate);
                    if (byDn) {
                        const stableUid = this.ensureUid(byDn);
                        const emailFromLdap = (byDn.mail ?? byDn.userPrincipalName) ?? null;
                        const finalEmail = emailFromLdap ?? `${stableUid}@turnkeyafrica.com`;
                        console.log('LDAP: mail resolved', { mail: byDn.mail, upn: byDn.userPrincipalName, finalEmail });
                        return {
                            uid: stableUid,
                            email: finalEmail,
                            name: byDn.cn ?? stableUid,
                        };
                    }
                    // Fallbacks: try identifier search, then DN parsing
                    const enriched = await this.searchUserEntry(username);
                    if (enriched) {
                        const stableUid = this.ensureUid(enriched);
                        const emailFromLdap = (enriched.mail ?? enriched.userPrincipalName) ?? null;
                        const finalEmail = emailFromLdap ?? `${stableUid}@turnkeyafrica.com`;
                        console.log('LDAP: mail resolved (search)', { mail: enriched.mail, upn: enriched.userPrincipalName, finalEmail });
                        return {
                            uid: stableUid,
                            email: finalEmail,
                            name: enriched.cn ?? stableUid,
                        };
                    }
                    const uidFromDn = this.uidFromDn(candidate) || plainUser;
                    return { uid: uidFromDn, email: null, name: uidFromDn };
                } catch (err) {
                    console.error(`LDAP: direct bind failed for ${candidate}:`, err);
                }
            }

            // First locate the user's DN by searching with uid or email under base DN
            const userEntry = await this.searchUserEntry(username);
            if (!userEntry || !userEntry.dn) {
                console.error(`LDAP search: user not found for identifier: ${username}`);
                throw new Error('User not found');
            }

            console.log(`LDAP search: found DN for ${username}: ${userEntry.dn}`);

            // Attempt to bind with discovered DN and provided password
            try {
                await this.bind(userEntry.dn, password);
            } catch (e) {
                console.error(`LDAP bind failed for DN ${userEntry.dn}:`, e);
                throw e;
            }

            // If bind successful, map attributes
            const user = userEntry;
            if (!user) {
                throw new Error('User not found after successful authentication');
            }

            const stableUid = this.ensureUid(user);
            return {
                uid: stableUid,
                email: user.mail ?? user.userPrincipalName ?? null,
                name: user.cn,
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

    private async searchUserEntry(usernameOrEmail: string): Promise<any> {
        return new Promise((resolve, reject) => {
            // Support email, userPrincipalName, or uid
            const escaped = usernameOrEmail.replace(/([*()\\])/g, '\\$1');
            const filter = `(|(mail=${escaped})(userPrincipalName=${escaped})(uid=${escaped})(sAMAccountName=${escaped})(cn=${escaped}))`;
            const opts = {
                filter,
                scope: 'sub' as const,
                attributes: LDAP_ATTRIBUTES.user,
            };

            const doSearch = () => {
                this.client.search(LDAP_CONFIG.baseDN, opts, (error, res) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    let user: any = null;

                    res.on('searchEntry', (entry) => {
                        user = { dn: entry.objectName, ...entry.object };
                    });

                    res.on('error', (err) => {
                        reject(err);
                    });

                    res.on('end', () => {
                        resolve(user);
                    });
                });
            };

            // If a service bind DN is configured, bind first for broader search rights
            if (LDAP_CONFIG.bindDN && LDAP_CONFIG.bindPassword) {
                this.client.bind(LDAP_CONFIG.bindDN, LDAP_CONFIG.bindPassword, (bindErr) => {
                    if (bindErr) {
                        console.error('LDAP service bind failed:', bindErr);
                        reject(bindErr);
                        return;
                    }
                    doSearch();
                });
            } else {
                doSearch();
            }
        });
    }

    private ensureUid(entry: any): string {
        const candidate = entry?.uid || entry?.sAMAccountName || entry?.cn;
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate;
        }
        // Fallback: parse RDN from DN
        const dnVal: any = entry?.dn;
        const dn = typeof dnVal === 'string' ? dnVal : (dnVal ? String(dnVal) : undefined);
        if (dn) {
            const first = dn.split(',')[0];
            const idx = first.indexOf('=');
            if (idx > 0) return first.substring(idx + 1);
        }
        throw new Error('Unable to determine stable UID from LDAP entry');
    }

    private uidFromDn(dn: string): string | null {
        if (!dn) return null;
        const first = dn.split(',')[0];
        const idx = first.indexOf('=');
        if (idx > 0) return first.substring(idx + 1);
        return null;
    }

    private async searchEntryByDn(dn: string): Promise<any | null> {
        return new Promise((resolve, reject) => {
            try {
                const opts = {
                    scope: 'base' as const,
                    attributes: LDAP_ATTRIBUTES.user,
                };
                this.client.search(dn, opts, (error, res) => {
                    if (error) {
                        resolve(null);
                        return;
                    }
                    let found: any = null;
                    res.on('searchEntry', (entry) => {
                        found = { dn: entry.objectName, ...entry.object };
                    });
                    res.on('error', () => resolve(null));
                    res.on('end', () => resolve(found));
                });
            } catch {
                resolve(null);
            }
        });
    }

    async listUsers(): Promise<Array<{ uid: string; email: string | null; name: string }>> {
        return new Promise((resolve, reject) => {
            const users: Array<{ uid: string; email: string | null; name: string }> = [];
            const opts = {
                scope: 'sub' as const,
                filter: '(|(uid=*)(sAMAccountName=*)(mail=*))',
                attributes: LDAP_ATTRIBUTES.user,
            };

            const performSearch = () => {
                this.client.search(LDAP_CONFIG.userDN || LDAP_CONFIG.baseDN, opts, (error, res) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    res.on('searchEntry', (entry) => {
                        const obj = entry.object as any;
                        const uid = obj.uid || obj.sAMAccountName || obj.cn;
                        const email = obj.mail ?? obj.userPrincipalName ?? null;
                        const name = obj.cn || uid;
                        if (uid) users.push({ uid, email, name });
                    });
                    res.on('error', (err) => reject(err));
                    res.on('end', () => resolve(users));
                });
            };

            if (LDAP_CONFIG.bindDN && LDAP_CONFIG.bindPassword) {
                this.client.bind(LDAP_CONFIG.bindDN, LDAP_CONFIG.bindPassword, (bindErr) => {
                    if (bindErr) {
                        console.error('LDAP listUsers service bind failed:', bindErr);
                        reject(bindErr);
                        return;
                    }
                    performSearch();
                });
            } else {
                performSearch();
            }
        });
    }

    // Role derivation removed: roles are managed in the application database
}

export const ldapService = new LDAPService();