import { render, waitFor } from '@testing-library/react';
import CheckoutRedirect from '../../pages/checkout';

const replace = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { foo: 'bar', baz: '1' },
    replace,
  }),
}));

afterEach(() => {
  replace.mockClear();
});

test('redirects to payments/checkout preserving query parameters', async () => {
  render(<CheckoutRedirect />);
  await waitFor(() =>
    expect(replace).toHaveBeenCalledWith({
      pathname: '/payments/checkout',
      query: { foo: 'bar', baz: '1' },
    }),
  );
});
