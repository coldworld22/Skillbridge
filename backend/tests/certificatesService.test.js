const { newDb } = require('pg-mem');
const { v4: uuidv4 } = require('uuid');

const db = newDb();
db.public.registerFunction({ name: 'uuid_generate_v4', returns: 'uuid', implementation: uuidv4 });
const mockDb = db.adapters.createKnex();

jest.mock('../src/config/database.js', () => mockDb);

const certificateTemplatesService = require('../src/modules/certificateTemplates/certificateTemplates.service');
const tutorialCertificateService = require('../src/modules/users/tutorials/certificate/certificate.service');
const certificatesService = require('../src/modules/certificates/certificates.service');

describe('certificate templates and certificates integration', () => {
  beforeAll(async () => {
    await mockDb.schema.createTable('certificate_templates', (table) => {
      table.uuid('id').primary();
      table.string('name');
      table.string('type');
      table.string('font_family');
      table.string('title_font');
      table.string('border_color');
      table.text('logo');
      table.text('background');
      table.boolean('show_qr');
      table.boolean('active');
      table.timestamps(true, true);
    });

    await mockDb.schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('full_name');
    });

    await mockDb.schema.createTable('tutorials', (table) => {
      table.uuid('id').primary();
      table.string('title');
    });

    await mockDb.schema.createTable('online_classes', (table) => {
      table.uuid('id').primary();
      table.string('title');
      table.string('access_type').notNullable().defaultTo('paid');
    });

    await mockDb.schema.createTable('certificates', (table) => {
      table.uuid('id').primary();
      table.uuid('user_id');
      table.uuid('tutorial_id');
      table.uuid('class_id');
      table.uuid('template_id');
      table.string('certificate_code');
      table.string('status');
      table.timestamp('revoked_at');
      table.string('reason');
      table.timestamps(true, true);
    });
  });

  afterAll(async () => {
    await mockDb.destroy();
  });

  beforeEach(async () => {
    await mockDb('certificates').del();
    await mockDb('certificate_templates').del();
    await mockDb('users').del();
    await mockDb('tutorials').del();
    await mockDb('online_classes').del();
  });

  it('returns the active template for a given type', async () => {
    const inactiveId = uuidv4();
    const activeId = uuidv4();

    await mockDb('certificate_templates').insert([
      {
        id: inactiveId,
        name: 'Inactive',
        type: 'Completion',
        font_family: 'Roboto',
        title_font: 'Lora',
        border_color: '#000000',
        logo: 'logo-inactive.png',
        background: 'bg-inactive.png',
        show_qr: true,
        active: false,
        created_at: new Date('2023-01-01T00:00:00Z'),
        updated_at: new Date('2023-01-01T00:00:00Z'),
      },
      {
        id: activeId,
        name: 'Active',
        type: 'Completion',
        font_family: 'Georgia',
        title_font: 'Playfair',
        border_color: '#FFFFFF',
        logo: 'logo-active.png',
        background: 'bg-active.png',
        show_qr: false,
        active: true,
        created_at: new Date('2023-02-01T00:00:00Z'),
        updated_at: new Date('2023-02-02T00:00:00Z'),
      },
    ]);

    const activeTemplate = await certificateTemplatesService.getActiveByType('Completion');

    expect(activeTemplate).toBeTruthy();
    expect(activeTemplate.id).toBe(activeId);
    expect(activeTemplate.name).toBe('Active');
  });

  it('stores the active template id when issuing tutorial certificates', async () => {
    const templateId = uuidv4();
    const userId = uuidv4();
    const tutorialId = uuidv4();

    await mockDb('certificate_templates').insert({
      id: templateId,
      name: 'Tutorial Template',
      type: 'Completion',
      font_family: 'Georgia, serif',
      title_font: "'Great Vibes', cursive",
      border_color: '#FACC15',
      logo: 'logo.png',
      background: 'bg.png',
      show_qr: true,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await mockDb('users').insert({ id: userId, full_name: 'Student User' });
    await mockDb('tutorials').insert({ id: tutorialId, title: 'Tutorial' });

    const certificate = await tutorialCertificateService.issueCertificate({
      userId,
      tutorialId,
      certificateType: 'Completion',
    });

    expect(certificate.template_id).toBe(templateId);

    const stored = await mockDb('certificates').where({ id: certificate.id }).first();
    expect(stored).toBeTruthy();
    expect(stored.template_id).toBe(templateId);
  });

  it('includes template styling fields when fetching certificates', async () => {
    const templateId = uuidv4();
    const userId = uuidv4();
    const classId = uuidv4();

    await mockDb('users').insert({ id: userId, full_name: 'Jane Student' });
    await mockDb('online_classes').insert({ id: classId, title: 'Physics 101', access_type: 'paid' });
    await mockDb('certificate_templates').insert({
      id: templateId,
      name: 'Class Template',
      type: 'Completion',
      font_family: 'Georgia, serif',
      title_font: "'Great Vibes', cursive",
      border_color: '#FACC15',
      logo: 'logo.png',
      background: 'bg.png',
      show_qr: true,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const certificateId = uuidv4();
    await mockDb('certificates').insert({
      id: certificateId,
      user_id: userId,
      class_id: classId,
      template_id: templateId,
      certificate_code: 'CERT-123',
      status: 'issued',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const results = await certificatesService.getAll({ page: 1, limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: certificateId,
      template_id: templateId,
      template_name: 'Class Template',
      template_type: 'Completion',
      template_font_family: 'Georgia, serif',
      template_title_font: "'Great Vibes', cursive",
      template_border_color: '#FACC15',
      template_logo: 'logo.png',
      template_background: 'bg.png',
      template_show_qr: true,
    });
  });
});
