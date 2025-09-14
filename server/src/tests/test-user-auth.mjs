import ldap from 'ldapjs';

console.log('Starting LDAP user authentication test...');

const email = 'sostine.waliaula@turnkeyafrica.com';

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

// First, bind as admin to search for the user
client.bind('uid=admin,ou=people,dc=turnkeyafrica,dc=com', 'turnkey4ever', async (err) => {
  if (err) {
    console.error('Admin bind error:', err);
    process.exit(1);
  }

  console.log('Successfully bound as admin, searching for user...');

  // Search for the user by email
  const opts = {
    filter: `(mail=${email})`,
    scope: 'sub',
    attributes: ['dn', 'cn', 'mail']
  };

  client.search('dc=turnkeyafrica,dc=com', opts, (err, res) => {
    if (err) {
      console.error('Search error:', err);
      process.exit(1);
    }

    res.on('searchEntry', (entry) => {
      const userDN = entry.objectName;
      console.log('Found user DN:', userDN);
      
      // Now prompt for password
      console.log('\nPlease enter your password to test authentication.');
      process.stdout.write('Password: ');
      
      // Handle password input
      process.stdin.on('data', (data) => {
        const password = data.toString().trim();
        
        // Create new client for user authentication
        const userClient = ldap.createClient({
          url: 'ldap://10.176.18.143:389',
          timeout: 5000,
          connectTimeout: 5000
        });

        // Try to bind with user credentials
        userClient.bind(userDN, password, (err) => {
          if (err) {
            console.error('\nAuthentication failed:', err.message);
            process.exit(1);
          }
          
          console.log('\nAuthentication successful! User credentials are valid.');
          userClient.unbind();
          process.exit(0);
        });
      });
    });

    res.on('error', (err) => {
      console.error('Search error:', err);
    });

    res.on('end', (result) => {
      if (!result) {
        console.log('User not found with email:', email);
        process.exit(1);
      }
    });
  });
});