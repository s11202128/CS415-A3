// Scan business-layer rows and remove any whose IDs don't match real bank data.
const sequelize = require("../src/config/database");
const { BusinessLayerAccount, BusinessLayerCard, Account, Customer } = require("../src/models");

(async () => {
  try {
    await sequelize.authenticate();

    // Real reference data
    const realAccountNumbers = new Set(
      (await Account.findAll({ attributes: ["accountNumber"] })).map((a) => a.accountNumber)
    );
    const realCustomerIds = new Set(
      (await Customer.findAll({ attributes: ["id"] })).map((c) => String(c.id))
    );

    console.log(`Real bank accounts: ${realAccountNumbers.size}`);
    console.log(`Real customers:     ${realCustomerIds.size}`);

    // 1. Business-layer accounts
    const accountRows = await BusinessLayerAccount.findAll();
    let removedAccounts = 0;
    for (const row of accountRows) {
      if (!realAccountNumbers.has(row.accountId)) {
        console.log(`  REMOVE business_layer_account: ${row.accountId} (no matching accountNumber)`);
        await row.destroy();
        removedAccounts += 1;
      } else {
        console.log(`  KEEP   business_layer_account: ${row.accountId}`);
      }
    }

    // 2. Credit cards
    const cardRows = await BusinessLayerCard.findAll();
    let removedCards = 0;
    for (const row of cardRows) {
      if (!realCustomerIds.has(String(row.customerId))) {
        console.log(`  REMOVE business_layer_card: ${row.cardNumber} (customer ${row.customerId} not found)`);
        await row.destroy();
        removedCards += 1;
      } else {
        console.log(`  KEEP   business_layer_card: ${row.cardNumber} (customer ${row.customerId})`);
      }
    }

    console.log(`\nRemoved ${removedAccounts} accounts, ${removedCards} cards.`);
  } catch (err) {
    console.error("ERR", err.message);
  } finally {
    await sequelize.close();
  }
})();
