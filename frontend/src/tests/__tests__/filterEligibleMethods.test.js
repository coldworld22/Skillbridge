import { filterEligibleMethods } from '@/pages/payments/checkout';

describe('filterEligibleMethods', () => {
  const methods = [
    { id: 1, name: 'Stripe', type: 'stripe', active: true },
    { id: 2, name: 'PayPal', type: null, active: true },
    { id: 3, name: 'Bank', type: 'bank', active: true },
    { id: 4, name: 'USDT', type: 'usdt', active: true },
    { id: 5, name: 'Inactive', type: 'stripe', active: false },
  ];

  it('returns active methods for non-plan items', () => {
    const result = filterEligibleMethods(methods, 'class');
    expect(result.map((m) => m.name)).toEqual([
      'Stripe',
      'PayPal',
      'Bank',
      'USDT',
    ]);
  });

  it('returns active methods for plan items', () => {
    const result = filterEligibleMethods(methods, 'plan');
    expect(result.map((m) => m.name)).toEqual([
      'Stripe',
      'PayPal',
      'Bank',
      'USDT',
    ]);
  });

  it('handles methods with non-string identifiers', () => {
    const weirdMethods = [
      { id: 6, name: 123, type: undefined, active: true },
      { id: 7, name: 'Some', type: 456, active: true },
    ];
    expect(() => filterEligibleMethods(weirdMethods, 'class')).not.toThrow();
    const result = filterEligibleMethods(weirdMethods, 'plan');
    expect(result.map((m) => m.id)).toEqual([6, 7]);
  });
});
