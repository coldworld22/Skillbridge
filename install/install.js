const authSection = document.getElementById('step2');
const authForm = document.getElementById('authForm');
const authHint = document.getElementById('authHint');
const authOutput = document.getElementById('authOutput');
const prereqSection = document.getElementById('step1');
const prereqOutput = document.getElementById('prereqOutput');
const checkBtn = document.getElementById('checkBtn');
const prereqList = document.getElementById('prereqList');
const installSection = document.getElementById('step3');
const configForm = document.getElementById('configForm');
const installOutput = document.getElementById('installOutput');
const modeSelect = document.getElementById('installMode');
const domainField = document.getElementById('domainField');
const progressSteps = document.querySelectorAll('[data-progress-step]');

let purchaseCode = '';
const purchaseCodeField =
  authForm?.querySelector('input[name="purchaseCode"]')?.closest('label') || null;
const purchaseCodeInput =
  authForm?.querySelector('input[name="purchaseCode"]') || null;
const installerState = {
  authRequired: false,
  purchaseCodeRequired: true,
};
let prereqsPassed = false;
let installerUnlocked = false;
const toggleSection = (section, show) => {
  if (!section) return;
  section.classList[show ? 'remove' : 'add']('hidden');
};

const setFormDisabled = (form, disabled) => {
  if (!form) return;
  const elements = form.querySelectorAll('input, button, select, textarea');
  elements.forEach((element) => {
    // Keep hidden inputs enabled so their values can still be read if needed.
    if (element.type === 'hidden') return;
    // eslint-disable-next-line no-param-reassign
    element.disabled = disabled;
  });
};

const resetAuthOutput = () => {
  if (!authOutput) return;
  authOutput.classList.add('hidden');
  authOutput.textContent = '';
};

const updateFlowState = () => {
  toggleSection(prereqSection, true);
  const canShowAuth = prereqsPassed;
  toggleSection(authSection, canShowAuth);
  if (!canShowAuth) {
    resetAuthOutput();
  }
  const canShowInstall = prereqsPassed && installerUnlocked;
  toggleSection(installSection, canShowInstall);
  if (!prereqsPassed) {
    setProgressStep(1);
  } else if (!installerUnlocked) {
    setProgressStep(2);
  } else {
    setProgressStep(3);
  }
};

const setProgressStep = (step) => {
  progressSteps.forEach((node) => {
    const stepValue = Number(node.dataset.progressStep);
    const isActive = stepValue === step;
    const isCompleted = stepValue < step;
    node.classList.toggle('active', isActive);
    node.classList.toggle('completed', isCompleted);
  });
};

const unlockInstaller = (message) => {
  if (!prereqsPassed) {
    if (authOutput) {
      authOutput.classList.remove('hidden');
      authOutput.textContent = '❌ Complete the requirements check first.';
    }
    return;
  }
  installerUnlocked = true;
  updateFlowState();
  if (message && authOutput) {
    authOutput.classList.remove('hidden');
    authOutput.textContent = message;
  } else {
    resetAuthOutput();
  }
};

const buildHeaders = (withJson = false) => {
  const headers = new Headers();
  if (withJson) {
    headers.set('Content-Type', 'application/json');
  }
  if (purchaseCode) {
    headers.set('X-Install-Purchase-Code', purchaseCode);
    headers.set('X-Install-Setup-Secret', purchaseCode);
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

const renderPrereqResults = (data) => {
  if (!prereqList) {
    if (prereqOutput) {
      prereqOutput.textContent =
        data?.output ||
        (data?.ok
          ? 'All prerequisites met.'
          : 'Unable to render prerequisite details.');
    }
    return;
  }

  const results = Array.isArray(data?.results) ? data.results : [];

  if (!results.length) {
    prereqList.classList.add('hidden');
    prereqList.innerHTML = '';
    if (prereqOutput) {
      prereqOutput.textContent =
        data?.output ||
        (data?.ok
          ? 'All prerequisites met.'
          : 'Unable to retrieve prerequisite results.');
    }
    return;
  }

  prereqList.innerHTML = '';
  results.forEach((result) => {
    const li = document.createElement('li');
    const status = result.status === 'ok' ? 'ok' : 'fail';
    li.className = `prereq-item is-${status}`;

    const icon = document.createElement('span');
    icon.className = `prereq-icon is-${status}`;
    icon.textContent = status === 'ok' ? '☑' : '☐';

    const content = document.createElement('div');
    content.className = 'prereq-content';

    const label = document.createElement('span');
    label.className = 'prereq-label';
    label.textContent = result.label || 'Requirement';

    content.appendChild(label);

    if (result.detail) {
      const detail = document.createElement('span');
      detail.className = 'prereq-detail';
      detail.textContent = result.detail;
      content.appendChild(detail);
    }

    li.appendChild(icon);
    li.appendChild(content);
    prereqList.appendChild(li);
  });

  prereqList.classList.remove('hidden');

  if (prereqOutput) {
    if (data?.ok) {
      prereqOutput.textContent = 'All prerequisites met.';
    } else if (Array.isArray(data?.logs) && data.logs.length) {
      prereqOutput.textContent = data.logs.join('\n');
    } else {
      prereqOutput.textContent =
        'Resolve the unchecked items above, then re-run the check.';
    }
  }
};

const applyInstallerConfig = () => {
  if (!authForm) return;
  const submitBtn = authForm.querySelector('button[type="submit"]');
  const requirePurchaseCode = Boolean(installerState.purchaseCodeRequired);

  if (purchaseCodeField) {
    purchaseCodeField.classList.toggle('hidden', !requirePurchaseCode);
  }
  if (purchaseCodeInput) {
    purchaseCodeInput.required = requirePurchaseCode;
  }

  if (installerState.authRequired) {
    setFormDisabled(authForm, true);
    if (authHint) {
      authHint.textContent =
        'Server policy currently requires an authenticated admin session before installation can continue.';
    }
    if (authOutput) {
      authOutput.classList.remove('hidden');
      authOutput.textContent =
        '❌ INSTALL_REQUIRE_AUTH is enabled on this server. Disable it (or run the API manually) to continue through the browser wizard.';
    }
    if (submitBtn) submitBtn.textContent = 'Locked by Server';
  } else {
    setFormDisabled(authForm, false);
    if (authHint) {
      authHint.textContent = requirePurchaseCode
        ? 'Enter the purchase code provided with your license to continue.'
        : 'Installer authentication is disabled in this environment. Continue when ready.';
    }
    if (submitBtn) {
      submitBtn.textContent = requirePurchaseCode ? 'Save Code & Continue' : 'Continue';
    }
    if (!installerUnlocked) {
      resetAuthOutput();
    }
  }

  updateFlowState();
};

const loadInstallerConfig = async () => {
  if (!authForm) return;
  try {
    const res = await fetch('/api/install/config', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`status ${res.status}`);
    }
    const data = await res.json();
    if ('authRequired' in data) {
      installerState.authRequired = Boolean(data.authRequired);
    }
    if ('purchaseCodeRequired' in data) {
      installerState.purchaseCodeRequired = Boolean(data.purchaseCodeRequired);
    } else if ('secretRequired' in data) {
      installerState.purchaseCodeRequired = Boolean(data.secretRequired);
    }
  } catch (error) {
    if (authOutput) {
      authOutput.classList.remove('hidden');
      authOutput.textContent = `⚠️ Failed to load installer configuration: ${error.message}`;
    }
  }
  applyInstallerConfig();
  checkPrereqs({ initiatedByUser: false });
};

const handleAuth = (event) => {
  event?.preventDefault?.();
  const formData = new FormData(authForm);
  purchaseCode = (formData.get('purchaseCode') || '').trim();

  if (installerState.authRequired) {
    if (authOutput) {
      authOutput.classList.remove('hidden');
      authOutput.textContent =
        '❌ Installer locked by server policy. Disable INSTALL_REQUIRE_AUTH to continue.';
    }
    return;
  }

  if (!prereqsPassed) {
    if (authOutput) {
      authOutput.classList.remove('hidden');
      authOutput.textContent = '❌ Complete the requirements check first.';
    }
    return;
  }

  if (installerState.purchaseCodeRequired && !purchaseCode) {
    if (authOutput) {
      authOutput.classList.remove('hidden');
      authOutput.textContent = '❌ Purchase code is required.';
    }
    return;
  }

  unlockInstaller(
    installerState.purchaseCodeRequired
      ? '✅ Purchase code saved. Continue to Step 3 to finish the install.'
      : '✅ Installer unlocked. Continue to Step 3 to finish the install.',
  );
};

const checkPrereqs = async ({ initiatedByUser = true } = {}) => {
  prereqOutput.textContent = initiatedByUser
    ? 'Checking...'
    : 'Running automatic checks...';
  if (prereqList) {
    prereqList.classList.add('hidden');
    prereqList.innerHTML = '';
  }
  prereqsPassed = false;
  updateFlowState();
  try {
    const res = await fetch('/api/install/prereqs', {
      headers: buildHeaders(),
    });
    const data = await parseResponse(res);
    renderPrereqResults(data);
    if (!data.ok) {
      prereqsPassed = false;
      updateFlowState();
      return;
    }
    prereqsPassed = true;
    updateFlowState();
  } catch (error) {
    prereqOutput.textContent = `❌ ${error.message}`;
    prereqsPassed = false;
    updateFlowState();
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
  setProgressStep(3);

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
checkBtn.addEventListener('click', () => checkPrereqs({ initiatedByUser: true }));
configForm.addEventListener('submit', runInstaller);

modeSelect.addEventListener('change', () => {
  const isProduction = modeSelect.value === 'production';
  domainField.classList[isProduction ? 'remove' : 'add']('hidden');
});

modeSelect.dispatchEvent(new Event('change'));
loadInstallerConfig();
setProgressStep(1);
