import ldap from 'ldapjs';

// Create LDAP client
const client = ldap.createClient({
  url: 'ldap://10.176.18.143:389',
  timeout: 5000
});

// Attempt direct bind with the user's full DN
const userDN = 'uid=sostine.waliaula,ou=people,dc=turnkeyafrica,dc=com';

console.log('Starting direct user authentication test...');
console.log('Using DN:', userDN);

// Prompt for password
console.log('\nPlease enter your password:');
process.stdout.write('Password: ');

process.stdin.on('data', (data) => {
  const password = data.toString().trim();
  
  // Attempt to bind with user credentials
  client.bind(userDN, password, (err) => {
    if (err) {
      console.error('\nAuthentication failed:', err.message);
      process.exit(1);
    }
    
    console.log('\nAuthentication successful! Your credentials are valid.');
    client.unbind();
    process.exit(0);
  });
});