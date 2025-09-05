describe('resolveIconElement', () => {
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

  it('returns TrustedIcon for URLs from trusted hosts', async () => {
    const { resolveIconElement, TRUSTED_ICON_HOSTS, TrustedIcon } = await loadModule();
    const url = `https://${TRUSTED_ICON_HOSTS[0]}/custom.png`;
    const el = resolveIconElement({ icon: url, name: 'Custom' });
    expect(el.type).toBe(TrustedIcon);
    expect(el.props.src).toBe(url);
  });

  it('falls back to default icon for untrusted URLs', async () => {
    const { resolveIconElement, FaMoneyCheckAlt } = await loadModule();
    const url = 'https://cdn.example.com/custom.png';
    const el = resolveIconElement({ icon: url, name: 'Custom' });
    expect(el.type.name).toBe(FaMoneyCheckAlt.name);
  });

  it('honors NEXT_PUBLIC_TRUSTED_ICON_HOSTS', async () => {
    process.env.NEXT_PUBLIC_TRUSTED_ICON_HOSTS = 'example.com,assets.example.org';
    const { resolveIconElement, TrustedIcon, FaMoneyCheckAlt } = await loadModule();
    const allowedUrl = 'https://assets.example.org/icon.png';
    const blockedUrl = 'https://skillbridge.com/icon.png';
    const allowedEl = resolveIconElement({ icon: allowedUrl, name: 'Allowed' });
    const blockedEl = resolveIconElement({ icon: blockedUrl, name: 'Blocked' });
    expect(allowedEl.type).toBe(TrustedIcon);
    expect(blockedEl.type.name).toBe(FaMoneyCheckAlt.name);
  });
});

