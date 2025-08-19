# Admin Third Party Integrations

SkillBridge lets administrators manage API keys and settings for various third-party services. These include the ChatGPT and Hugging Face AI providers used on the community "Ask" page.

> **Note:** Google reCAPTCHA configuration is no longer managed here. Administrators can configure reCAPTCHA under the **Social Login** settings page.

## Backend

- **Settings storage:** `backend/src/modules/thirdPartyConfig`
- **API endpoints:** `/api/third-party-config` for get and update
- **AI endpoint:** `/api/ai-assistance` implemented in `backend/src/modules/ai`
- AI service reads provider config from the settings record before sending requests.

## Frontend

- Admin page: `frontend/src/pages/dashboard/admin/settings/thirdParty`
- Integration modals under `frontend/src/components/admin/integrations` allow entering API keys for ChatGPT and Hugging Face.
- Saved settings are fetched through `frontend/src/services/admin/thirdPartyService.js`.
- Community question page `frontend/src/pages/community/ask.js` calls `fetchThirdPartyConfig` to list available AI providers for users.
- When no provider has an API key configured the page shows "No AI integrations available".

After storing keys on the admin page, users can select ChatGPT or Hugging Face from a dropdown on the AI Assistance tab and submit questions powered by the chosen model.

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

### Hugging Face Configuration

1. Generate an access token in your Hugging Face account: <https://huggingface.co/settings/tokens>.
   A fine‑grained token with the `inference:serverless` permission is sufficient.
2. In the admin dashboard open **Settings → Third Party** and launch the **Hugging Face** modal.
3. Paste the token into the **Access Token** field and specify the desired model
   endpoint (e.g. `gpt2` or `google/flan-t5-base`).
4. Click **Save** to store the settings.
5. Users can now choose `huggingface` as the provider when asking AI questions.

### DeepSeek Configuration

1. Generate an API key in your DeepSeek account.
2. In the admin dashboard open **Settings → Third Party** and select **DeepSeek**.
3. Provide the API key and the desired model name (e.g. `deepseek-chat`) and optional max tokens such as `1024`.
4. Save the settings to enable DeepSeek. Other providers can be deactivated by toggling them off.
