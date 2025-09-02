import fs from 'fs';
import path from 'path';

describe('enroll_for_free translations', () => {
  it('should exist for all supported locales', () => {
    const localesDir = path.join(__dirname, '../../../public/locales');
    const locales = fs.readdirSync(localesDir);
    const missing = [];

    locales.forEach((locale) => {
      const filePath = path.join(localesDir, locale, 'common.json');
      const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!translations.enroll_for_free) {
        missing.push(locale);
      }
    });

    expect(missing).toEqual([]);
  });
});
