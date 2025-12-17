const fs = require('fs');
const path = require('path');

/**
 * Read the error log file and return the most recent entries.
 * Each line should follow the format:
 *   `timestamp [LEVEL] message`
 *
 * @param {number} limit Number of log lines to return
 * @returns {Promise<Array>} Parsed log objects ordered newest first
 */

const LOG_FILE = path.join(__dirname, '../../../logs/error.log');

exports.getRecentErrors = async (limit = 50) => {
  try {
    const data = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = data.trim().split('\n');
    const recent = lines.slice(-limit).map((line, idx) => {
      const [timePart, levelPart, ...rest] = line.split(' ');
      const level = levelPart ? levelPart.replace(/\[|\]/g, '') : 'INFO';
      const message = rest.join(' ');
      return {
        id: idx,
        time: new Date(timePart).toISOString(),
        level,
        message,
        type: 'system',
      };
    });
    return recent.reverse();
  } catch (err) {
    return [];
  }
};
