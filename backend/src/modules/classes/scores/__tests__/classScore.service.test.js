jest.mock('../../../../config/database', () => jest.fn());
jest.mock('../../../users/tutorials/certificate/certificate.service', () => ({
  generateCode: jest.fn(() => 'TUT-XXXX'),
  resolveTemplateId: jest.fn(() => Promise.resolve('tpl-default')),
}));

const db = require('../../../../config/database');
const { generateCode, resolveTemplateId } = require('../../../users/tutorials/certificate/certificate.service');
const service = require('../classScore.service');

describe('calculateForClass', () => {
  beforeEach(() => {
    db.mockReset();
  });

  it('resolves all student scores and captures errors', async () => {
    const enrollments = [
      { user_id: 's1', full_name: 'Student One' },
      { user_id: 's2', full_name: 'Student Two' },
    ];

    db.mockImplementation(() => ({
      join: () => ({
        where: () => ({
          select: () => Promise.resolve(enrollments),
        }),
      }),
    }));

    const original = service.calculateForStudent;
    service.calculateForStudent = jest
      .fn()
      .mockResolvedValueOnce({ total_score: 80 })
      .mockRejectedValueOnce(new Error('failure'));

    const results = await service.calculateForClass('class1');

    expect(results).toEqual([
      { total_score: 80, student_id: 's1', full_name: 'Student One' },
      { student_id: 's2', full_name: 'Student Two', error: 'failure' },
    ]);

    service.calculateForStudent = original;
  });
});

describe('issueCertificate', () => {
  beforeEach(() => {
    db.mockReset();
    generateCode.mockClear();
    resolveTemplateId.mockClear();
    resolveTemplateId.mockResolvedValue('tpl-default');
    db.fn = { now: jest.fn(() => 'now') };
  });

  it('persists certificate with resolved template id', async () => {
    const insertCert = jest.fn().mockResolvedValue([]);
    const updateScore = jest.fn().mockResolvedValue([]);

    db.mockImplementation((table) => {
      if (table === 'certificates') {
        return {
          where: () => ({ first: () => Promise.resolve(null) }),
          insert: insertCert,
        };
      }
      if (table === 'student_class_scores as scs') {
        return {
          leftJoin: () => ({
            where: () => ({
              andWhere: () => ({ select: () => ({ first: () => Promise.resolve({ passed: true }) }) }),
            }),
          }),
        };
      }
      if (table === 'student_class_scores') {
        return {
          where: () => ({ update: updateScore }),
        };
      }
      return { where: () => ({ first: () => Promise.resolve(null) }) };
    });

    const cert = await service.issueCertificate('class-1', 'student-1', 'tpl-custom');

    expect(resolveTemplateId).toHaveBeenCalledWith('tpl-custom');
    expect(insertCert).toHaveBeenCalledWith(
      expect.objectContaining({ template_id: 'tpl-default', class_id: 'class-1', user_id: 'student-1' }),
    );
    expect(cert.template_id).toBe('tpl-default');
    expect(updateScore).toHaveBeenCalled();
  });
});
