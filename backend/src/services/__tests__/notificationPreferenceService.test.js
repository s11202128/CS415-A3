"use strict";

/**
 * Unit tests for notificationPreferenceService.
 * Uses node:test + a hand-rolled in-memory fake of the NotificationPreference
 * Sequelize model so no DB connection is required.
 *
 * The service is loaded with proxyquire-style require-cache injection: we
 * pre-populate require.cache for `../models` BEFORE requiring the service.
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");

// ---------- Build an in-memory fake NotificationPreference model ----------
function buildFakeModel() {
    const rows = []; // [{ id, eventKey, eventLabel, isEnabled, updatedAt }]
    let nextId = 1;

    function makeRow(data) {
        const row = { ...data };
        row.update = async function (patch) {
            Object.assign(row, patch, { updatedAt: new Date() });
            return row;
        };
        return row;
    }

    return {
        rows,
        async findOrCreate({ where, defaults }) {
            const existing = rows.find((r) => r.eventKey === where.eventKey);
            if (existing) return [existing, false];
            const created = makeRow({
                id: nextId++,
                eventKey: where.eventKey,
                eventLabel: defaults.eventLabel,
                isEnabled: defaults.isEnabled,
                updatedAt: new Date(),
            });
            rows.push(created);
            return [created, true];
        },
        async findAll({ order } = {}) {
            const sorted = [...rows];
            if (order && order[0] && order[0][0] === "id") {
                sorted.sort((a, b) => a.id - b.id);
            }
            return sorted;
        },
        async findOne({ where }) {
            return rows.find((r) => r.eventKey === where.eventKey) || null;
        },
    };
}

// ---------- Inject the fake into require.cache before loading the service ----------
function loadServiceWithFake(fakeModel) {
    const modelsPath = require.resolve(
        path.join(__dirname, "..", "..", "models", "index.js")
    );
    const servicePath = require.resolve(
        path.join(__dirname, "..", "notificationPreferenceService.js")
    );
    // Drop any previously cached service so it picks up our fake models.
    delete require.cache[servicePath];
    require.cache[modelsPath] = {
        id: modelsPath,
        filename: modelsPath,
        loaded: true,
        exports: { NotificationPreference: fakeModel },
    };
    return require(servicePath);
}

function cleanCaches() {
    const modelsPath = require.resolve(
        path.join(__dirname, "..", "..", "models", "index.js")
    );
    const servicePath = require.resolve(
        path.join(__dirname, "..", "notificationPreferenceService.js")
    );
    delete require.cache[modelsPath];
    delete require.cache[servicePath];
}

test("ensureNotificationPreferences seeds one row per known event", async () => {
    const fake = buildFakeModel();
    const svc = loadServiceWithFake(fake);
    try {
        await svc.ensureNotificationPreferences();
        assert.equal(fake.rows.length, svc.NOTIFICATION_EVENTS.length);
        for (const evt of svc.NOTIFICATION_EVENTS) {
            const row = fake.rows.find((r) => r.eventKey === evt.eventKey);
            assert.ok(row, `expected row for ${evt.eventKey}`);
            assert.equal(row.isEnabled, true);
        }
    } finally {
        cleanCaches();
    }
});

test("getNotificationPreferences returns normalized objects sorted by id", async () => {
    const fake = buildFakeModel();
    const svc = loadServiceWithFake(fake);
    try {
        const list = await svc.getNotificationPreferences();
        assert.equal(list.length, svc.NOTIFICATION_EVENTS.length);
        const ids = list.map((r) => r.id);
        const sorted = [...ids].sort((a, b) => a - b);
        assert.deepEqual(ids, sorted);
        for (const item of list) {
            assert.equal(typeof item.eventKey, "string");
            assert.equal(typeof item.eventLabel, "string");
            assert.equal(typeof item.isEnabled, "boolean");
        }
    } finally {
        cleanCaches();
    }
});

test("updateNotificationPreference toggles isEnabled", async () => {
    const fake = buildFakeModel();
    const svc = loadServiceWithFake(fake);
    try {
        const updated = await svc.updateNotificationPreference("BILL_PAYMENT", false);
        assert.equal(updated.eventKey, "BILL_PAYMENT");
        assert.equal(updated.isEnabled, false);
        // And it persists in the underlying store
        const reloaded = await svc.getNotificationPreferences();
        const row = reloaded.find((r) => r.eventKey === "BILL_PAYMENT");
        assert.equal(row.isEnabled, false);
    } finally {
        cleanCaches();
    }
});

test("updateNotificationPreference normalizes the event key (case + whitespace)", async () => {
    const fake = buildFakeModel();
    const svc = loadServiceWithFake(fake);
    try {
        const updated = await svc.updateNotificationPreference(" transfer_sent ", false);
        assert.equal(updated.eventKey, "TRANSFER_SENT");
        assert.equal(updated.isEnabled, false);
    } finally {
        cleanCaches();
    }
});

test("updateNotificationPreference rejects unknown events", async () => {
    const fake = buildFakeModel();
    const svc = loadServiceWithFake(fake);
    try {
        await assert.rejects(
            () => svc.updateNotificationPreference("NOT_A_REAL_EVENT", true),
            /Unsupported notification event/
        );
    } finally {
        cleanCaches();
    }
});

test("isNotificationEnabled returns true by default for known events", async () => {
    const fake = buildFakeModel();
    const svc = loadServiceWithFake(fake);
    try {
        assert.equal(await svc.isNotificationEnabled("LOAN_PAYMENT_DUE"), true);
    } finally {
        cleanCaches();
    }
});

test("isNotificationEnabled returns false after a preference is disabled", async () => {
    const fake = buildFakeModel();
    const svc = loadServiceWithFake(fake);
    try {
        await svc.updateNotificationPreference("MONEY_RECEIVED", false);
        assert.equal(await svc.isNotificationEnabled("MONEY_RECEIVED"), false);
    } finally {
        cleanCaches();
    }
});

test("isNotificationEnabled returns true for unknown events (fail-open)", async () => {
    const fake = buildFakeModel();
    const svc = loadServiceWithFake(fake);
    try {
        assert.equal(await svc.isNotificationEnabled("SOMETHING_ELSE"), true);
    } finally {
        cleanCaches();
    }
});
