/**
 * One-time cleanup: remove test / guest chatbot entries.
 *
 * Deletes from chat_issues and chat_sessions every row where:
 *   - customer_id IS NULL, OR
 *   - customer_name = 'Guest'  (case-insensitive)
 *
 * Real customer conversations (linked to a customer_id and a real name)
 * are preserved.
 *
 * Run from the backend folder:
 *     node scripts/clean-chatbot-test-data.js
 *
 * Add --dry-run to only print what would be removed.
 */

require("dotenv").config();
const { Op, fn, col, where } = require("sequelize");
const sequelize = require("../src/config/database");
const ChatIssueModel = require("../src/models/ChatIssueModel");
const ChatSessionModel = require("../src/models/ChatSessionModel");

const DRY_RUN = process.argv.includes("--dry-run");

const guestFilter = {
  [Op.or]: [
    { customerId: null },
    where(fn("LOWER", col("customer_name")), "guest"),
  ],
};

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");

    const issuesToDelete = await ChatIssueModel.count({ where: guestFilter });
    const sessionsToDelete = await ChatSessionModel.count({ where: guestFilter });

    console.log(`chat_issues   matching test/guest: ${issuesToDelete}`);
    console.log(`chat_sessions matching test/guest: ${sessionsToDelete}`);

    if (issuesToDelete === 0 && sessionsToDelete === 0) {
      console.log("Nothing to clean. Done.");
      process.exit(0);
    }

    if (DRY_RUN) {
      console.log("\n[dry-run] No rows deleted. Re-run without --dry-run to apply.");
      process.exit(0);
    }

    const deletedIssues = await ChatIssueModel.destroy({ where: guestFilter });
    const deletedSessions = await ChatSessionModel.destroy({ where: guestFilter });

    console.log(`\nDeleted ${deletedIssues} chat_issues row(s).`);
    console.log(`Deleted ${deletedSessions} chat_sessions row(s).`);
    console.log("Cleanup complete.");
    process.exit(0);
  } catch (err) {
    console.error("Cleanup failed:", err.message);
    process.exit(1);
  }
})();
