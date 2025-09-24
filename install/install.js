const STEP_ORDER = ['prereq', 'config', 'install'];
const STEP_PROGRESS = {
  prereq: 10,
  config: 55,
  install: 90,
};

const FRIENDLY_LABELS = {
  node: 'Node.js',
  npm: 'npm',
  docker: 'Docker',
  docker_compose: 'Docker Compose',
  dockerCompose: 'Docker Compose',
  git: 'Git',
  postgres: 'PostgreSQL',
  redis: 'Redis',
  yarn: 'Yarn',
  pnpm: 'pnpm',
  python: 'Python',
};

const MAX_LOGO_FILE_BYTES = 2 * 1024 * 1024;

const INSTALLER_DISABLED_GUIDANCE =
  'The SkillBridge installer API is disabled. Enable it by setting INSTALL_API_ENABLED (and/or ENABLE_INSTALL) to a truthy value such as "true", "1", "yes", or "on", then try again.';

function sanitize(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\0/g, '').trim();
}

function parsePort(value) {
  const normalized = sanitize(value);
  if (!normalized) return NaN;
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed)) return NaN;
  return parsed;
}

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function isValidUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return Boolean(parsed.protocol) && Boolean(parsed.host);
  } catch (_err) {
    return false;
  }
}

function getCookie(name) {
  if (typeof document === 'undefined' || !name) return '';
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.split('=');
    if (!rawName) continue;
    if (decodeURIComponent(rawName) === name) {
      return decodeURIComponent(rawValue.join('=') || '');
    }
  }
  return '';
}

function formatKey(key) {
  if (!key) return 'Requirement';
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function normalizeRequirementList(raw) {
  if (!raw || typeof raw !== 'object') {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw
      .map((item, index) => {
        if (!item) return null;
        const id = item.id || item.key || `requirement-${index}`;
        const label = item.label || item.name || FRIENDLY_LABELS[id] || formatKey(id);
        const normalizedStatus = typeof item.status === 'string' ? item.status.toLowerCase() : '';
        const passed =
          typeof item.passed === 'boolean'
            ? item.passed
            : typeof item.ok === 'boolean'
              ? item.ok
              : typeof item.status === 'string'
                ? ['pass', 'ok', 'ready', 'success', 'true'].includes(item.status.toLowerCase())
                : Boolean(item.value);
        const status = normalizedStatus === 'warn' ? 'warn' : passed ? 'pass' : 'fail';
        const details = item.message || item.details || item.hint || '';
        return { id, label, passed, status, details };
      })
      .filter(Boolean);
  }

  const ignoreKeys = new Set(['ok', 'summary', 'message', 'output', 'requirements', 'allPassed']);
  return Object.entries(raw)
    .filter(([key, value]) => !ignoreKeys.has(key) && value !== undefined && value !== null)
    .map(([key, value]) => {
      const label = FRIENDLY_LABELS[key] || formatKey(key);
      let passed = false;
      let status = 'fail';
      let details = '';

      if (typeof value === 'boolean') {
        passed = value;
        status = value ? 'pass' : 'fail';
      } else if (typeof value === 'string') {
        const lowered = value.toLowerCase();
        passed = ['ok', 'pass', 'passed', 'ready', 'true', 'success'].includes(lowered);
        status = lowered === 'warn' ? 'warn' : passed ? 'pass' : 'fail';
        if (!passed && lowered.length && lowered !== 'fail') {
          details = value;
        }
      } else if (typeof value === 'object') {
        if (typeof value.ok === 'boolean') {
          passed = value.ok;
        } else if (typeof value.passed === 'boolean') {
          passed = value.passed;
        } else if (typeof value.status === 'string') {
          const lowered = value.status.toLowerCase();
          if (lowered === 'warn') {
            status = 'warn';
          }
          passed = ['ok', 'pass', 'passed', 'ready', 'true', 'success'].includes(lowered);
        }
        details = value.message || value.details || value.hint || '';
      }

      if (status !== 'warn') {
        status = passed ? 'pass' : 'fail';
      }

      return { id: key, label, passed, status, details };
    });
}

function normalizePrereqResponse(raw) {
  const normalized = {
    requirements: [],
    summary: '',
    allPassing: false,
    rawText: '',
  };

  if (raw == null) {
    normalized.summary = 'No prerequisite information was returned.';
    return normalized;
  }

  let payload = raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      normalized.summary = 'No prerequisite information was returned.';
      return normalized;
    }
    try {
      payload = JSON.parse(trimmed);
    } catch (_err) {
      normalized.summary = trimmed;
      normalized.rawText = trimmed;
      return normalized;
    }
  }

  if (typeof payload.output === 'string') {
    const nested = payload.output.trim();
    if (nested) {
      try {
        payload = { ...payload, ...JSON.parse(nested) };
      } catch (_err) {
        normalized.rawText = nested;
      }
    }
  }

  normalized.requirements = normalizeRequirementList(payload.requirements || payload);

  if (typeof payload.ok === 'boolean') {
    normalized.allPassing = payload.ok;
  } else if (typeof payload.allPassed === 'boolean') {
    normalized.allPassing = payload.allPassed;
  } else if (normalized.requirements.length) {
    normalized.allPassing = normalized.requirements.every((item) => item.passed || item.status === 'warn');
  }

  normalized.summary =
    typeof payload.summary === 'string' && payload.summary.trim()
      ? payload.summary.trim()
      : typeof payload.message === 'string' && payload.message.trim()
        ? payload.message.trim()
        : normalized.allPassing
          ? 'All prerequisites satisfied.'
          : normalized.requirements.length
            ? 'Some prerequisites need attention.'
            : normalized.rawText || 'No prerequisite information was returned.';

  return normalized;
}

document.addEventListener('DOMContentLoaded', () => {
  const progressBar = document.getElementById('progressBar');
  const errorBox = document.getElementById('errorBox');
  const stepSections = {
    prereq: document.getElementById('step-prereq'),
    config: document.getElementById('step-config'),
    install: document.getElementById('step-install'),
  };
  const stepperItems = Array.from(document.querySelectorAll('[data-stepper-item]'));
  const prereqStatus = document.getElementById('prereqStatus');
  const prereqSummary = document.getElementById('prereqSummary');
  const checkBtn = document.getElementById('checkBtn');
  const configForm = document.getElementById('installerConfigForm');
  const installBtn = document.getElementById('installerInstallBtn');
  const installOutput = document.getElementById('installOutput');
  const completionCard = document.getElementById('completionCard');
  const completionMessage = document.getElementById('completionMessage');
  const completionNextSteps = document.getElementById('completionNextSteps');
  const backToConfigBtn = document.getElementById('backToConfigBtn');
  const setupSecretInput = document.getElementById('setupSecretInput');
  const setupSecretError = document.getElementById('setupSecretError');
  const codecanyonStatus = configForm ? configForm.querySelector('[data-license-status]') : null;
  const codecanyonInput = configForm ? configForm.querySelector('input[name="codecanyonKey"]') : null;
  const SECRET_STORAGE_KEY = 'skillbridge-install-setup-secret';
  const secretState = { value: '' };
  const supportsSessionStorage = (() => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return false;
      }
      const testKey = '__skillbridge_install_secret__';
      window.sessionStorage.setItem(testKey, '1');
      window.sessionStorage.removeItem(testKey);
      return true;
    } catch (_err) {
      return false;
    }
  })();

  function persistSetupSecret(value) {
    if (!supportsSessionStorage) return;
    if (value) {
      window.sessionStorage.setItem(SECRET_STORAGE_KEY, value);
    } else {
      window.sessionStorage.removeItem(SECRET_STORAGE_KEY);
    }
  }

  function clearSetupSecretError() {
    if (!setupSecretInput || !setupSecretError) return;
    setupSecretInput.removeAttribute('aria-invalid');
    setupSecretInput.classList.remove('border-red-400', 'focus:border-red-500', 'focus:ring-red-200');
    setupSecretError.textContent = '';
    setupSecretError.classList.add('hidden');
  }

  function showSetupSecretError(message) {
    if (!setupSecretInput || !setupSecretError) return;
    setupSecretInput.setAttribute('aria-invalid', 'true');
    setupSecretInput.classList.add('border-red-400', 'focus:border-red-500', 'focus:ring-red-200');
    setupSecretError.textContent = message;
    setupSecretError.classList.remove('hidden');
  }

  function applySetupSecret(value, { updateInput = true, persist = true } = {}) {
    const sanitized = sanitize(value);
    secretState.value = sanitized;
    if (updateInput && setupSecretInput) {
      setupSecretInput.value = sanitized;
    }
    if (persist) {
      persistSetupSecret(sanitized);
    }
    if (!sanitized) {
      clearSetupSecretError();
    }
    return sanitized;
  }

  function getSetupSecret() {
    return secretState.value || '';
  }

  function extractSetupSecretFromUrl() {
    if (typeof window === 'undefined') return '';
    try {
      const url = new URL(window.location.href);
      let extracted = '';
      let modified = false;
      ['setupSecret', 'setup_secret'].forEach((param) => {
        if (!url.searchParams.has(param)) return;
        if (!extracted) {
          extracted = sanitize(url.searchParams.get(param));
        }
        url.searchParams.delete(param);
        modified = true;
      });
      if (modified) {
        const newSearch = url.searchParams.toString();
        const newUrl = `${url.pathname}${newSearch ? `?${newSearch}` : ''}${url.hash}`;
        window.history.replaceState({}, document.title, newUrl);
      }
      return extracted;
    } catch (_err) {
      return '';
    }
  }

  const storedSecret = supportsSessionStorage
    ? sanitize(window.sessionStorage.getItem(SECRET_STORAGE_KEY) || '')
    : '';
  const urlSecret = extractSetupSecretFromUrl();
  applySetupSecret(urlSecret || storedSecret, { updateInput: true, persist: true });

  if (setupSecretInput) {
    setupSecretInput.addEventListener('input', (event) => {
      const sanitized = sanitize(event.target.value);
      secretState.value = sanitized;
      persistSetupSecret(sanitized);
      if (!sanitized) {
        clearSetupSecretError();
      }
    });
    setupSecretInput.addEventListener('blur', () => {
      applySetupSecret(setupSecretInput.value, { updateInput: true, persist: true });
    });
  }

  const fieldErrors = new Map();
  const codecanyonVerification = { key: '', status: 'idle', message: '' };

  if (codecanyonInput) {
    codecanyonInput.addEventListener('input', () => {
      const sanitized = sanitize(codecanyonInput.value);
      if (!sanitized) {
        clearCodecanyonStatus({ resetKey: true });
        clearFieldError('codecanyonKey');
        return;
      }
      if (codecanyonVerification.status === 'success' && codecanyonVerification.key !== sanitized) {
        clearCodecanyonStatus();
      }
    });

    codecanyonInput.addEventListener('blur', async () => {
      const sanitized = sanitize(codecanyonInput.value);
      if (!sanitized) {
        clearCodecanyonStatus({ resetKey: true });
        clearFieldError('codecanyonKey');
        return;
      }
      const result = await verifyCodecanyonLicense(sanitized);
      if (!result.ok) {
        setFieldError('codecanyonKey', result.message);
      }
    });
  }
  let submittedConfig = null;
  const licenseVerificationCache = { code: '', result: null };

  function getFieldErrorElement(name) {
    if (fieldErrors.has(name)) {
      return fieldErrors.get(name);
    }
    const el = configForm ? configForm.querySelector(`[data-field-error="${name}"]`) : null;
    fieldErrors.set(name, el || null);
    return el || null;
  }

  function getFieldSuccessElement(name) {
    if (fieldSuccesses.has(name)) {
      return fieldSuccesses.get(name);
    }
    const el = configForm ? configForm.querySelector(`[data-field-success="${name}"]`) : null;
    fieldSuccesses.set(name, el || null);
    return el || null;
  }

  function setProgress(percent) {
    if (!progressBar) return;
    const clamped = Math.max(0, Math.min(100, Number(percent) || 0));
    progressBar.style.width = `${clamped}%`;
    progressBar.setAttribute('aria-valuenow', String(clamped));
  }

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }

  function clearError() {
    if (!errorBox) return;
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  }

  function updateStep(step, { preserveProgress = false } = {}) {
    if (!STEP_ORDER.includes(step)) return;
    const targetIndex = STEP_ORDER.indexOf(step);

    STEP_ORDER.forEach((key, index) => {
      const section = stepSections[key];
      if (!section) return;
      section.classList.remove('step-visible', 'step-hidden-left', 'step-hidden-right');
      if (index === targetIndex) {
        section.classList.add('step-visible');
        section.setAttribute('aria-hidden', 'false');
      } else if (index < targetIndex) {
        section.classList.add('step-hidden-left');
        section.setAttribute('aria-hidden', 'true');
      } else {
        section.classList.add('step-hidden-right');
        section.setAttribute('aria-hidden', 'true');
      }
    });

    stepperItems.forEach((item) => {
      const itemStep = item.dataset.stepperItem;
      const itemIndex = STEP_ORDER.indexOf(itemStep);
      if (itemIndex === -1) return;
      item.classList.remove('stepper-active', 'stepper-complete', 'stepper-upcoming');
      if (itemIndex === targetIndex) {
        item.classList.add('stepper-active');
        item.setAttribute('aria-current', 'step');
      } else if (itemIndex < targetIndex) {
        item.classList.add('stepper-complete');
        item.removeAttribute('aria-current');
      } else {
        item.classList.add('stepper-upcoming');
        item.removeAttribute('aria-current');
      }
    });

    if (!preserveProgress && Object.prototype.hasOwnProperty.call(STEP_PROGRESS, step)) {
      setProgress(STEP_PROGRESS[step]);
    }
  }

  function renderRequirements(requirements, rawText = '') {
    if (!prereqStatus) return;
    prereqStatus.innerHTML = '';

    if (!requirements.length) {
      if (rawText) {
        const pre = document.createElement('pre');
        pre.className = 'whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700';
        pre.textContent = rawText;
        prereqStatus.appendChild(pre);
      }
      return;
    }

    requirements.forEach((req) => {
      const status = req.status || (req.passed ? 'pass' : 'fail');
      const statusStyles = {
        pass: {
          wrapper: 'border-green-200 bg-green-50 text-green-800',
          icon: 'text-green-600',
          symbol: '✓',
        },
        warn: {
          wrapper: 'border-amber-200 bg-amber-50 text-amber-800',
          icon: 'text-amber-500',
          symbol: '⚠',
        },
        fail: {
          wrapper: 'border-red-200 bg-red-50 text-red-700',
          icon: 'text-red-600',
          symbol: '!',
        },
      };
      const style = statusStyles[status] || statusStyles[req.passed ? 'pass' : 'fail'];

      const wrapper = document.createElement('div');
      wrapper.className = `flex items-start gap-3 rounded border p-3 text-sm ${style.wrapper}`;

      const icon = document.createElement('span');
      icon.className = `mt-0.5 text-base ${style.icon}`;
      icon.textContent = style.symbol;
      icon.setAttribute('aria-hidden', 'true');

      const content = document.createElement('div');
      content.className = 'space-y-1';
      const title = document.createElement('p');
      title.className = 'font-medium';
      title.textContent = req.label || 'Requirement';
      content.appendChild(title);

      if (req.details) {
        const details = document.createElement('p');
        details.className = 'text-xs';
        details.textContent = req.details;
        content.appendChild(details);
      }

      wrapper.append(icon, content);
      prereqStatus.appendChild(wrapper);
    });
  }

  function setSummary(message, status = 'info') {
    if (!prereqSummary) return;
    prereqSummary.textContent = message || '';
    prereqSummary.className = 'mt-2 text-sm';
    if (status === 'success') {
      prereqSummary.classList.add('text-green-700');
    } else if (status === 'error') {
      prereqSummary.classList.add('text-red-600');
    } else {
      prereqSummary.classList.add('text-gray-600');
    }
  }

  async function checkPrereqs() {
    if (!checkBtn) return;
    checkBtn.disabled = true;
    clearError();
    clearSetupSecretError();
    setProgress(STEP_PROGRESS.prereq);
    setSummary('Checking prerequisites...', 'info');
    renderRequirements([], '');

    try {
      const headers = {};
      const secret = getSetupSecret();
      if (secret) {
        headers['x-install-setup-secret'] = secret;
      }
      const res = await fetch('/api/install/prereqs', { headers });
      const bodyText = await res.text();
      let data = {};
      if (bodyText) {
        try {
          data = JSON.parse(bodyText);
        } catch (_err) {
          data = { output: bodyText };
        }
      }

      if (res.status === 403 && data?.code === 'INSTALL_LOCKED') {
        const message = data?.message || 'Installation locked. An administrator already exists.';
        showError(message);
        setSummary(message || 'Installation locked.', 'error');
        if (/secret/i.test(message)) {
          showSetupSecretError(message);
          setupSecretInput?.focus();
        }
        return;
      }

      if (!res.ok) {
        const message =
          data?.message || data?.error || INSTALLER_DISABLED_GUIDANCE;
        showError(message);
        setSummary('Unable to verify prerequisites.', 'error');
        return;
      }

      const normalized = normalizePrereqResponse(data);
      renderRequirements(normalized.requirements, normalized.rawText);
      setSummary(normalized.summary, normalized.allPassing ? 'success' : 'error');

      updateStep('config');
      setProgress(STEP_PROGRESS.config);
    } catch (error) {
      showError(`Failed to verify prerequisites: ${error.message}`);
      setSummary('Unable to verify prerequisites. Please try again.', 'error');
    } finally {
      checkBtn.disabled = false;
    }
  }

  function clearFieldErrors() {
    if (!configForm) return;
    configForm.querySelectorAll('[name]').forEach((input) => {
      input.removeAttribute('aria-invalid');
      input.classList.remove('border-red-400', 'focus:border-red-500', 'focus:ring-red-200');
    });
    configForm.querySelectorAll('[data-field-error]').forEach((el) => {
      el.textContent = '';
      el.classList.add('hidden');
    });
    configForm.querySelectorAll('[data-field-success]').forEach((el) => {
      el.textContent = '';
      el.classList.add('hidden');
    });
  }

  function clearFieldError(name) {
    if (!configForm) return;
    const field = configForm.querySelector(`[name="${name}"]`);
    if (field) {
      field.removeAttribute('aria-invalid');
      field.classList.remove('border-red-400', 'focus:border-red-500', 'focus:ring-red-200');
    }
    const errorEl = getFieldErrorElement(name);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  function setFieldError(name, message) {
    if (!configForm) return;
    const field = configForm.querySelector(`[name="${name}"]`);
    if (field) {
      field.setAttribute('aria-invalid', 'true');
      field.classList.add('border-red-400', 'focus:border-red-500', 'focus:ring-red-200');
    }
    clearFieldSuccess(name);
    const errorEl = getFieldErrorElement(name);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  function updateCodecanyonStatus(status, message) {
    if (!codecanyonStatus) return;
    codecanyonStatus.textContent = message || '';
    codecanyonStatus.classList.remove('text-gray-600', 'text-green-600', 'text-red-600');
    if (!message) {
      codecanyonStatus.classList.add('hidden');
      return;
    }
    codecanyonStatus.classList.remove('hidden');
    if (status === 'success') {
      codecanyonStatus.classList.add('text-green-600');
    } else if (status === 'error') {
      codecanyonStatus.classList.add('text-red-600');
    } else {
      codecanyonStatus.classList.add('text-gray-600');
    }
  }

  function clearCodecanyonStatus({ resetKey = false } = {}) {
    if (resetKey) {
      codecanyonVerification.key = '';
    }
    codecanyonVerification.status = 'idle';
    codecanyonVerification.message = '';
    if (codecanyonStatus) {
      codecanyonStatus.textContent = '';
      codecanyonStatus.classList.add('hidden');
      codecanyonStatus.classList.remove('text-gray-600', 'text-green-600', 'text-red-600');
    }
  }

  function collectConfiguration(formData) {
    const config = {
      adminEmail: sanitize(formData.get('adminEmail')),
      adminPassword: String(formData.get('adminPassword') ?? ''),
      appName: sanitize(formData.get('appName')),
      supportEmail: sanitize(formData.get('supportEmail')),
      codecanyonKey: sanitize(formData.get('codecanyonKey')),
      branding: {
        logoUrl: sanitize(formData.get('logoUrl')),
        logoFile: null,
      },
      smtp: {
        host: sanitize(formData.get('smtpHost')),
        port: parsePort(formData.get('smtpPort')),
        username: sanitize(formData.get('smtpUsername')),
        password: String(formData.get('smtpPassword') ?? ''),
        secure: false,
        fromEmail: sanitize(formData.get('smtpFromEmail')),
        fromName: sanitize(formData.get('smtpFromName')),
      },
    };

    const secureValue = formData.get('smtpSecure');
    if (typeof secureValue === 'string') {
      const lowered = secureValue.toLowerCase();
      config.smtp.secure = ['on', 'true', '1', 'yes'].includes(lowered);
    } else if (typeof secureValue === 'boolean') {
      config.smtp.secure = secureValue;
    }

    const logoFile = formData.get('logoFile');
    if (typeof File !== 'undefined' && logoFile instanceof File && logoFile.size > 0) {
      config.branding.logoFile = logoFile;
    }

    return config;
  }

  function validateConfiguration(configuration) {
    const issues = [];

    if (!configuration.adminEmail) {
      issues.push({ field: 'adminEmail', message: 'Enter an admin email address.' });
    } else if (!isValidEmail(configuration.adminEmail)) {
      issues.push({ field: 'adminEmail', message: 'Enter a valid admin email address.' });
    }

    if (!configuration.adminPassword || configuration.adminPassword.length < 8) {
      issues.push({ field: 'adminPassword', message: 'Admin password must be at least 8 characters.' });
    }

    if (!configuration.appName) {
      issues.push({ field: 'appName', message: 'Enter a public app name.' });
    }

    if (!configuration.supportEmail) {
      issues.push({ field: 'supportEmail', message: 'Enter a support email address.' });
    } else if (!isValidEmail(configuration.supportEmail)) {
      issues.push({ field: 'supportEmail', message: 'Enter a valid support email address.' });
    }

    if (!configuration.smtp.host) {
      issues.push({ field: 'smtpHost', message: 'Enter the SMTP host.' });
    }

    if (!Number.isInteger(configuration.smtp.port)) {
      issues.push({ field: 'smtpPort', message: 'Enter a valid SMTP port.' });
    } else if (configuration.smtp.port <= 0 || configuration.smtp.port > 65535) {
      issues.push({ field: 'smtpPort', message: 'SMTP port must be between 1 and 65535.' });
    }

    if (!configuration.smtp.username) {
      issues.push({ field: 'smtpUsername', message: 'Enter the SMTP username.' });
    }

    if (!configuration.smtp.password) {
      issues.push({ field: 'smtpPassword', message: 'Enter the SMTP password.' });
    }

    if (configuration.smtp.fromEmail && !isValidEmail(configuration.smtp.fromEmail)) {
      issues.push({ field: 'smtpFromEmail', message: 'From email must be a valid email address.' });
    }

    if (configuration.branding.logoUrl && !isValidUrl(configuration.branding.logoUrl)) {
      issues.push({ field: 'logoUrl', message: 'Logo URL must be a valid URL.' });
    }

    if (
      configuration.branding.logoFile &&
      typeof configuration.branding.logoFile.size === 'number' &&
      configuration.branding.logoFile.size > MAX_LOGO_FILE_BYTES
    ) {
      issues.push({ field: 'logoFile', message: 'Uploaded logo must be 2 MB or smaller.' });
    }

    if (configuration.codecanyonKey && configuration.codecanyonKey.length < 6) {
      issues.push({ field: 'codecanyonKey', message: 'Codecanyon key should be at least 6 characters.' });
    }

    return issues;
  }

  function buildSubmissionPayload(configuration, rawFormData) {
    const payload = new FormData();
    payload.set('adminEmail', configuration.adminEmail);
    payload.set('adminPassword', configuration.adminPassword);
    payload.set('appName', configuration.appName);
    payload.set('supportEmail', configuration.supportEmail);

    payload.set('smtpHost', configuration.smtp.host);
    payload.set('smtpPort', String(configuration.smtp.port));
    payload.set('smtpUsername', configuration.smtp.username);
    payload.set('smtpPassword', configuration.smtp.password);
    payload.set('smtpSecure', configuration.smtp.secure ? 'true' : 'false');
    if (configuration.smtp.fromEmail) {
      payload.set('smtpFromEmail', configuration.smtp.fromEmail);
    }
    if (configuration.smtp.fromName) {
      payload.set('smtpFromName', configuration.smtp.fromName);
    }

    if (configuration.branding.logoUrl) {
      payload.set('logoUrl', configuration.branding.logoUrl);
    }

    if (configuration.branding.logoFile) {
      payload.set('logoFile', configuration.branding.logoFile, configuration.branding.logoFile.name);
    } else {
      const logoFile = rawFormData.get('logoFile');
      if (typeof File !== 'undefined' && logoFile instanceof File && logoFile.size > 0) {
        payload.set('logoFile', logoFile, logoFile.name);
      }
    }

    if (configuration.codecanyonKey) {
      payload.set('codecanyonKey', configuration.codecanyonKey);
    }

    return payload;
  }

  async function verifyCodecanyonLicense(key, { force = false } = {}) {
    const sanitized = sanitize(key);
    if (!sanitized) {
      clearCodecanyonStatus({ resetKey: true });
      return { ok: true, message: '' };
    }

    if (!force && codecanyonVerification.status === 'success' && codecanyonVerification.key === sanitized) {
      updateCodecanyonStatus('success', codecanyonVerification.message);
      return { ok: true, message: codecanyonVerification.message };
    }

    codecanyonVerification.key = sanitized;
    codecanyonVerification.status = 'checking';
    codecanyonVerification.message = 'Verifying license...';
    updateCodecanyonStatus('checking', 'Verifying license with Envato...');

    const headers = { 'Content-Type': 'application/json' };
    const csrfToken = getCookie('csrfToken');
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
    const secret = getSetupSecret();
    if (secret) {
      headers['x-install-setup-secret'] = secret;
    }

    const body = { purchase_code: sanitized };
    if (typeof window !== 'undefined' && window.location?.hostname) {
      body.domain = window.location.hostname;
    }

    try {
      const response = await fetch('/api/license/verify', {
        method: 'POST',
        headers,
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (_err) {
          data = {};
        }
      }
      if (!response.ok || data?.success === false) {
        const message =
          data?.message ||
          data?.error ||
          (response.status === 403
            ? 'License verification blocked. Refresh the page and ensure cookies are enabled.'
            : 'Unable to verify license. Check your Envato/Codecanyon code.');
        codecanyonVerification.status = 'error';
        codecanyonVerification.message = message;
        updateCodecanyonStatus('error', message);
        return { ok: false, message };
      }

      const message = data?.message || 'License verified successfully.';
      codecanyonVerification.status = 'success';
      codecanyonVerification.message = message;
      codecanyonVerification.key = sanitized;
      updateCodecanyonStatus('success', message);
      clearFieldError('codecanyonKey');
      return { ok: true, message };
    } catch (error) {
      const message = `Unable to verify license: ${error.message}`;
      codecanyonVerification.status = 'error';
      codecanyonVerification.message = message;
      updateCodecanyonStatus('error', message);
      return { ok: false, message };
    }
  }

  function showCompletion(result) {
    if (!completionCard) return;
    const messageFromApi =
      typeof result?.message === 'string' && result.message.trim()
        ? result.message.trim()
        : typeof result?.summary === 'string' && result.summary.trim()
          ? result.summary.trim()
          : 'Installation complete. SkillBridge is ready to use!';

    if (completionMessage) {
      completionMessage.textContent = messageFromApi;
    }

    if (completionNextSteps) {
      completionNextSteps.innerHTML = '';
      const steps = Array.isArray(result?.nextSteps)
        ? result.nextSteps.filter((step) => typeof step === 'string' && step.trim())
        : [];

      if (!steps.length && submittedConfig) {
        steps.push(
          submittedConfig.adminEmail
            ? `Sign in to the SkillBridge admin dashboard with ${submittedConfig.adminEmail}.`
            : 'Sign in to the SkillBridge admin dashboard with the credentials you configured.'
        );
        if (submittedConfig.supportEmail) {
          steps.push(`System emails will send from ${submittedConfig.supportEmail}. You can adjust this in Settings → Email.`);
        }
        steps.push('Review branding details under Settings → App to confirm your logo and application name.');
        steps.push('Visit the documentation for deployment and integration guidance.');
      }

      steps.forEach((step) => {
        const li = document.createElement('li');
        li.textContent = step;
        completionNextSteps.appendChild(li);
      });
    }

    completionCard.classList.remove('hidden');
  }

  async function handleInstallSubmit(event) {
    event.preventDefault();
    if (!configForm) return;

    clearError();
    completionCard?.classList.add('hidden');
    backToConfigBtn?.classList.add('hidden');
    clearFieldErrors();

    if (installBtn) installBtn.disabled = true;
    const enableInstallButton = () => {
      if (installBtn) installBtn.disabled = false;
    };

    const rawFormData = new FormData(configForm);
    const configuration = collectConfiguration(rawFormData);
    const issues = validateConfiguration(configuration);

    if (issues.length > 0) {
      const first = issues[0];
      issues.forEach((issue) => setFieldError(issue.field, issue.message));
      showError(first.message);
      const firstField = configForm.querySelector(`[name="${first.field}"]`);
      if (firstField && typeof firstField.focus === 'function') {
        firstField.focus();
      }
      enableInstallButton();
      return;
    }

    if (configuration.codecanyonKey) {
      const licenseResult = await verifyCodecanyonLicense(configuration.codecanyonKey, { force: true });
      if (!licenseResult.ok) {
        setFieldError('codecanyonKey', licenseResult.message);
        showError(licenseResult.message);
        codecanyonInput?.focus();
        enableInstallButton();
        return;
      }
    } else {
      clearCodecanyonStatus({ resetKey: true });
    }

    submittedConfig = configuration;

    updateStep('install');
    setProgress(STEP_PROGRESS.install);

    if (installOutput) {
      installOutput.classList.remove('hidden', 'text-red-700', 'text-green-700');
      installOutput.classList.add('text-gray-700');
      installOutput.textContent = 'Running installation with your configuration...';
    }

    try {
      const csrfToken = getCookie('csrfToken');
      if (!csrfToken) {
        const message =
          'Unable to run install because a CSRF token was not found. Refresh the page and try again.';
        showError(message);
        if (installOutput) {
          installOutput.classList.remove('text-gray-700');
          installOutput.classList.add('text-red-700');
          installOutput.textContent = message;
        }
        backToConfigBtn?.classList.remove('hidden');
        enableInstallButton();
        updateStep('config', { preserveProgress: true });
        return;
      }

      const submissionData = buildSubmissionPayload(configuration, rawFormData);
      clearSetupSecretError();
      const requestHeaders = {
        'x-csrf-token': csrfToken,
      };
      const secret = getSetupSecret();
      if (secret) {
        requestHeaders['x-install-setup-secret'] = secret;
      }
      const res = await fetch('/api/install/run', {
        method: 'POST',
        headers: requestHeaders,
        body: submissionData,
      });

      const responseText = await res.text();
      let data = {};
      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch (_err) {
          data = { output: responseText };
        }
      }

      if (res.status === 403 && data?.code === 'INSTALL_LOCKED') {
        const message =
          data?.message || 'Installation locked. An administrator already exists.';
        showError(message);
        if (installOutput) {
          installOutput.classList.remove('text-gray-700');
          installOutput.classList.add('text-red-700');
          installOutput.textContent = message;
        }
        if (/secret/i.test(message)) {
          showSetupSecretError(message);
          setupSecretInput?.focus();
        }
        updateStep('config', { preserveProgress: true });
        backToConfigBtn?.classList.remove('hidden');
        enableInstallButton();
        return;
      }

      if (res.status === 401 || res.status === 403) {
        const message = data?.message || 'Please log in to continue.';
        showError(message);
        if (/secret/i.test(message)) {
          showSetupSecretError(message);
          setupSecretInput?.focus();
        }
        if (installOutput) {
          installOutput.classList.remove('text-gray-700');
          installOutput.classList.add('text-red-700');
          installOutput.textContent = message;
        }
        updateStep('config', { preserveProgress: true });
        backToConfigBtn?.classList.remove('hidden');
        enableInstallButton();
        return;
      }

      if (res.status === 400) {
        const highlightFields = [];
        const registerFieldError = (field, message) => {
          if (typeof field !== 'string' || !field) return;
          highlightFields.push(field);
          setFieldError(field, message || 'Please correct this value.');
        };

        if (Array.isArray(data?.errors)) {
          data.errors.forEach((issue) => {
            if (!issue) return;
            const path = Array.isArray(issue.path)
              ? issue.path.find((segment) => typeof segment === 'string')
              : typeof issue.path === 'string'
                ? issue.path
                : undefined;
            registerFieldError(path, typeof issue.message === 'string' ? issue.message : undefined);
          });
        }

        if (data?.fieldErrors && typeof data.fieldErrors === 'object') {
          Object.entries(data.fieldErrors).forEach(([field, message]) => {
            registerFieldError(field, typeof message === 'string' ? message : undefined);
          });
        }

        const summaryMessage =
          typeof data?.message === 'string' && data.message.trim().length > 0
            ? data.message.trim()
            : 'Installation configuration contains errors. Please review the highlighted fields.';

        showError(summaryMessage);
        updateStep('config', { preserveProgress: true });
        backToConfigBtn?.classList.remove('hidden');

        if (installOutput) {
          installOutput.classList.remove('text-gray-700');
          installOutput.classList.add('text-red-700');
          installOutput.textContent = summaryMessage;
        }

        if (highlightFields.length > 0) {
          const firstField = configForm.querySelector(`[name="${highlightFields[0]}"]`);
          if (firstField && typeof firstField.focus === 'function') {
            firstField.focus();
          }
        }

        if (installBtn) installBtn.disabled = false;
        return;
      }

      const success = typeof data.ok === 'boolean' ? data.ok : res.ok;
      const outputText =
        typeof data.output === 'string' && data.output.trim().length > 0
          ? data.output
          : typeof data.log === 'string'
            ? data.log
            : responseText;

      if (installOutput) {
        installOutput.classList.remove('text-gray-700');
        installOutput.classList.add(success ? 'text-green-700' : 'text-red-700');
        if (outputText && outputText.trim().length > 0) {
          installOutput.classList.remove('hidden');
          installOutput.textContent = outputText.trim();
        } else if (success) {
          installOutput.classList.add('hidden');
          installOutput.textContent = '';
        } else {
          installOutput.classList.remove('hidden');
          installOutput.textContent = 'Installation failed with no additional output.';
        }
      }

      if (success) {
        setProgress(100);
        clearError();
        showCompletion(data);
      } else {
        showError('Installation failed. Review the log below, adjust your configuration, and try again.');
        backToConfigBtn?.classList.remove('hidden');
      }
    } catch (error) {
      showError(`Error running install: ${error.message}`);
      if (installOutput) {
        installOutput.classList.remove('hidden', 'text-green-700');
        installOutput.classList.add('text-red-700');
        installOutput.textContent = `Error: ${error.message}`;
      }
      backToConfigBtn?.classList.remove('hidden');
    } finally {
      enableInstallButton();
    }
  }

  if (checkBtn) {
    checkBtn.addEventListener('click', checkPrereqs);
  }

  if (configForm) {
    configForm.addEventListener('submit', handleInstallSubmit);
  }

  if (codecanyonInput) {
    codecanyonInput.addEventListener('input', () => {
      licenseVerificationCache.code = '';
      licenseVerificationCache.result = null;
      clearFieldSuccess('codecanyonKey');
      const field = codecanyonInput;
      field.removeAttribute('aria-invalid');
      field.classList.remove('border-red-400', 'focus:border-red-500', 'focus:ring-red-200');
      const errorEl = getFieldErrorElement('codecanyonKey');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
      }
    });
  }

  if (backToConfigBtn) {
    backToConfigBtn.addEventListener('click', () => {
      clearError();
      completionCard?.classList.add('hidden');
      updateStep('config', { preserveProgress: true });
      setProgress(STEP_PROGRESS.config);
      if (installOutput) {
        installOutput.classList.add('hidden');
        installOutput.classList.remove('text-green-700', 'text-red-700');
        installOutput.classList.add('text-gray-700');
        installOutput.textContent = '';
      }
      if (configForm) {
        const firstInput = configForm.querySelector('input');
        if (firstInput && typeof firstInput.focus === 'function') {
          firstInput.focus();
        }
      }
    });
  }

  updateStep('prereq', { preserveProgress: true });
  setProgress(0);
  checkPrereqs();
});
