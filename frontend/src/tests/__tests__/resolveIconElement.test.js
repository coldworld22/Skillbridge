import { render, screen } from '@testing-library/react';
import { TrustedIcon } from '@/pages/payments/checkout';

describe('resolveIconElement', () => {
  it('passes alt text to fallback icon', () => {
    render(<TrustedIcon alt="Custom" />);
    expect(screen.getByLabelText('Custom')).toBeInTheDocument();
  });

  const loadModule = async () => {
    jest.resetModules();
    const mod = await import('@/pages/payments/checkout');
    const icons = await import('react-icons/fa');
    return { ...mod, ...icons };
  };

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_TRUSTED_ICON_HOSTS;
  });

  it('returns react icon for known provider names', async () => {
    const { resolveIconElement, FaPaypal } = await loadModule();
    const el = resolveIconElement({ icon: 'paypal' });
    expect(el.type.name).toBe(FaPaypal.name);
  });

  it('returns react icon for file-like names', async () => {
    const { resolveIconElement, FaPaypal } = await loadModule();
    const el = resolveIconElement({ icon: 'paypal.svg' });
    expect(el.type.name).toBe(FaPaypal.name);
  });

  it('returns PayPal icon when method name references PayPal', async () => {
    const { resolveIconElement, FaPaypal } = await loadModule();
    const el = resolveIconElement({ type: 'manual', name: 'Pay Pal' });
    expect(el.type.name).toBe(FaPaypal.name);
  });

  it('returns TrustedIcon for URLs from trusted hosts', async () => {
    process.env.NEXT_PUBLIC_TRUSTED_ICON_HOSTS = 'example.com';
    const { resolveIconElement, TRUSTED_ICON_HOSTS, TrustedIcon } = await loadModule();
    const url = `https://${TRUSTED_ICON_HOSTS[0]}/custom.png`;
    const el = resolveIconElement({ icon: url, name: 'Custom' });
    expect(el.type).toBe(TrustedIcon);
    expect(el.props.src).toBe(url);
  });

  it('falls back to default icon for untrusted URLs', async () => {
    delete process.env.NEXT_PUBLIC_TRUSTED_ICON_HOSTS;
    const { resolveIconElement, FaMoneyCheckAlt } = await loadModule();
    const url = 'https://cdn.example.com/custom.png';
    const el = resolveIconElement({ icon: url, name: 'Custom' });
    expect(el.type.name).toBe(FaMoneyCheckAlt.name);
  });

  it('falls back to default icon when icon is not a string', async () => {
    const { resolveIconElement, FaMoneyCheckAlt } = await loadModule();
    const el = resolveIconElement({ icon: { url: 'icon.png' }, name: 'Custom' });
    expect(el.type.name).toBe(FaMoneyCheckAlt.name);
  });

  it('honors NEXT_PUBLIC_TRUSTED_ICON_HOSTS', async () => {
    process.env.NEXT_PUBLIC_TRUSTED_ICON_HOSTS = 'example.com,assets.example.org';
    const { resolveIconElement, TrustedIcon, FaMoneyCheckAlt } = await loadModule();
    const allowedUrl = 'https://assets.example.org/icon.png';
    const blockedUrl = 'https://not-trusted.com/icon.png';
    const allowedEl = resolveIconElement({ icon: allowedUrl, name: 'Allowed' });
    const blockedEl = resolveIconElement({ icon: blockedUrl, name: 'Blocked' });
    expect(allowedEl.type).toBe(TrustedIcon);
    expect(blockedEl.type.name).toBe(FaMoneyCheckAlt.name);
  });
});

