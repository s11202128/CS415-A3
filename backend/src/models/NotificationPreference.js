const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const NotificationPreference = sequelize.define(
  "NotificationPreference",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    eventKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    eventLabel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "notification_preferences",
    timestamps: true,
  }
);

module.exports = NotificationPreference;
