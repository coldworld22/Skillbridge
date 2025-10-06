const loadServiceWithDb = (mockDb) => {
  jest.resetModules();

  jest.doMock('../../../config/database', () => mockDb);

  let service;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    service = require('../support.service');
  });

  return { service, mockDb };
};

const buildCreateTicketDbStub = ({ failMessage = false } = {}) => {
  const state = { tickets: [] };

  const db = jest.fn();

  db.transaction = jest.fn(async (callback) => {
    const workingTickets = [...state.tickets];

    const trx = (table) => {
      if (table === 'support_tickets') {
        return {
          where({ ticket_number }) {
            return {
              async first() {
                return (
                  workingTickets.find((t) => t.ticket_number === ticket_number) || null
                );
              },
            };
          },
          insert(data) {
            return {
              async returning() {
                const ticket = {
                  id: `ticket-${workingTickets.length + 1}`,
                  ...data,
                };
                workingTickets.push(ticket);
                return [ticket];
              },
            };
          },
        };
      }

      if (table === 'support_messages') {
        return {
          async insert() {
            if (failMessage) {
              throw new Error('message insert failed');
            }
            return [{}];
          },
        };
      }

      throw new Error(`Unhandled table ${table}`);
    };

    trx.isTransaction = true;

    try {
      const result = await callback(trx);
      state.tickets = workingTickets;
      return result;
    } catch (error) {
      throw error;
    }
  });

  db.__state = state;

  return db;
};

const buildUploadDbStub = ({
  message = { id: 'message-1', ticket_id: 'ticket-1', sender_id: 'user-1' },
  ticket = { id: 'ticket-1', user_id: 'user-1' },
  attachmentRow = {
    id: 'attachment-1',
    message_id: 'message-1',
    file_url: '/uploads/support_attachments/file.png',
    file_name: 'file.png',
  },
} = {}) => {
  const messageFirst = jest.fn().mockResolvedValue(message ?? null);
  const messageWhere = jest.fn().mockReturnValue({ first: messageFirst });

  const ticketFirst = jest.fn().mockResolvedValue(ticket ?? null);
  const ticketWhere = jest.fn().mockReturnValue({ first: ticketFirst });

  const insertReturning = jest.fn().mockResolvedValue([attachmentRow]);
  const attachmentInsert = jest.fn().mockReturnValue({ returning: insertReturning });

  const db = jest.fn((table) => {
    if (table === 'support_messages') {
      return { where: messageWhere };
    }

    if (table === 'support_tickets') {
      return { where: ticketWhere };
    }

    if (table === 'support_attachments') {
      return { insert: attachmentInsert };
    }

    throw new Error(`Unhandled table ${table}`);
  });

  db.__mocks = {
    messageFirst,
    messageWhere,
    ticketFirst,
    ticketWhere,
    attachmentInsert,
    insertReturning,
  };

  return db;
};

describe('support.service.createTicket', () => {
  test('throws 400 error when subject is empty', async () => {
    const mockDb = buildCreateTicketDbStub();
    const { service } = loadServiceWithDb(mockDb);

    await expect(
      service.createTicket({ user_id: 'user-1', subject: '   ', message: 'hello' })
    ).rejects.toMatchObject({ message: 'Subject is required', statusCode: 400 });

    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  test('throws 400 error when message is empty', async () => {
    const mockDb = buildCreateTicketDbStub();
    const { service } = loadServiceWithDb(mockDb);

    await expect(
      service.createTicket({ user_id: 'user-1', subject: 'Help', message: '\n\n' })
    ).rejects.toMatchObject({ message: 'Message is required', statusCode: 400 });

    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  test('rolls back ticket insert when message creation fails', async () => {
    const mockDb = buildCreateTicketDbStub({ failMessage: true });
    const { service } = loadServiceWithDb(mockDb);

    await expect(
      service.createTicket({ user_id: 'user-1', subject: 'Help', message: 'Broken' })
    ).rejects.toThrow('message insert failed');

    expect(mockDb.transaction).toHaveBeenCalled();
    expect(mockDb.__state.tickets).toHaveLength(0);
  });
});

describe('support.service.uploadAttachment', () => {
  const defaultFile = {
    filename: 'file.png',
    originalname: 'receipt.png',
  };

  test('stores attachment when user owns the ticket', async () => {
    const mockDb = buildUploadDbStub();
    const { service } = loadServiceWithDb(mockDb);

    const result = await service.uploadAttachment({
      messageId: 'message-1',
      file: defaultFile,
      user: { id: 'user-1' },
    });

    expect(mockDb.__mocks.attachmentInsert).toHaveBeenCalledWith({
      message_id: 'message-1',
      file_url: '/uploads/support_attachments/file.png',
      file_name: 'receipt.png',
    });
    expect(result).toEqual({
      id: 'attachment-1',
      message_id: 'message-1',
      file_url: '/uploads/support_attachments/file.png',
      file_name: 'file.png',
    });
  });

  test('throws 404 when support message cannot be found', async () => {
    const mockDb = buildUploadDbStub({ message: null });
    const { service } = loadServiceWithDb(mockDb);

    await expect(
      service.uploadAttachment({
        messageId: 'missing-message',
        file: defaultFile,
        user: { id: 'user-1' },
      })
    ).rejects.toMatchObject({ message: 'Support message not found', statusCode: 404 });

    expect(mockDb.__mocks.attachmentInsert).not.toHaveBeenCalled();
  });

  test('throws 404 when related ticket is missing', async () => {
    const mockDb = buildUploadDbStub({ ticket: null });
    const { service } = loadServiceWithDb(mockDb);

    await expect(
      service.uploadAttachment({
        messageId: 'message-1',
        file: defaultFile,
        user: { id: 'user-1' },
      })
    ).rejects.toMatchObject({ message: 'Support ticket not found', statusCode: 404 });

    expect(mockDb.__mocks.attachmentInsert).not.toHaveBeenCalled();
  });

  test('rejects when user lacks permissions', async () => {
    const mockDb = buildUploadDbStub({
      message: { id: 'message-1', ticket_id: 'ticket-1', sender_id: 'other-user' },
      ticket: { id: 'ticket-1', user_id: 'other-user' },
    });
    const { service } = loadServiceWithDb(mockDb);

    await expect(
      service.uploadAttachment({
        messageId: 'message-1',
        file: defaultFile,
        user: { id: 'user-1', roles: ['student'] },
      })
    ).rejects.toMatchObject({ message: 'Access denied', statusCode: 403 });

    expect(mockDb.__mocks.attachmentInsert).not.toHaveBeenCalled();
  });
});
