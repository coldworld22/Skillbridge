import '@testing-library/jest-dom';

jest.mock('@/services/api/csrf', () => ({
  getCsrfToken: jest.fn(() => 'csrf-test-token'),
  ensureCsrfTokenCookie: jest.fn().mockResolvedValue(true),
}));

const mockCreateToken = jest.fn().mockResolvedValue({ token: { id: 'tok_123' } });
jest.mock('@stripe/react-stripe-js', () => {
  const React = require('react');
  return {
    CardElement: (props) => React.createElement('div', { 'data-testid': 'card-element', ...props }),
    useStripe: () => ({ createToken: mockCreateToken }),
    useElements: () => ({ getElement: () => ({}) }),
    Elements: ({ children }) =>
      React.createElement('div', { 'data-testid': 'elements-wrapper' }, children),
    __esModule: true,
  };
});

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: () => Promise.resolve({}),
}));

global.mockStripeCreateToken = mockCreateToken;
