import { ClientOptions } from 'ldapjs';

export const LDAP_CONFIG = {
    url: process.env.LDAP_URL || 'ldap://10.176.18.143:389',
    baseDN: process.env.LDAP_BASE_DN || 'dc=turnkeyafrica,dc=com',
    userDN: process.env.LDAP_SEARCH_BASE || 'ou=people,dc=turnkeyafrica,dc=com',
    groupDN: process.env.LDAP_GROUP_DN || 'ou=groups,dc=turnkeyafrica,dc=com',
    bindDN: process.env.LDAP_BIND_DN || undefined,
    bindPassword: process.env.LDAP_BIND_PASSWORD || undefined,
    options: {
        reconnect: true,
    } as ClientOptions,
};

export const LDAP_ATTRIBUTES = {
    user: ['uid', 'mail', 'cn', 'userPrincipalName', 'sAMAccountName'],
    group: ['cn', 'member'],
};

export const GROUP_ROLE_MAPPING = {
    'admin-group': 'admin',
    'manager-group': 'manager',
    'employee-group': 'employee',
};