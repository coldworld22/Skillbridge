jest.mock("../../../config/database", () => {
  const mockDb = jest.fn();
  return Object.assign(mockDb, { fn: { now: jest.fn() } });
});

const db = require("../../../config/database");
const AppError = require("../../../utils/AppError");
const service = require("../support.service");

const createWhereFirstBuilder = (result, assertions = () => {}) => {
  const builder = {
    where: jest.fn((criteria) => {
      assertions(criteria);
      return builder;
    }),
    first: jest.fn().mockResolvedValue(result),
  };

  return builder;
};

describe("support.service.uploadAttachment", () => {
  beforeEach(() => {
    db.mockReset();
    jest.restoreAllMocks();
  });

  it("persists an attachment when the requester owns the ticket", async () => {
    const messageRecord = {
      id: "message-1",
      ticket_id: "ticket-1",
      sender_id: "user-1",
    };
    const ticketRecord = {
      id: "ticket-1",
      user_id: "user-1",
    };

    db.mockImplementationOnce(() =>
      createWhereFirstBuilder(messageRecord, (criteria) => {
        expect(criteria).toEqual({ id: "message-1" });
      })
    );

    db.mockImplementationOnce(() =>
      createWhereFirstBuilder(ticketRecord, (criteria) => {
        expect(criteria).toEqual({ id: "ticket-1" });
      })
    );

    const attachmentRecord = { id: "attachment-1" };
    const addAttachmentSpy = jest
      .spyOn(service, "addAttachment")
      .mockResolvedValue(attachmentRecord);

    const result = await service.uploadAttachment({
      messageId: "message-1",
      file: { filename: "abc123", originalname: "document.pdf" },
      user: { id: "user-1", roles: ["Student"] },
    });

    expect(result).toBe(attachmentRecord);
    expect(addAttachmentSpy).toHaveBeenCalledWith({
      message_id: "message-1",
      file_url: "/uploads/support_attachments/abc123",
      file_name: "document.pdf",
    });

    addAttachmentSpy.mockRestore();
  });

  it("throws a 404 error when the message does not exist", async () => {
    db.mockImplementationOnce(() =>
      createWhereFirstBuilder(null, (criteria) => {
        expect(criteria).toEqual({ id: "missing" });
      })
    );

    await service
      .uploadAttachment({
        messageId: "missing",
        file: { filename: "abc123" },
        user: { id: "user-1" },
      })
      .catch((error) => {
        expect(error).toBeInstanceOf(AppError);
        expect(error.statusCode).toBe(404);
      });
  });

  it("throws a 403 error when the user cannot access the ticket", async () => {
    const messageRecord = {
      id: "message-2",
      ticket_id: "ticket-2",
      sender_id: "another-user",
    };
    const ticketRecord = {
      id: "ticket-2",
      user_id: "ticket-owner",
    };

    db.mockImplementationOnce(() =>
      createWhereFirstBuilder(messageRecord, (criteria) => {
        expect(criteria).toEqual({ id: "message-2" });
      })
    );

    db.mockImplementationOnce(() =>
      createWhereFirstBuilder(ticketRecord, (criteria) => {
        expect(criteria).toEqual({ id: "ticket-2" });
      })
    );

    const addAttachmentSpy = jest.spyOn(service, "addAttachment");

    await expect(
      service.uploadAttachment({
        messageId: "message-2",
        file: { filename: "abc123" },
        user: { id: "unauthorized", roles: ["student"] },
      })
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(addAttachmentSpy).not.toHaveBeenCalled();

    addAttachmentSpy.mockRestore();
  });
});
