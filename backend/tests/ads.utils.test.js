const {
  parsePlanFeatures,
  calculateCtr,
  resolveAdPlanFeatures,
} = require('../src/modules/ads/ads.utils');

describe('parsePlanFeatures', () => {
  it('converts feature list to keyed object with parsed values', () => {
    const plan = {
      features: [
        { feature_key: 'ads_max_ads', value: '5' },
        { feature_key: 'ads_allow_branding', value: 'true' },
        { feature_key: 'ads_complex', value: '{"a":1}' },
      ],
    };

    const result = parsePlanFeatures(plan);
    expect(result).toEqual({
      ads_max_ads: 5,
      ads_allow_branding: true,
      ads_complex: { a: 1 },
    });
  });

  it('returns empty object when plan has no features', () => {
    expect(parsePlanFeatures({})).toEqual({});
    expect(parsePlanFeatures(null)).toEqual({});
  });
});

describe('calculateCtr', () => {
  it('returns percentage of clicks over views', () => {
    expect(calculateCtr(50, 200)).toBeCloseTo(25);
    expect(calculateCtr('10', '100')).toBeCloseTo(10);
  });

  it('returns 0 when views is 0 or invalid', () => {
    expect(calculateCtr(5, 0)).toBe(0);
    expect(calculateCtr(5, null)).toBe(0);
    expect(calculateCtr('abc', 10)).toBe(0);
  });
});

describe('resolveAdPlanFeatures', () => {
  it('merges configured features with defaults based on plan slug', () => {
    const plan = {
      slug: 'instructor-regular',
      features: [
        { feature_key: 'ads_max_ads', value: '8' },
        { feature_key: 'ads_allow_branding', value: 'false' },
      ],
    };
    const result = resolveAdPlanFeatures(plan);
    expect(result.ads_max_ads).toBe(8);
    expect(result.ads_allow_branding).toBe(false);
    expect(result.ads_max_duration).toBe(14); // default preserved
    expect(result.ads_show_analytics).toBe(true);
  });

  it('falls back to defaults when plan has no explicit features', () => {
    const plan = { slug: 'prime' };
    const result = resolveAdPlanFeatures(plan);
    expect(result).toEqual(
      expect.objectContaining({
        ads_max_ads: 10,
        ads_max_duration: 30,
        ads_allow_branding: true,
        ads_show_analytics: true,
      })
    );
  });
});
