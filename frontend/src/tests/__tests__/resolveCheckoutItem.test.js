import { resolveCheckoutItem } from '@/pages/payments/checkout';

describe('resolveCheckoutItem', () => {
  it('parses encoded items query parameter', () => {
    const items = encodeURIComponent(
      JSON.stringify([{ id: '123', itemType: 'tutorial' }])
    );
    const query = { items };
    expect(resolveCheckoutItem(query, [])).toEqual({ id: '123', type: 'tutorial' });
  });

  it('parses double-encoded items query parameter', () => {
    const items = encodeURIComponent(
      encodeURIComponent(JSON.stringify([{ id: '123', itemType: 'tutorial' }]))
    );
    const query = { items };
    expect(resolveCheckoutItem(query, [])).toEqual({ id: '123', type: 'tutorial' });
  });

  it('returns null on malformed items', () => {
    const items = encodeURIComponent('[{id:123,itemType:tutorial}]');
    const query = { items };
    expect(resolveCheckoutItem(query, [])).toBeNull();
  });

  it('falls back to cart items when query missing', () => {
    const cart = [{ id: '1', item_type: 'class' }];
    expect(resolveCheckoutItem({}, cart)).toEqual({ id: '1', type: 'class' });
  });

  it('returns null when nothing valid', () => {
    const cart = [{ id: '1' }, { id: '2' }];
    expect(resolveCheckoutItem({}, cart)).toBeNull();
  });
});
