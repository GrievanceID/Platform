'use strict';

const path = require('path');
const pool = require('./pool');
const seedData = require('../../seeds/institutions.seed.json');

async function seed() {
  if (seedData.length === 0) {
    console.log('institutions.seed.json is empty — nothing to seed.');
    await pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const inst of seedData) {
      await client.query(
        `INSERT INTO institutions (id, name, category, is_default_for_category)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE
           SET name = EXCLUDED.name,
               category = EXCLUDED.category,
               is_default_for_category = EXCLUDED.is_default_for_category`,
        [inst.id, inst.name, inst.category, inst.is_default_for_category ?? false]
      );
    }
    await client.query('COMMIT');
    console.log(`Seeded ${seedData.length} institution(s).`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
