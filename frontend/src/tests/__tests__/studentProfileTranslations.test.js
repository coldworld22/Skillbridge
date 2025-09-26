import fs from 'fs';
import path from 'path';

describe('studentProfilePage translations', () => {
  const localesDir = path.join(__dirname, '../../../public/locales');
  const locales = fs.readdirSync(localesDir);

  it('should include fix_errors in all locales', () => {
    const missing = [];

    locales.forEach((locale) => {
      const filePath = path.join(localesDir, locale, 'dashboard.json');
      const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const studentProfile = translations.studentProfilePage;

      if (!studentProfile || !Object.prototype.hasOwnProperty.call(studentProfile, 'fix_errors')) {
        missing.push(locale);
      }
    });

    expect(missing).toEqual([]);
  });

  it('should include validation.url_invalid in all locales', () => {
    const missing = [];

    locales.forEach((locale) => {
      const filePath = path.join(localesDir, locale, 'dashboard.json');
      const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const validation = translations.studentProfilePage?.validation;

      if (!validation || !Object.prototype.hasOwnProperty.call(validation, 'url_invalid')) {
        missing.push(locale);
      }
    });

    expect(missing).toEqual([]);
  });
});
