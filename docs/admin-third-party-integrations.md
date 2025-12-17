# Admin Third Party Integrations

SkillBridge lets administrators manage API keys and settings for various third-party services. These include the ChatGPT, DeepSeek, and Gemini AI providers used on the community "Ask" page.

> **Note:** Google reCAPTCHA configuration is no longer managed here. Administrators can configure reCAPTCHA under the **Social Login** settings page.

## Backend

- **Settings storage:** `backend/src/modules/thirdPartyConfig`
- **API endpoints:** `/api/third-party-config` for get and update
- **AI endpoint:** `/api/ai-assistance` implemented in `backend/src/modules/ai`
- AI service reads provider config from the settings record before sending requests.

## Frontend

- Admin page: `frontend/src/pages/dashboard/admin/settings/thirdParty`
- Integration modals under `frontend/src/components/admin/integrations` allow entering API keys for AI providers plus Google Analytics, Google Ads, and Google AdSense settings.
- Saved settings are fetched through `frontend/src/services/admin/thirdPartyService.js`.
- Community question page `frontend/src/pages/community/ask.js` calls `fetchThirdPartyConfig` to list available AI providers for users.
- When no provider has an API key configured the page shows "No AI integrations available".
- Set the primary AI integration via the **Default AI Provider** selector at the top of the admin page. The homepage chatbot and featured AI sections fall back to this option when multiple providers are active.

After storing keys on the admin page, users can select any enabled AI provider (ChatGPT, DeepSeek, or Gemini) from a dropdown on the AI Assistance tab and submit questions powered by the chosen model.

### ChatGPT Configuration

1. Sign in to your OpenAI account and create an API key.
2. In the admin dashboard navigate to **Settings → Third Party** and open the
   **ChatGPT** modal.
3. Paste the key into the **API Key** field. You can configure multiple models
   by listing their names and default temperatures.
4. Click **Add model** in the modal to create additional model rows (e.g.
   `gpt-4`, `gpt-3.5-turbo`). Each question on the Ask page can then choose one
   of the configured models.
5. Click **Save** to persist the settings. The backend will use the selected
   model when calling the OpenAI Chat Completion API.

### DeepSeek Configuration

1. Generate an API key in your DeepSeek account.
2. In the admin dashboard open **Settings → Third Party** and select **DeepSeek**.
3. Provide the API key and the desired model name (e.g. `deepseek-chat`) and optional max tokens such as `1024`.
4. Save the settings to enable DeepSeek. Other providers can be deactivated by toggling them off.

### Gemini Configuration

1. Set up access to the Gemini API in your Google Cloud project and create an API key with the **Generative Language API** enabled.
2. In the admin dashboard open **Settings → Third Party** and choose **Gemini**.
3. Paste the API key and specify the preferred Gemini model (for example `gemini-1.5-pro-latest`), plus any optional configuration such as temperature limits.
4. Click **Save** to activate Gemini as an AI provider. Users can select it from the AI Assistance dropdown once enabled.

### Google Ads Conversion Tracking

1. In Google Ads, create conversion actions for the events you want to capture (e.g. lead, purchase, subscription) and note the global **Conversion ID** (format `AW-XXXXXXXXX`) plus each action’s `send_to` identifier.
2. In the admin dashboard open **Settings → Third Party** and select **Google Ads**.
3. Enter the conversion ID, optional remarketing and enhanced conversion preferences, then add conversion rows that map a platform event key (for example `signup` or `purchase`) to its Google Ads `send_to` value. You can optionally provide a default value and currency for each event.
4. Click **Save**. The frontend will automatically load the Google Ads tag when a conversion ID is present. It emits the following event keys out of the box:
   - `signup` when a visitor creates an account.
   - `purchase` after a successful payment (includes amount, currency, transaction id).
   - `subscription` in addition to `purchase` for plan activations.
   - `class_enrollment`, `tutorial_enrollment`, and `book_purchase` for the respective item types.
5. To track additional actions, add rows in the modal and trigger `recordGoogleAdsConversion('<eventKey>', params)` from the relevant component.
