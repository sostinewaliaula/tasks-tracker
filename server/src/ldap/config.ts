import { ClientOptions } from 'ldapjs';

export const LDAP_CONFIG = {
    url: 'ldap://10.176.18.143:389',
    baseDN: 'dc=caavagroup,dc=com', // Adjust this based on your LDAP structure
    userDN: 'ou=users,dc=caavagroup,dc=com', // Adjust this based on your LDAP structure
    groupDN: 'ou=groups,dc=caavagroup,dc=com', // Adjust this based on your LDAP structure
    options: {
        reconnect: true,
    } as ClientOptions,
};

export const LDAP_ATTRIBUTES = {
    user: ['uid', 'mail', 'cn', 'departmentNumber'],
    group: ['cn', 'member'],
};

export const GROUP_ROLE_MAPPING = {
    'admin-group': 'admin',
    'manager-group': 'manager',
    'employee-group': 'employee',
};