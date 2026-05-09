/*
 * Migration: add `frozen` column to business_layer_cards.
 * Usage: node scripts/migrate_card_frozen.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { sequelize } = require("../src/models");

async function run() {
  console.log("Running migration: add frozen column to business_layer_cards");
  const [cols] = await sequelize.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_layer_cards' AND COLUMN_NAME = 'frozen'",
  );
  if (Array.isArray(cols) && cols.length > 0) {
    console.log("Column frozen already exists; skipping");
  } else {
    await sequelize.query(
      "ALTER TABLE business_layer_cards ADD COLUMN frozen TINYINT(1) NOT NULL DEFAULT 0 AFTER statement_due;",
    );
    console.log("OK: added frozen column");
  }
  await sequelize.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
