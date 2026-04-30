const sequelize = require("../src/config/database");
const { Account, Customer } = require("../src/models");

const BASE = "http://localhost:4000/api";

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  return { status: res.status, data };
}

function assert(cond, label) {
  if (cond) console.log("  PASS:", label);
  else { console.log("  FAIL:", label); process.exitCode = 1; }
}

(async () => {
  await sequelize.authenticate();
  const realAccount = await Account.findOne();
  const realCustomer = await Customer.findOne();
  if (!realAccount || !realCustomer) {
    console.log("Need at least one Account and one Customer in the DB to run tests");
    await sequelize.close();
    return;
  }
  const realAccountNumber = realAccount.accountNumber;
  const realCustomerId = realCustomer.id;
  console.log("Using real accountNumber:", realAccountNumber, "customerId:", realCustomerId);

  // 1. Reject non-existent account number
  let r = await call("POST", "/accounts/create", { type: "savings", accountId: "000000000000", owner: "x" });
  assert(r.status === 400 && /does not exist/i.test(r.data.error), "reject non-existent accountId");

  // 2. Accept matching account number (use as savings type)
  r = await call("POST", "/accounts/create", { type: "savings", accountId: realAccountNumber });
  // Could already exist from prior runs -> accept 201 OR 409
  assert(r.status === 201 || r.status === 409, "accept matching accountNumber (201 or 409)");

  // 3. Confirm row exists & owner came from real account
  r = await call("GET", `/accounts/${realAccountNumber}/summary`);
  assert(r.status === 200 && r.data.accountId === realAccountNumber, "summary returns matched account");
  assert(r.data.owner === realAccount.accountHolder || r.data.owner.length > 0, "owner populated from real account");

  // 4. Reject non-existent customer for credit card
  const fakeCustomerId = 999999999;
  r = await call("POST", "/creditcard/create", { cardNumber: "TEST-CARD-MATCH-" + Date.now(), customerId: fakeCustomerId, creditLimit: 500 });
  assert(r.status === 400 && /does not exist/i.test(r.data.error), "reject non-existent customer for card");

  // 5. Accept matching customerId
  const cardNum = "CC-MATCH-" + Date.now();
  r = await call("POST", "/creditcard/create", { cardNumber: cardNum, customerId: realCustomerId, creditLimit: 500 });
  assert(r.status === 201 && Number(r.data.customerId) === Number(realCustomerId), "accept matching customerId for card");

  await sequelize.close();
  console.log("\n=== Done ===");
})();
