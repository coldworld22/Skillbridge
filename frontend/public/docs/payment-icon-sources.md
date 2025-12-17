# Payment Icon Sources

SkillBridge displays icons for payment methods during checkout. To avoid loading images from untrusted locations, icons are only loaded from approved hosts or from assets bundled with the application.

## Supported schemes

Only `http` and `https` schemes are supported for payment method icons. Icons using other schemes (e.g. `javascript:` or `data:`) are rejected.

## Trusted domains

Payment method icons may be served from the following domains:

- `yourdomain.com`
- `cdn.yourdomain.com`

These domains are defined in `TRUSTED_ICON_HOSTS` within `frontend/src/pages/payments/checkout.js` and can be overridden with the `NEXT_PUBLIC_TRUSTED_ICON_HOSTS` variable.

Relative paths (e.g. `/images/payments/stripe.png`) are also permitted and should be placed under `frontend/public/images`.

## Fallback behaviour

If an icon is missing, uses an unapproved domain, or fails to load, the checkout page falls back to a generic money icon so the interface remains functional.
