import { resolveIconElement } from '@/pages/payments/checkout';
import { FaPaypal } from 'react-icons/fa';

describe('resolveIconElement', () => {
  it('returns react icon for known provider names', () => {
    const el = resolveIconElement({ icon: 'paypal' });
    expect(el.type).toBe(FaPaypal);
  });

  it('returns react icon for file-like names', () => {
    const el = resolveIconElement({ icon: 'paypal.svg' });
    expect(el.type).toBe(FaPaypal);
  });

  it('returns react icon for file names containing paypal', () => {
    const el = resolveIconElement({ icon: 'paypal_payment.png' });
    expect(el.type).toBe(FaPaypal);
  });

  it('returns react icon when provider name contains paypal', () => {
    const el = resolveIconElement({ name: 'PayPal Payment Gateway' });
    expect(el.type).toBe(FaPaypal);
  });

  it('returns img for full URLs of unknown providers', () => {
    const url = 'https://cdn.example.com/custom.png';
    const el = resolveIconElement({ icon: url, name: 'Custom' });
    expect(el.type).toBe('img');
    expect(el.props.src).toBe(url);
  });
});

