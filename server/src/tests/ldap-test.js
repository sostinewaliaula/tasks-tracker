const ldap = require('ldapjs');

// Create LDAP client
const client = ldap.createClient({
  url: 'ldap://10.176.18.143:389'
});

// Bind with admin credentials
client.bind('uid=admin,ou=people,dc=turnkeyafrica,dc=com', 'turnkey4ever', (err) => {
  if (err) {
    console.error('LDAP bind error:', err);
    process.exit(1);
  }

  console.log('Successfully bound to LDAP server');

  // Perform a simple search to test the connection
  const opts = {
    filter: '(objectClass=*)',
    scope: 'sub',
    attributes: ['dn']
  };

  client.search('dc=turnkeyafrica,dc=com', opts, (err, res) => {
    if (err) {
      console.error('LDAP search error:', err);
      process.exit(1);
    }

    res.on('searchEntry', (entry) => {
      console.log('Found entry:', entry.object.dn);
    });

    res.on('error', (err) => {
      console.error('LDAP search result error:', err);
    });

    res.on('end', (result) => {
      console.log('LDAP search completed');
      client.unbind();
    });
  });
});