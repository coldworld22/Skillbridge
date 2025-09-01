import {
  resolveIconElement,
  TrustedIcon,
  TRUSTED_ICON_HOSTS,
} from '@/pages/payments/checkout';
import { FaPaypal, FaMoneyCheckAlt } from 'react-icons/fa';

describe('resolveIconElement', () => {
  it('returns react icon for known provider names', () => {
    const el = resolveIconElement({ icon: 'paypal' });
    expect(el.type).toBe(FaPaypal);
  });

  it('returns react icon for file-like names', () => {
    const el = resolveIconElement({ icon: 'paypal.svg' });
    expect(el.type).toBe(FaPaypal);
  });

  it('returns TrustedIcon for URLs from trusted hosts', () => {
    const url = `https://${TRUSTED_ICON_HOSTS[0]}/custom.png`;
    const el = resolveIconElement({ icon: url, name: 'Custom' });
    expect(el.type).toBe(TrustedIcon);
    expect(el.props.src).toBe(url);
  });

  it('falls back to default icon for untrusted URLs', () => {
    const url = 'https://cdn.example.com/custom.png';
    const el = resolveIconElement({ icon: url, name: 'Custom' });
    expect(el.type).toBe(FaMoneyCheckAlt);
  });
});

