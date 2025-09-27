const path = require('path');

describe('seoConfig service sitemap generation', () => {
  let service;
  let fs;
  let writeFileSync;

  beforeEach(() => {
    jest.resetModules();

    writeFileSync = jest.fn();
    const mkdirSync = jest.fn();
    const existsSync = jest.fn().mockReturnValue(true);

    jest.doMock('fs', () => ({
      existsSync,
      mkdirSync,
      writeFileSync,
      unlinkSync: jest.fn(),
      writeFile: jest.fn(),
      readFileSync: jest.fn(),
      createWriteStream: jest.fn(() => ({
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      })),
    }));

    jest.doMock('node-fetch', () => jest.fn(() => Promise.resolve()));
    jest.doMock('../src/utils/frontend', () => ({ frontendBase: 'https://frontend.test' }));
    jest.doMock('../src/config/database', () => {
      const chain = {
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        insert: jest.fn(),
      };
      const mockDb = jest.fn(() => chain);
      mockDb.fn = { now: jest.fn() };
      return mockDb;
    });

    service = require('../src/modules/seoConfig/seoConfig.service');
    fs = require('fs');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('preserves a 0 priority when regenerating the sitemap', async () => {
    const settings = {
      sitemap: [
        { include: true, path: '/zero', freq: 'daily', priority: 0 },
        { include: true, path: '/default', freq: undefined },
      ],
      baseUrl: 'https://mysite.test/',
      globalSEO: { autoPingSitemap: false },
    };

    jest.spyOn(service, 'getSettings').mockResolvedValue(settings);
    const updateSpy = jest.spyOn(service, 'updateSettings').mockResolvedValue();

    const result = await service.generateSitemap();

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const [filePath, xml] = fs.writeFileSync.mock.calls[0];

    expect(path.basename(filePath)).toBe('sitemap.xml');
    expect(xml).toContain('<loc>https://mysite.test/zero</loc><changefreq>daily</changefreq><priority>0</priority>');
    expect(xml).toContain('<loc>https://mysite.test/default</loc><changefreq>weekly</changefreq><priority>0.5</priority>');
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        sitemapUpdated: expect.any(String),
      })
    );
    expect(result).toEqual({ url: '/uploads/seo/sitemap.xml', updated: expect.any(String) });
  });
});
