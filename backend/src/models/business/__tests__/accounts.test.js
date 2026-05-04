"use strict";

/**
 * Unit tests for the business-layer account classes.
 * Run with:  node --test backend/src/models/business/__tests__
 * Requires Node 18+ (uses built-in node:test). No external test deps.
 */

const test = require("node:test");
const assert = require("node:assert/strict");

const BankAccount = require("../BankAccount");
const AccessAccount = require("../AccessAccount");
const SavingsAccount = require("../SavingsAccount");
const BusinessAccount = require("../BusinessAccount");
const CreditCardAccount = require("../CreditCardAccount");
const AccountFactory = require("../AccountFactory");

const baseArgs = { accountId: "ACC-001", owner: "Alice", balance: 100 };

/* ---------- BankAccount (abstract) ---------- */
test("BankAccount is abstract — calculateMonthlyFee throws if not overridden", () => {
  const acc = new BankAccount({ ...baseArgs, accountType: "x" });
  assert.throws(() => acc.calculateMonthlyFee(), /must be implemented/);
});

test("BankAccount.deposit / withdraw validate positive amounts", () => {
  const acc = new AccessAccount(baseArgs);
  assert.throws(() => acc.deposit(0));
  assert.throws(() => acc.deposit(-1));
  assert.throws(() => acc.withdraw("abc"));
});

test("BankAccount.withdraw rejects insufficient balance", () => {
  const acc = new AccessAccount({ ...baseArgs, balance: 50 });
  assert.throws(() => acc.withdraw(60), /Insufficient/);
});

test("BankAccount.round2 rounds to 2 decimals", () => {
  assert.equal(BankAccount.round2(0.1 + 0.2), 0.3);
  assert.equal(BankAccount.round2(1.235), 1.24);
  assert.equal(BankAccount.round2(2.5), 2.5);
});

/* ---------- AccessAccount ---------- */
test("AccessAccount monthly fee is flat $0.90", () => {
  const acc = new AccessAccount(baseArgs);
  assert.equal(acc.calculateMonthlyFee(), 0.9);
});

test("AccessAccount.applyMonthlyFee deducts $0.90 and rounds", () => {
  const acc = new AccessAccount({ ...baseArgs, balance: 10 });
  const fee = acc.applyMonthlyFee();
  assert.equal(fee, 0.9);
  assert.equal(acc.balance, 9.1);
});

/* ---------- SavingsAccount ---------- */
test("SavingsAccount: 0 withdrawals → $0 fee", () => {
  const acc = new SavingsAccount(baseArgs);
  assert.equal(acc.calculateMonthlyFee(), 0);
});

test("SavingsAccount: 1 withdrawal (free) → $0 fee", () => {
  const acc = new SavingsAccount(baseArgs);
  acc.withdraw(10);
  assert.equal(acc.calculateMonthlyFee(), 0);
});

test("SavingsAccount: 2 withdrawals → $5 fee", () => {
  const acc = new SavingsAccount(baseArgs);
  acc.withdraw(10);
  acc.withdraw(10);
  assert.equal(acc.calculateMonthlyFee(), 5);
});

test("SavingsAccount: 4 withdrawals → $15 fee (3 chargeable × $5)", () => {
  const acc = new SavingsAccount(baseArgs);
  for (let i = 0; i < 4; i++) acc.withdraw(5);
  assert.equal(acc.calculateMonthlyFee(), 15);
});

test("SavingsAccount.resetMonthlyTrackers clears withdrawal count", () => {
  const acc = new SavingsAccount(baseArgs);
  acc.withdraw(5);
  acc.withdraw(5);
  acc.resetMonthlyTrackers();
  assert.equal(acc.withdrawalCount, 0);
  assert.equal(acc.calculateMonthlyFee(), 0);
});

/* ---------- BusinessAccount ---------- */
test("BusinessAccount: net input < $2000 → $20 fee", () => {
  const acc = new BusinessAccount({ ...baseArgs, balance: 5000 });
  acc.deposit(1500);
  acc.withdraw(100); // net 1400
  assert.equal(acc.calculateMonthlyFee(), 20);
});

test("BusinessAccount: net input exactly $2000 → $0 fee (boundary)", () => {
  const acc = new BusinessAccount({ ...baseArgs, balance: 5000 });
  acc.deposit(2000);
  assert.equal(acc.calculateMonthlyFee(), 0);
});

test("BusinessAccount: net input > $2000 → $0 fee", () => {
  const acc = new BusinessAccount({ ...baseArgs, balance: 5000 });
  acc.deposit(3000);
  acc.withdraw(500); // net 2500
  assert.equal(acc.calculateMonthlyFee(), 0);
});

test("BusinessAccount.resetMonthlyTrackers clears deposit/withdrawal counters", () => {
  const acc = new BusinessAccount({ ...baseArgs, balance: 5000 });
  acc.deposit(500);
  acc.withdraw(100);
  acc.resetMonthlyTrackers();
  assert.equal(acc.monthlyDeposits, 0);
  assert.equal(acc.monthlyWithdrawals, 0);
  // After reset, net is 0 < 2000 → still $20
  assert.equal(acc.calculateMonthlyFee(), 20);
});

/* ---------- AccountFactory ---------- */
test("AccountFactory creates correct subclass per type", () => {
  assert.ok(AccountFactory.createAccount("access", "A1", "X") instanceof AccessAccount);
  assert.ok(AccountFactory.createAccount("SAVINGS", "A2", "X") instanceof SavingsAccount);
  assert.ok(AccountFactory.createAccount(" Business ", "A3", "X") instanceof BusinessAccount);
});

test("AccountFactory rejects unsupported type with helpful error", () => {
  assert.throws(
    () => AccountFactory.createAccount("checking", "A1", "X"),
    /Unsupported account type.*access.*savings.*business/
  );
});

test("AccountFactory.isSupported", () => {
  assert.equal(AccountFactory.isSupported("access"), true);
  assert.equal(AccountFactory.isSupported("foo"), false);
});

/* ---------- Polymorphism ---------- */
test("Polymorphism: applyMonthlyFee calls subclass calculateMonthlyFee", () => {
  const accounts = [
    AccountFactory.createAccount("access", "A1", "X", { balance: 100 }),
    AccountFactory.createAccount("savings", "A2", "X", { balance: 100 }),
    AccountFactory.createAccount("business", "A3", "X", { balance: 100 }),
  ];
  // Trigger fee paths
  accounts[1].withdraw(10); accounts[1].withdraw(10); // 2 withdrawals → $5
  // business account has 0 deposits → $20
  const fees = accounts.map((a) => a.applyMonthlyFee());
  assert.deepEqual(fees, [0.9, 5, 20]);
});

/* ---------- CreditCardAccount (kept separate, NOT a BankAccount) ---------- */
test("CreditCardAccount does NOT extend BankAccount", () => {
  const card = new CreditCardAccount({
    cardNumber: "4111111111111111",
    customerId: "1",
    creditLimit: 1000,
  });
  assert.equal(card instanceof BankAccount, false);
});

test("CreditCardAccount.charge respects credit limit", () => {
  const card = new CreditCardAccount({
    cardNumber: "4111111111111111",
    customerId: "1",
    creditLimit: 100,
  });
  card.charge(80);
  assert.equal(card.currentBalance, 80);
  assert.equal(card.getAvailableCredit(), 20);
  assert.throws(() => card.charge(50), /exceeds credit limit/);
});

test("CreditCardAccount.makePayment never goes below zero", () => {
  const card = new CreditCardAccount({
    cardNumber: "4111111111111111",
    customerId: "1",
    creditLimit: 100,
    currentBalance: 30,
  });
  card.makePayment(50);
  assert.equal(card.currentBalance, 0);
});
