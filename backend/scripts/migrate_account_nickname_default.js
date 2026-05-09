/*
 * Migration: add nickname + isDefault to accounts table, and ensure each
 * customer has exactly one default account.
 *
 * Usage:
 *   DB_HOST=localhost DB_USER=root DB_PASSWORD=secret DB_NAME=bof_banking_db \
 *   node scripts/migrate_account_nickname_default.js
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { sequelize } = require('../src/models');

async function run() {
  console.log('Running migration: add nickname + isDefault to accounts');

  const addColumnIfMissing = async (column, sql) => {
    const [cols] = await sequelize.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounts' AND COLUMN_NAME = '${column}'`
    );
    if (Array.isArray(cols) && cols.length > 0) {
      console.log(`Column ${column} already exists; skipping`);
      return;
    }
    await sequelize.query(sql);
    console.log(`OK: ${sql}`);
  };

  await addColumnIfMissing(
    'nickname',
    "ALTER TABLE accounts ADD COLUMN nickname VARCHAR(40) NULL AFTER status;"
  );
  await addColumnIfMissing(
    'isDefault',
    "ALTER TABLE accounts ADD COLUMN isDefault TINYINT(1) NOT NULL DEFAULT 0 AFTER nickname;"
  );

  // Backfill: for any customer without a default account, mark their lowest-id active row as default.
  console.log('Backfilling default flag for customers without one...');
  const [customers] = await sequelize.query(
    'SELECT DISTINCT customerId FROM accounts WHERE customerId IS NOT NULL'
  );
  let backfilled = 0;
  for (const row of customers) {
    const cid = row.customerId;
    const [existing] = await sequelize.query(
      `SELECT id FROM accounts WHERE customerId = ${cid} AND isDefault = 1 LIMIT 1`
    );
    if (Array.isArray(existing) && existing.length > 0) continue;
    const [picked] = await sequelize.query(
      `SELECT id FROM accounts WHERE customerId = ${cid} AND (status IS NULL OR status NOT IN ('rejected','closed')) ORDER BY id ASC LIMIT 1`
    );
    if (Array.isArray(picked) && picked.length > 0) {
      await sequelize.query(`UPDATE accounts SET isDefault = 1 WHERE id = ${picked[0].id}`);
      backfilled += 1;
    }
  }
  console.log(`OK: backfilled isDefault for ${backfilled} customers`);

  console.log('Migration complete.');
  await sequelize.close();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
