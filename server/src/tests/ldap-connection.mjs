import ldap from 'ldapjs';

console.log('Starting LDAP connection test...');

// Create LDAP client
const client = ldap.createClient({
  url: 'ldap://10.176.18.143:389',
  timeout: 5000,
  connectTimeout: 5000
});

// Add error handler
client.on('error', (err) => {
  console.error('LDAP client error:', err);
});

// Bind with admin credentials
try {
  client.bind('uid=admin,ou=people,dc=turnkeyafrica,dc=com', 'turnkey4ever', (err) => {
    if (err) {
      console.error('LDAP bind error:', err);
      process.exit(1);
    }
    
    console.log('Successfully authenticated to LDAP server!');
    client.unbind();
    process.exit(0);
  });
} catch (err) {
  console.error('Error during LDAP operation:', err);
  process.exit(1);
}