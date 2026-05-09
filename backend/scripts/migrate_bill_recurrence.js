/*
 * Migration: add recurrence column to bills table.
 * Usage: node scripts/migrate_bill_recurrence.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { sequelize } = require("../src/models");

async function run() {
  console.log("Running migration: add recurrence column to bills");
  const [cols] = await sequelize.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bills' AND COLUMN_NAME = 'recurrence'",
  );

  if (Array.isArray(cols) && cols.length > 0) {
    console.log("Column recurrence already exists; skipping");
  } else {
    await sequelize.query(
      "ALTER TABLE bills ADD COLUMN recurrence VARCHAR(32) NOT NULL DEFAULT 'once' AFTER dueDate;",
    );
    console.log("OK: added recurrence column");
  }

  await sequelize.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
