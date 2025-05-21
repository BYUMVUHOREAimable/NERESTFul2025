// utils/logger.js
const prisma = require('../config/database');

/**
 * Logs an action to the database.
 * @param {object} logData - The data for the log entry.
 * @param {number} [logData.userId] - ID of the user performing the action.
 * @param {string} logData.action - Description of the action.
 * @param {string} [logData.entityType] - Type of the entity affected (e.g., "Vehicle", "SlotRequest").
 * @param {number} [logData.entityId] - ID of the entity affected.
 * @param {object} [logData.details] - Additional JSON details about the action.
 */
const logAction = async ({ userId, action, entityType, entityId, details }) => {
  try {
    await prisma.log.create({
      data: {
        user_id: userId ? Number(userId) : null,
        action,
        entity_type: entityType,
        entity_id: entityId ? Number(entityId) : null,
        details,
      },
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};

module.exports = { logAction };