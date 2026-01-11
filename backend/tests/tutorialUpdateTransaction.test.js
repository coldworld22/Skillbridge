jest.mock('../src/config/database', () => {
  const query = { where: jest.fn().mockReturnThis(), del: jest.fn().mockResolvedValue() };
  const commitSpy = jest.fn();
  const rollbackSpy = jest.fn();
  const trx = Object.assign(jest.fn(() => query), {
    commit: jest.fn(async () => { commitSpy(); }),
    rollback: jest.fn(async () => { rollbackSpy(); }),
  });
  const db = Object.assign(jest.fn(() => query), {
    transaction: jest.fn().mockResolvedValue(trx),
    raw: jest.fn(),
  });
  db.__commit = commitSpy;
  db.__rollback = rollbackSpy;
  db.__trx = trx;
  return db;
});

jest.mock('../src/modules/users/tutorials/tutorial.service', () => ({
  updateTutorial: jest.fn(),
  addTutorialTags: jest.fn(),
  getTutorialTags: jest.fn(),
  getTutorialById: jest.fn(),
}));

jest.mock('../src/modules/users/tutorials/tutorialTag.service', () => ({
  findByName: jest.fn(),
  createTag: jest.fn(),
}));

const controller = require('../src/modules/users/tutorials/tutorial.controller');
const service = require('../src/modules/users/tutorials/tutorial.service');
const tagService = require('../src/modules/users/tutorials/tutorialTag.service');
const db = require('../src/config/database');

describe('updateTutorial tag transactions', () => {
  beforeEach(() => {
    db.transaction.mockClear();
    db.__commit.mockClear();
    db.__rollback.mockClear();
    service.updateTutorial.mockReset();
    service.addTutorialTags.mockReset();
    service.getTutorialTags.mockReset();
    service.getTutorialById.mockReset();
    tagService.findByName.mockReset();
    tagService.createTag.mockReset();
    db.transaction.mockResolvedValue(db.__trx);
    service.getTutorialById.mockResolvedValue({
      id: '1',
      tenant_id: 'tenant-1',
    });
  });

  const baseReq = {
    params: { id: '1' },
    body: { tags: ['Tag1'] },
    files: {},
    user: { id: 'admin', role: 'admin' },
    tenant: { id: 'tenant-1' },
  };

  it('commits transaction when tag update succeeds', async () => {
    service.updateTutorial.mockResolvedValue({ id: '1' });
    tagService.findByName.mockResolvedValue({ id: 't1' });
    service.addTutorialTags.mockResolvedValue();
    service.getTutorialTags.mockResolvedValue([{ id: 't1' }]);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await controller.updateTutorial(baseReq, res, next);
    await new Promise((resolve) => setImmediate(resolve));
    expect(db.transaction).toHaveBeenCalled();
    expect(db.__commit).toHaveBeenCalled();
    expect(db.__rollback).not.toHaveBeenCalled();
    expect(service.addTutorialTags).toHaveBeenCalledWith('1', ['t1'], db.__trx);
    expect(next).not.toHaveBeenCalled();
  });

  it('rolls back transaction when tag creation fails', async () => {
    service.updateTutorial.mockResolvedValue({ id: '1' });
    tagService.findByName.mockResolvedValue(null);
    tagService.createTag.mockRejectedValue(new Error('fail'));
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await controller.updateTutorial(baseReq, res, next);
    await new Promise((resolve) => setImmediate(resolve));
    expect(db.__rollback).toHaveBeenCalled();
    expect(db.__commit).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
