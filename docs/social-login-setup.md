# Social Login Setup

This guide explains how to configure OAuth providers like Google so users can sign in to SkillBridge using their existing accounts.

## Google

1. Open the **Google Cloud Console** and create OAuth 2.0 credentials.
2. Add the following URI to the **Authorized redirect URIs** list:

   ```
   http://localhost:5000/api/auth/google/callback
   ```

   Replace `http://localhost:5000` with your production backend URL when deploying. For example:

   ```
   https://yourdomain.com/api/auth/google/callback
   ```

3. Copy the generated **Client ID** and **Client secret** and set them in `backend/.env` or through the admin dashboard under **Social Login Settings**.
4. If the auto-generated redirect URL shown in the admin panel does not match the one configured in Google, enter the desired URL in the **Redirect URL** field for Google and save.
5. Restart the backend so the new credentials take effect.

If the redirect URI does not exactly match what is configured on Google, the login page will display **Error 400: redirect_uri_mismatch**.
