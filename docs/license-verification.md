# License Verification with CodeCanyon/Envato

This guide explains how to validate purchases of your CodeCanyon product to ensure only legitimate customers can activate and continue using your application.

## Prerequisites
- **Envato personal token** with permission to view sales (stored in `ENVATO_TOKEN`).
- **Backend endpoint** capable of making HTTPS requests.
- **Database table** for tracking `purchase_code`, `domain`, `email`, `ip`, `status`, `activated_at`, `last_check`, and `logs`.

## Activation Workflow
1. **Customer buys the item** on CodeCanyon and receives a unique purchase code.
2. **Client submits activation request** with purchase code, installation domain, email and IP to your server (e.g. `POST /api/license/activate`).
3. **Server verifies with Envato** by calling:
   ```http
   GET https://api.envato.com/v3/market/author/sale?code=<purchase_code>
   Authorization: Bearer <ENVATO_TOKEN>
   ```
4. **Persist license record** if Envato confirms the sale; otherwise return an error to the client.
5. **Respond to client** with activation status.

## Subsequent Validation
- Compare the stored domain against the current domain on each run or scheduled job.
- Update `last_check` timestamps and count any unauthorized instances.
- Allow administrators to deactivate licenses or inspect activation logs.

## Security & Logging Tips
- Keep `ENVATO_TOKEN` on the server; never expose it client-side.
- Sanitize and validate all user input before contacting Envato.
- Rate-limit activation attempts and hash sensitive data where possible.
- Log activations, validations and domain mismatches for audit trails.

## Testing Recommendations
- Unit test the activation and validation services with mocked Envato responses.
- Integration tests should cover valid activations, invalid codes, domain mismatches and API failures.

Implementing this flow helps protect your product from unauthorized use while giving you tools to audit legitimate installations.
