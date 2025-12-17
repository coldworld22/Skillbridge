const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'frontend', 'public', 'locales');
const baseLang = 'en';

// Collect all language directories under locales. Previously German (de)
// was excluded, but we now include every directory so that all translations
// are checked.
const languages = fs
  .readdirSync(localesDir)
  .filter((dir) => fs.statSync(path.join(localesDir, dir)).isDirectory());

function getKeyPaths(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys = keys.concat(getKeyPaths(value, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

function loadJson(lang, file) {
  const filePath = path.join(localesDir, lang, file);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function compareFiles(file) {
  const baseKeys = new Set(getKeyPaths(loadJson(baseLang, file)));
  for (const lang of languages) {
    if (lang === baseLang) continue;
    const langKeys = new Set(getKeyPaths(loadJson(lang, file)));
    for (const key of baseKeys) {
      if (!langKeys.has(key)) {
        console.error(`${lang}/${file} missing key: ${key}`);
      }
    }
  }
}

// Determine the files to compare based on the base language directory rather
// than relying on a hard-coded list. This ensures new translation files are
// automatically included in the checks.
const files = fs
  .readdirSync(path.join(localesDir, baseLang))
  .filter((file) => file.endsWith('.json'));

files.forEach(compareFiles);
