import { resolveCheckoutItem } from '@/pages/payments/checkout';

describe('resolveCheckoutItem', () => {
  it('parses encoded items query parameter', () => {
    const items = encodeURIComponent(JSON.stringify([{ id: '123', itemType: 'tutorial' }]));
    const query = { items };
    expect(resolveCheckoutItem(query, [])).toEqual({ id: '123', type: 'tutorial' });
  });

  it('parses items when quotes are not URL-encoded', () => {
    const items = '%5B%7B"id"%3A"123"%2C"itemType"%3A"tutorial"%7D%5D';
    const query = { items };
    expect(resolveCheckoutItem(query, [])).toEqual({ id: '123', type: 'tutorial' });
  });

  it('falls back to cart items when query missing', () => {
    const cart = [{ id: '1', item_type: 'class' }];
    expect(resolveCheckoutItem({}, cart)).toEqual({ id: '1', type: 'class' });
  });

  it('returns null when nothing valid', () => {
    const cart = [{ id: '1' }, { id: '2' }];
    expect(resolveCheckoutItem({}, cart)).toBeNull();
  });

  it('rejects unsupported item types', () => {
    const query = { itemId: '99', itemType: 'invalid' };
    expect(resolveCheckoutItem(query, [])).toBeNull();
  });
});
