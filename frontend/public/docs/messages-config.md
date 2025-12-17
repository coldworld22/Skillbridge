# Messaging Providers Configuration

SkillBridge lets administrators manage SMS gateway settings from the dashboard.
Only one gateway provider can be **Active** and **Default** at a time so
outgoing messages don't conflict.

## Backend

- Settings are stored with the key `messages_settings` in the `settings` table.
- API routes under `/api/messages/config` read and update the configuration.
- When sending phone OTPs the service in `backend/src/services/smsService.js`
  checks the active provider and sends SMS via Infobip if configured.

## Frontend

- Admin page: `frontend/src/pages/dashboard/admin/settings/messages-config`.
- Providers are listed in the UI. Toggle **Active** to enable one gateway and
  select **Default** for the provider used for most messages.
- The Infobip form asks for **API Key**, **Sender ID** and **Base URL / Region**.
  Enter your API key *without* the `App` prefix; the app will add it
  automatically.
- The verification dialogs display a "Default OTP: `123456`" hint so users can
  proceed even if SMS delivery fails during testing.

Once saved, SMS OTPs will be delivered through the active provider.

