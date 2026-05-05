const { NotificationPreference } = require("../models");

const NOTIFICATION_EVENTS = [
  { eventKey: "LOAN_PAYMENT_DUE", eventLabel: "Loan payment due" },
  { eventKey: "CREDIT_CARD_TRANSACTION", eventLabel: "Credit card transactions" },
  { eventKey: "BILL_PAYMENT", eventLabel: "Bill payments" },
  { eventKey: "TRANSFER_SENT", eventLabel: "Money sent" },
  { eventKey: "MONEY_RECEIVED", eventLabel: "Money received" },
];

async function ensureNotificationPreferences() {
  for (const event of NOTIFICATION_EVENTS) {
    await NotificationPreference.findOrCreate({
      where: { eventKey: event.eventKey },
      defaults: {
        eventLabel: event.eventLabel,
        isEnabled: true,
      },
    });
  }
}

async function getNotificationPreferences() {
  await ensureNotificationPreferences();
  const rows = await NotificationPreference.findAll({
    order: [["id", "ASC"]],
  });
  return rows.map((row) => ({
    id: row.id,
    eventKey: row.eventKey,
    eventLabel: row.eventLabel,
    isEnabled: Boolean(row.isEnabled),
    updatedAt: row.updatedAt,
  }));
}

async function updateNotificationPreference(eventKey, isEnabled) {
  const normalizedKey = String(eventKey || "").trim().toUpperCase();
  const matchedEvent = NOTIFICATION_EVENTS.find((event) => event.eventKey === normalizedKey);
  if (!matchedEvent) {
    throw new Error("Unsupported notification event");
  }

  await ensureNotificationPreferences();
  const row = await NotificationPreference.findOne({ where: { eventKey: normalizedKey } });
  if (!row) {
    throw new Error("Notification preference not found");
  }
  await row.update({ isEnabled: Boolean(isEnabled), eventLabel: matchedEvent.eventLabel });

  return {
    id: row.id,
    eventKey: row.eventKey,
    eventLabel: row.eventLabel,
    isEnabled: Boolean(row.isEnabled),
    updatedAt: row.updatedAt,
  };
}

async function isNotificationEnabled(notificationType) {
  const normalizedType = String(notificationType || "").trim().toUpperCase();
  const hasEvent = NOTIFICATION_EVENTS.some((event) => event.eventKey === normalizedType);
  if (!hasEvent) {
    return true;
  }
  await ensureNotificationPreferences();
  const row = await NotificationPreference.findOne({ where: { eventKey: normalizedType } });
  return row ? Boolean(row.isEnabled) : true;
}

module.exports = {
  NOTIFICATION_EVENTS,
  ensureNotificationPreferences,
  getNotificationPreferences,
  updateNotificationPreference,
  isNotificationEnabled,
};
