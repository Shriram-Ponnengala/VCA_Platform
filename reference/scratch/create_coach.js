const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = "postgresql://postgres:chessenergy@localhost:5432/vca_attendance?schema=public";

async function createCoach() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    
    const username = 'coach';
    const password = 'coach123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = 'COACH';
    const id = 'coach-test-id-123';

    // Check if exists
    const checkRes = await client.query('SELECT * FROM "User" WHERE username = $1', [username]);
    if (checkRes.rows.length > 0) {
      console.log('Coach user already exists');
      return;
    }

    await client.query(
      'INSERT INTO "User" (id, username, "passwordHash", role, "createdAt") VALUES ($1, $2, $3, $4, NOW())',
      [id, username, hashedPassword, role]
    );
    
    console.log(`Coach user created: ${username} / ${password}`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

createCoach();
