import '@testing-library/jest-dom';

const mockCreateToken = jest.fn().mockResolvedValue({ token: { id: 'tok_123' } });
jest.mock('@stripe/react-stripe-js', () => {
  const React = require('react');
  return {
    CardElement: (props) => React.createElement('div', { 'data-testid': 'card-element', ...props }),
    useStripe: () => ({ createToken: mockCreateToken }),
    useElements: () => ({ getElement: () => ({}) }),
    __esModule: true,
  };
});

global.mockStripeCreateToken = mockCreateToken;
