const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:chessenergy@localhost:5432/vca_attendance?schema=public",
});

async function main() {
  try {
    await client.connect();
    const res = await client.query('SELECT username, role FROM "User"');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
