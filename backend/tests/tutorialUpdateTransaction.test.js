jest.mock('../src/modules/users/tutorials/chapters/tutorialChapter.service', () => ({
  create: jest.fn(),
}));

jest.mock('../src/services/transaction.service', () => ({
  withTransaction: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn()
}));

process.env.JWT_SECRET = 'test-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh';
process.env.SESSION_SECRET = 'test-session';
process.env.TEST_DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';

const chapterService = require('../src/modules/users/tutorials/chapters/tutorialChapter.service');
const { withTransaction } = require('../src/services/transaction.service');
const { v4: uuidv4 } = require('uuid');
const service = require('../src/modules/users/tutorials/tutorial.service');

const mockTrx = { name: 'trx' };

describe('tutorial service transactional helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    withTransaction.mockImplementation((handler) => handler(mockTrx));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createTutorialWithRelations', () => {
    it('creates tutorial, tags, and chapters in a single transaction', async () => {
      const tutorial = { id: 'tutorial-1', title: 'My Tut' };
      const createTutorialSpy = jest
        .spyOn(service, 'createTutorial')
        .mockResolvedValue(tutorial);
      const updateTagsSpy = jest
        .spyOn(service, 'updateTutorialTags')
        .mockResolvedValue();
      const getTagsSpy = jest
        .spyOn(service, 'getTutorialTags')
        .mockResolvedValue([{ id: 'tag-1', name: 'JavaScript' }]);
      uuidv4
        .mockImplementationOnce(() => 'chapter-1')
        .mockImplementationOnce(() => 'chapter-2');

      const result = await service.createTutorialWithRelations(
        { title: 'My Tut' },
        ['JavaScript'],
        [
          { title: 'Intro', duration: 60 },
          { id: 'existing', title: 'Advanced', order: 5, is_preview: true },
        ]
      );

      expect(withTransaction).toHaveBeenCalledTimes(1);
      expect(createTutorialSpy).toHaveBeenCalledWith({ title: 'My Tut' }, mockTrx);
      expect(updateTagsSpy).toHaveBeenCalledWith('tutorial-1', ['JavaScript'], mockTrx);
      expect(getTagsSpy).toHaveBeenCalledWith('tutorial-1', mockTrx);
      expect(chapterService.create).toHaveBeenCalledTimes(2);
      expect(chapterService.create).toHaveBeenNthCalledWith(
        1,
        {
          id: 'chapter-1',
          tutorial_id: 'tutorial-1',
          title: 'Intro',
          video_url: null,
          duration: 60,
          order: 1,
          is_preview: false,
        },
        mockTrx
      );
      expect(chapterService.create).toHaveBeenNthCalledWith(
        2,
        {
          id: 'existing',
          tutorial_id: 'tutorial-1',
          title: 'Advanced',
          video_url: null,
          duration: null,
          order: 5,
          is_preview: true,
        },
        mockTrx
      );
      expect(result).toEqual({
        ...tutorial,
        tags: [{ id: 'tag-1', name: 'JavaScript' }],
        chapters: [
          {
            id: 'chapter-1',
            tutorial_id: 'tutorial-1',
            title: 'Intro',
            video_url: null,
            duration: 60,
            order: 1,
            is_preview: false,
          },
          {
            id: 'existing',
            tutorial_id: 'tutorial-1',
            title: 'Advanced',
            video_url: null,
            duration: null,
            order: 5,
            is_preview: true,
          },
        ],
      });
    });

    it('returns tutorial with empty relations when none provided', async () => {
      const tutorial = { id: 'tutorial-2', title: 'Solo' };
      jest.spyOn(service, 'createTutorial').mockResolvedValue(tutorial);
      const updateTagsSpy = jest.spyOn(service, 'updateTutorialTags');
      const getTagsSpy = jest.spyOn(service, 'getTutorialTags');

      const result = await service.createTutorialWithRelations({ title: 'Solo' });

      expect(updateTagsSpy).not.toHaveBeenCalled();
      expect(getTagsSpy).not.toHaveBeenCalled();
      expect(chapterService.create).not.toHaveBeenCalled();
      expect(result).toEqual({ ...tutorial, tags: [], chapters: [] });
    });
  });

  describe('updateTutorialTagsTransactional', () => {
    it('wraps updateTutorialTags in a transaction and returns updated tags', async () => {
      const updateTagsSpy = jest
        .spyOn(service, 'updateTutorialTags')
        .mockResolvedValue();
      const getTagsSpy = jest
        .spyOn(service, 'getTutorialTags')
        .mockResolvedValue([{ id: 'tag-2', name: 'Node.js' }]);

      const result = await service.updateTutorialTagsTransactional('tutorial-3', ['Node.js']);

      expect(withTransaction).toHaveBeenCalledTimes(1);
      expect(updateTagsSpy).toHaveBeenCalledWith('tutorial-3', ['Node.js'], mockTrx);
      expect(getTagsSpy).toHaveBeenCalledWith('tutorial-3', mockTrx);
      expect(result).toEqual([{ id: 'tag-2', name: 'Node.js' }]);
    });
  });
});
