const fs = require('fs');
const path = require('path');

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
