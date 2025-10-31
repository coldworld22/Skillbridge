const authForm = document.getElementById('authForm');
const authOutput = document.getElementById('authOutput');
const prereqSection = document.getElementById('step1');
const prereqOutput = document.getElementById('prereqOutput');
const checkBtn = document.getElementById('checkBtn');
const installSection = document.getElementById('step2');
const configForm = document.getElementById('configForm');
const installOutput = document.getElementById('installOutput');
const modeSelect = document.getElementById('installMode');
const domainField = document.getElementById('domainField');

let authToken = null;
let setupSecret = '';

const toggleSection = (section, show) => {
  section.classList[show ? 'remove' : 'add']('hidden');
};

const buildHeaders = (withJson = false) => {
  const headers = new Headers();
  if (withJson) {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  if (setupSecret) {
    headers.set('X-Install-Setup-Secret', setupSecret);
  }
  return headers;
};

const parseResponse = async (res) => {
  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    data = null;
  }
  if (!res.ok) {
    const message =
      data?.output ||
      data?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return data;
};

const handleAuth = async (event) => {
  event.preventDefault();
  const formData = new FormData(authForm);
  const email = formData.get('email');
  const password = formData.get('password');
  setupSecret = (formData.get('setupSecret') || '').trim();

  authOutput.classList.remove('hidden');
  authOutput.textContent = 'Signing in...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseResponse(res);
    if (!data?.accessToken) {
      throw new Error('Login succeeded but no access token was returned.');
    }
    authToken = data.accessToken;
    authOutput.textContent = '✅ Authentication successful.';
    toggleSection(prereqSection, true);
    toggleSection(installSection, false);
    prereqOutput.textContent = 'Click "Run Check" to verify prerequisites.';
  } catch (error) {
    authOutput.textContent = `❌ ${error.message}`;
    toggleSection(prereqSection, false);
    toggleSection(installSection, false);
    authToken = null;
  }
};

const checkPrereqs = async () => {
  prereqOutput.textContent = 'Checking...';
  try {
    const res = await fetch('/api/install/prereqs', {
      headers: buildHeaders(),
    });
    const data = await parseResponse(res);
    prereqOutput.textContent = data.output || JSON.stringify(data, null, 2);
    toggleSection(installSection, Boolean(data.ok));
    if (!data.ok) {
      installOutput.textContent =
        'Fix the issues above, then re-run the check.';
    } else {
      installOutput.textContent = '';
    }
  } catch (error) {
    prereqOutput.textContent = `❌ ${error.message}`;
    toggleSection(installSection, false);
  }
};

const runInstaller = async (event) => {
  event.preventDefault();
  const submitBtn = configForm.querySelector('button[type="submit"]');
  const formData = new FormData(configForm);
  const mode = formData.get('mode') || 'development';
  const domainValue = (formData.get('domain') || '').trim();

  installOutput.textContent = 'Running install script...';
  submitBtn.disabled = true;

  const payload = { mode };
  if (mode === 'production' && domainValue) {
    payload.domain = domainValue;
  }

  try {
    const res = await fetch('/api/install/run', {
      method: 'POST',
      headers: buildHeaders(true),
      body: JSON.stringify(payload),
    });
    const data = await parseResponse(res);
    installOutput.textContent = data.output || JSON.stringify(data, null, 2);
  } catch (error) {
    installOutput.textContent = `❌ ${error.message}`;
  } finally {
    submitBtn.disabled = false;
  }
};

authForm.addEventListener('submit', handleAuth);
checkBtn.addEventListener('click', checkPrereqs);
configForm.addEventListener('submit', runInstaller);

modeSelect.addEventListener('change', () => {
  const isProduction = modeSelect.value === 'production';
  domainField.classList[isProduction ? 'remove' : 'add']('hidden');
});

modeSelect.dispatchEvent(new Event('change'));
