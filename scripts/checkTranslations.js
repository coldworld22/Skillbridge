const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'frontend', 'public', 'locales');
const baseLang = 'en';
const languages = fs.readdirSync(localesDir).filter(l => l !== 'de');

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

['auth.json', 'common.json', 'dashboard.json', 'website.json'].forEach(compareFiles);
