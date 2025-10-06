const buildDbStub = ({ failMessage = false } = {}) => {
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
                return workingTickets.find((t) => t.ticket_number === ticket_number) || null;
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

const buildService = ({ failMessage = false } = {}) => {
  const mockDb = buildDbStub({ failMessage });

  jest.resetModules();

  let service;
  jest.isolateModules(() => {
    jest.doMock('../../../config/database', () => mockDb);
    // eslint-disable-next-line global-require
    service = require('../support.service');
  });

  return { service, mockDb };
};

describe('support.service.createTicket', () => {
  test('throws 400 error when subject is empty', async () => {
    const { service, mockDb } = buildService();

    await expect(
      service.createTicket({ user_id: 'user-1', subject: '   ', message: 'hello' })
    ).rejects.toMatchObject({ message: 'Subject is required', statusCode: 400 });

    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  test('throws 400 error when message is empty', async () => {
    const { service, mockDb } = buildService();

    await expect(
      service.createTicket({ user_id: 'user-1', subject: 'Help', message: '\n\n' })
    ).rejects.toMatchObject({ message: 'Message is required', statusCode: 400 });

    expect(mockDb.transaction).not.toHaveBeenCalled();
  });

  test('rolls back ticket insert when message creation fails', async () => {
    const { service, mockDb } = buildService({ failMessage: true });

    await expect(
      service.createTicket({ user_id: 'user-1', subject: 'Help', message: 'Broken' })
    ).rejects.toThrow('message insert failed');

    expect(mockDb.transaction).toHaveBeenCalled();
    expect(mockDb.__state.tickets).toHaveLength(0);
  });
});
