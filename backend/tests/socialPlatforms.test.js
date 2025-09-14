const fs = require('fs');

describe('socialPlatforms', () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('throws an error when socialPlatforms.json is missing', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(() =>
      require('../src/modules/users/common/socialPlatforms')
    ).toThrow(/socialPlatforms\.json file not found/);
  });
});

