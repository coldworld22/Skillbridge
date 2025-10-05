process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://user:pass@localhost:5432/testdb';

const slugify = require('slugify');

const service = require('../src/modules/users/tutorials/tutorial.service');

const createMockTrx = (returningMock) => {
  const builder = {};
  const insertMock = jest.fn().mockReturnValue(builder);
  builder.insert = insertMock;
  builder.returning = returningMock;
  const trx = jest.fn(() => builder);
  return { trx, insertMock, returningMock, builder };
};

describe('tutorial.service createTutorial', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses the provided slug when inserting a tutorial', async () => {
    const returningMock = jest
      .fn()
      .mockResolvedValue([{ id: 'tutorial-1', slug: 'custom-slug' }]);
    const { trx, insertMock } = createMockTrx(returningMock);

    const result = await service.createTutorial(
      { title: 'My Tutorial', slug: 'custom-slug', included_plans: [] },
      trx
    );

    expect(trx).toHaveBeenCalledWith('tutorials');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'custom-slug' })
    );
    expect(result).toEqual({ id: 'tutorial-1', slug: 'custom-slug' });
  });

  it('retries with a numeric suffix when the slug is taken', async () => {
    const returningMock = jest
      .fn()
      .mockRejectedValueOnce({
        code: '23505',
        constraint: 'tutorials_slug_key',
      })
      .mockResolvedValueOnce([
        { id: 'tutorial-2', slug: 'custom-slug-1' },
      ]);
    const { trx, insertMock, returningMock: returningSpy } = createMockTrx(returningMock);

    const result = await service.createTutorial(
      { title: 'My Tutorial', slug: 'custom-slug' },
      trx
    );

    expect(returningSpy).toHaveBeenCalledTimes(2);
    expect(insertMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ slug: 'custom-slug' })
    );
    expect(insertMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ slug: 'custom-slug-1' })
    );
    expect(result.slug).toBe('custom-slug-1');
  });

  it('derives a slug from the title when one is not provided', async () => {
    const derived = slugify('Another Tutorial', { lower: true, strict: true });
    const returningMock = jest
      .fn()
      .mockResolvedValue([{ id: 'tutorial-3', slug: derived }]);
    const { trx, insertMock } = createMockTrx(returningMock);

    await service.createTutorial({ title: 'Another Tutorial' }, trx);

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ slug: derived })
    );
  });
});
