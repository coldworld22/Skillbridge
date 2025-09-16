import handler from '../src/pages/api/health';

describe('GET /api/health', () => {
  it('responds with status ok', async () => {
    const req = { method: 'GET' };
    const res = {
      statusCode: undefined,
      jsonBody: undefined,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.jsonBody = payload;
        return this;
      },
    };

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonBody).toEqual({ status: 'ok' });
  });
});
