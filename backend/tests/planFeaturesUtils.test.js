const { parseFeatureValue, buildFeatureMap, parsePlanFeatures } = require('../src/utils/planFeatures');

describe('planFeatures utils', () => {
  describe('parseFeatureValue', () => {
    it('parses booleans and numbers from strings', () => {
      expect(parseFeatureValue('true')).toBe(true);
      expect(parseFeatureValue('false')).toBe(false);
      expect(parseFeatureValue('0.5')).toBe(0.5);
      expect(parseFeatureValue('42')).toBe(42);
    });

    it('returns trimmed strings when parsing fails', () => {
      expect(parseFeatureValue(' unlimited ')).toBe('unlimited');
    });
  });

  describe('buildFeatureMap', () => {
    it('creates a feature map with typed values and metadata', () => {
      const map = buildFeatureMap([
        { feature_key: 'community_post', value: 'true', description: 'Post in community' },
        { feature_key: 'groups_join_limit', value: '5' },
      ]);

      expect(map.community_post).toEqual({
        value: true,
        raw: 'true',
        description: 'Post in community',
      });
      expect(map.groups_join_limit).toEqual({
        value: 5,
        raw: '5',
        description: null,
      });
    });

    it('falls back to empty map when features are missing', () => {
      expect(buildFeatureMap()).toEqual({});
      expect(buildFeatureMap(null)).toEqual({});
    });
  });

  describe('parsePlanFeatures', () => {
    it('leverages parseFeatureValue for typed output', () => {
      const features = parsePlanFeatures({
        features: [
          { feature_key: 'ads_show_analytics', value: 'false' },
          { feature_key: 'ads_max_ads', value: '10' },
        ],
      });

      expect(features.ads_show_analytics).toBe(false);
      expect(features.ads_max_ads).toBe(10);
    });
  });
});
