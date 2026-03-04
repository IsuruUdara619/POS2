const { Pool } = require('pg');

const creds = [
  { user: 'postgres', pass: 'postgres' },
  { user: 'postgres', pass: 'admin' },
  { user: 'postgres', pass: 'password' },
  { user: 'postgres', pass: 'root' },
  { user: 'postgres', pass: '1234' },
  { user: 'postgres', pass: '123456' },
  { user: 'postgres', pass: 'admin123' },
  { user: 'postgres', pass: '' },
  { user: 'heaven_user', pass: 'heaven_password' },
  { user: 'admin', pass: 'admin' },
  { user: 'admin', pass: 'admin123' }
];

async function testCreds() {
  console.log('Testing credentials...');
  for (const c of creds) {
    const connectionString = `postgres://${c.user}:${c.pass}@localhost:5432/Heaven_Bakers`;
    // Also try connecting to default 'postgres' db in case 'Heaven_Bakers' doesn't exist yet
    const connectionStringDefault = `postgres://${c.user}:${c.pass}@localhost:5432/postgres`;

    try {
      console.log(`Trying ${c.user} / ${c.pass} on Heaven_Bakers...`);
      const pool = new Pool({ connectionString, connectionTimeoutMillis: 2000 });
      await pool.query('SELECT 1');
      console.log(`SUCCESS: ${c.user} / ${c.pass} on Heaven_Bakers`);
      await pool.end();
      process.exit(0);
    } catch (e) {
        if (e.code === '3D000') { // database does not exist
             console.log(`Database Heaven_Bakers does not exist, but auth worked for ${c.user} / ${c.pass}`);
             console.log('Trying postgres db...');
             try {
                const pool2 = new Pool({ connectionString: connectionStringDefault, connectionTimeoutMillis: 2000 });
                await pool2.query('SELECT 1');
                console.log(`SUCCESS: ${c.user} / ${c.pass} on postgres DB`);
                await pool2.end();
                process.exit(0);
             } catch(e2) {
                 console.log(`Failed on postgres DB: ${e2.message}`);
             }
        } else {
            console.log(`Failed: ${e.message}`);
        }
    }
  }
  console.log('All attempts failed.');
}

testCreds();
