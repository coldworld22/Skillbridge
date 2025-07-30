# Admin Third Party Integrations

SkillBridge lets administrators manage API keys and settings for various third-party services. These include multiple AI chat providers used on the community "Ask" page.

## Backend

- **Settings storage:** `backend/src/modules/thirdPartyConfig`
- **API endpoints:** `/api/third-party-config` for get and update
- **AI endpoint:** `/api/ai-assistance` implemented in `backend/src/modules/ai`
- AI service reads provider config from the settings record before sending requests.

## Frontend

- Admin page: `frontend/src/pages/dashboard/admin/settings/thirdParty`
- Integration modals under `frontend/src/components/admin/integrations` allow entering API keys for ChatGPT, DeepSeek, Claude, Gemini and Hugging Face.
- Saved settings are fetched through `frontend/src/services/admin/thirdPartyService.js`.
- Community question page `frontend/src/pages/community/ask.js` calls `fetchThirdPartyConfig` to list available AI providers for users.
- When no provider has an API key configured the page shows "No AI integrations available".

After storing keys on the admin page, users can select a provider from a dropdown on the AI Assistance tab and submit questions powered by the chosen model.

### ChatGPT Configuration

1. Sign in to your OpenAI account and create an API key.
2. In the admin dashboard navigate to **Settings → Third Party** and open the
   **ChatGPT** modal.
3. Paste the key into the **API Key** field and optionally adjust the model name
   (e.g. `gpt-4`) and temperature.
4. Click **Save** to persist the settings. The backend will use these values
   when calling the OpenAI Chat Completion API.
