import { parseCheckoutItems } from '@/utils/parseCheckoutItems';

describe('parseCheckoutItems', () => {
  it('parses encoded items query parameter', () => {
    const items = encodeURIComponent(
      JSON.stringify([{ id: '123', itemType: 'tutorial' }])
    );
    expect(parseCheckoutItems(items)).toEqual({ id: '123', type: 'tutorial' });
  });

  it('parses array form of query parameter', () => {
    const items = encodeURIComponent(
      JSON.stringify([{ id: '1', itemType: 'class' }])
    );
    expect(parseCheckoutItems([items])).toEqual({ id: '1', type: 'class' });
  });

  it('returns null for malformed JSON', () => {
    const items = '%7Bbad-json%7D';
    expect(parseCheckoutItems(items)).toBeNull();
  });

  it('returns null when required fields are missing', () => {
    const items = encodeURIComponent(JSON.stringify([{ itemType: 'class' }]));
    expect(parseCheckoutItems(items)).toBeNull();
  });
});
