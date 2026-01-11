# Tenant onboarding, trials, and support playbooks

Use this guide when onboarding a new tenant or handling trial-to-upgrade support requests. It complements the deployment and social login guides with a checklist that covers environment validation, plan setup, domain verification, and escalation steps.

## Tenant onboarding checklist

1. **Confirm the deployment is healthy.**
   - Verify the backend health endpoint returns `{"status":"ok"}`.
   - Log in to `/dashboard/admin` and confirm the dashboard loads without console errors.
   - Review `docker compose logs backend` and `docker compose logs nginx` for startup warnings.

2. **Capture tenant profile details.**
   - Organization name and primary contact.
   - Primary domain and any alternate domains (for `www` or region-specific routing).
   - Target roles (student, instructor, or both) to align plan catalog entries.
   - Support escalation contacts (email + Slack channel) for urgent production issues.

3. **Configure branding and email.**
   - Update the app name, logo, and support email under `/dashboard/admin/settings/app`.
   - Configure SMTP credentials or enable `DISABLE_EMAILS=true` for staging.
   - Run a password reset email to confirm outbound delivery is working.

4. **Review subscription plans and feature flags.**
   - Confirm the plan catalog reflects the tenant’s role mix and entitlements.
   - Ensure any required plan features are enabled (ads, communities, groups, tutorials).
   - Document any custom quotas so support can validate overage reports later.

5. **Validate tenant access.**
   - Create the initial admin account and verify it can access admin tools.
   - Enroll a test student and instructor to confirm role-based dashboards load.
   - Walk through the tenant’s primary workflow (class booking, enrollment, or content creation).

## Trial and upgrade flows

### Trial setup options

- **Coupon-based trials (recommended for short timeboxes).**
  - Create a coupon with `starts_at`/`expires_at` and 100% discount.
  - Scope it to a plan using `applies_to` and `applies_to_id`.
  - Share the coupon with the tenant along with the trial expiration date.

- **Trial plan variants (for longer pilots).**
  - Duplicate the standard plan in the admin catalog and set a promotional price.
  - Reduce plan quotas (classes, tutorials, ad credits) if you want a limited pilot.
  - Document the plan ID so support can upgrade the tenant later.

### Upgrade flow checklist

1. Confirm the tenant’s desired plan, billing interval, and start date.
2. Ensure payment or invoicing is recorded before switching plans.
3. Update the tenant subscription to the new plan (plan catalog + billing interval).
4. Send a confirmation email that includes the new feature entitlements and renewal date.
5. Schedule a post-upgrade check-in within 5 business days.

## Domain setup steps

1. **Point DNS to the deployment host.**
   - Add `A`/`AAAA` records for the root domain.
   - Add a `CNAME` for `www` pointing to the root domain (if used).

2. **Run the installation script.**
   - Execute `./install.sh production <your-domain>` to configure Nginx and TLS.
   - Confirm the domain is applied to `nginx/conf.d` and SSL paths.

3. **Set environment variables.**
   - `APP_DOMAIN` and `FRONTEND_URL` should match the public domain.
   - `NEXT_PUBLIC_API_BASE_URL` must include the `/api` suffix.
   - Configure `COOKIE_DOMAIN` when frontend and backend are on different subdomains.

4. **Validate HTTPS and redirects.**
   - Confirm `https://<domain>` loads without certificate warnings.
   - Verify `/api/health` returns status OK over HTTPS.

## Domain verification troubleshooting

Use this section when TLS issuance or domain validation fails.

- **DNS not propagating**
  - Run `dig <domain> +short` and confirm it matches the server IP.
  - Allow 15–60 minutes for DNS propagation after updates.

- **Let’s Encrypt validation errors**
  - Ensure ports 80 and 443 are open and reachable.
  - Check for `CAA` records that might block Let’s Encrypt.
  - Confirm the Nginx `/.well-known/acme-challenge` path is not blocked.

- **Mismatched certificates**
  - Run `openssl s_client -connect <domain>:443 -servername <domain>` and verify the certificate CN/SAN.
  - If the cert is wrong, re-run `./install.sh production <domain>` or renew certificates.

- **Frontend loads but API fails**
  - Confirm `NEXT_PUBLIC_API_BASE_URL` points to the deployed backend.
  - Validate the Nginx `/api` proxy path matches the backend container.

## OAuth constraints and expectations

When enabling OAuth providers, share these constraints with tenants:

- **Redirect URIs must match exactly.** Providers reject wildcards and path mismatches.
- **HTTPS is required in production.** Only `localhost` can use HTTP.
- **Separate environments need separate apps.** Staging and production URLs should not share the same OAuth app if the provider blocks multiple callback domains.
- **Backend domain is the redirect target.** SkillBridge uses backend `/api/auth/<provider>/callback` URLs for all providers.
- **Frontend origin matters.** If the backend `FRONTEND_URL` is wrong, users can land on 404 pages after OAuth completes.

If the tenant needs a different redirect URI than what the admin dashboard generates, update the provider’s redirect URL field in **Social Login Settings** and restart the backend so the new value is loaded.

## Support escalation playbooks

### OAuth sign-in failures

**Symptoms**: redirect URI mismatch, provider errors, or 404 on callback.

1. Confirm the callback URL in the provider console matches `/api/auth/<provider>/callback`.
2. Verify `FRONTEND_URL` and `NEXT_PUBLIC_API_BASE_URL` for the tenant’s domain.
3. Check backend logs for OAuth strategy errors (`backend` container logs).
4. If unresolved, escalate to engineering with:
   - Tenant domain and environment.
   - Provider name + client ID (redact secrets).
   - Full error message and timestamp.

### Domain and TLS failures

**Symptoms**: certificate warnings, `NET::ERR_CERT`, or `ERR_SSL_PROTOCOL_ERROR`.

1. Validate DNS records and propagation.
2. Confirm ports 80/443 are open from the public internet.
3. Check `nginx` logs for ACME challenge failures.
4. Escalate with:
   - Domain, IP, DNS provider.
   - Certificate issuer error output.
   - `nginx -T` and recent `nginx` logs.

### Trial or upgrade disputes

**Symptoms**: billing confusion, plan mismatch, missing entitlements.

1. Confirm the plan ID, billing interval, and effective date.
2. Validate coupon or trial plan expiration dates.
3. Check plan feature toggles to ensure entitlements are enabled.
4. Escalate with:
   - Tenant org name, account email, plan IDs.
   - Screenshots of the checkout or dashboard.
   - Any payment processor transaction references.

### Tenant onboarding blockers

**Symptoms**: admin access issues, missing roles, broken workflows.

1. Verify the admin account exists and has the correct role.
2. Re-run the onboarding checklist to confirm configuration steps.
3. Validate environment variables and frontend build configuration.
4. Escalate with:
   - Tenant domain and user email.
   - Steps to reproduce the issue.
   - Console logs and backend error output.
