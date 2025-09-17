const STEP_ORDER = ['prereq', 'config', 'install'];
const STEP_PROGRESS = {
  config: 55,
  install: 80,
};
const FRIENDLY_LABELS = {
  node: 'Node.js',
  npm: 'npm',
  docker: 'Docker',
  dockerCompose: 'Docker Compose',
  git: 'Git',
  postgres: 'PostgreSQL',
  redis: 'Redis',
  yarn: 'Yarn',
  pnpm: 'pnpm',
  python: 'Python',
};

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
  const configForm = document.getElementById('configForm');
  const installBtn = document.getElementById('installBtn');
  const installOutput = document.getElementById('installOutput');
  const completionCard = document.getElementById('completionCard');
  const completionMessage = document.getElementById('completionMessage');
  const completionNextSteps = document.getElementById('completionNextSteps');
  const backToConfigBtn = document.getElementById('backToConfigBtn');

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

  const INSTALLER_DISABLED_GUIDANCE =
    'The SkillBridge installer API is disabled. Enable it by setting INSTALL_API_ENABLED=true (and/or ENABLE_INSTALL=true) and try again.';

  function extractResponseMessage(data, bodyText) {
    if (data && typeof data === 'object') {
      const candidates = [
        data.message,
        data.error,
        data.error?.message,
        data.summary,
        data.statusMessage,
        data.details,
      ];
      for (const value of candidates) {
        if (typeof value === 'string' && value.trim().length > 0) {
          return value.trim();
        }
      }
    }

    if (typeof bodyText === 'string') {
      const trimmed = bodyText.trim();
      if (trimmed.length > 0 && trimmed.length <= 500) {
        return trimmed;
      }
    }

    return '';
  }

  function isInstallerApiDisabledMessage(message) {
    if (typeof message !== 'string' || !message.trim()) return false;
    const normalized = message.toLowerCase();
    return normalized.includes('installer api') && normalized.includes('disabled');
  }

  function updateStep(step, options = {}) {
    if (!STEP_ORDER.includes(step)) return;
    const { preserveProgress = false } = options;
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

    if (!preserveProgress) {
      const base = STEP_PROGRESS[step];
      if (typeof base === 'number') {
        setProgress(base);
      }
    }
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

  function normalizePrereqResponse(raw) {
    const normalized = { requirements: [], summary: '', allPassing: false, rawText: '' };
    if (raw == null) {
      normalized.summary = 'No prerequisite information was returned.';
      return normalized;
    }

    let payload;
    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (!trimmed) {
        normalized.summary = 'No prerequisite information was returned.';
        return normalized;
      }
      try {
        payload = JSON.parse(trimmed);
      } catch {
        normalized.rawText = trimmed;
        normalized.summary = trimmed;
        return normalized;
      }
    } else {
      payload = { ...raw };
    }

    if (typeof payload.output === 'string') {
      const trimmedOutput = payload.output.trim();
      if (trimmedOutput) {
        try {
          const parsed = JSON.parse(trimmedOutput);
          if (parsed && typeof parsed === 'object') {
            payload = { ...parsed, ...payload };
          }
        } catch {
          normalized.rawText = trimmedOutput;
        }
      }
    }

    let requirements = [];
    if (Array.isArray(payload.requirements)) {
      requirements = payload.requirements.map((req, index) => {
        const id = req?.id || req?.key || req?.name || `requirement-${index}`;
        const label = req?.label || req?.name || FRIENDLY_LABELS[id] || formatKey(id);
        const value = req?.ok ?? req?.passed ?? req?.status ?? req?.value ?? req?.isMet ?? false;
        const passed =
          typeof value === 'boolean'
            ? value
            : typeof value === 'string'
              ? ['ok', 'pass', 'passed', 'true', 'ready'].includes(value.toLowerCase())
              : Boolean(value);
        const details = req?.details || req?.message || req?.hint || '';
        return { id, label, passed, details };
      });
    } else {
      const ignoreKeys = new Set(['ok', 'summary', 'message', 'output', 'requirements']);
      requirements = Object.entries(payload)
        .filter(([key, value]) => !ignoreKeys.has(key) && value !== undefined && value !== null)
        .map(([key, value]) => {
          const label = FRIENDLY_LABELS[key] || formatKey(key);
          let passed = false;
          let details = '';
          if (typeof value === 'boolean') {
            passed = value;
          } else if (typeof value === 'string') {
            const lowered = value.toLowerCase();
            passed = ['ok', 'pass', 'passed', 'true', 'ready', 'success'].includes(lowered);
            if (!passed && lowered.length) {
              details = value;
            }
          } else if (typeof value === 'number') {
            passed = value > 0;
          } else if (typeof value === 'object') {
            if (typeof value.ok === 'boolean') {
              passed = value.ok;
            } else if (typeof value.passed === 'boolean') {
              passed = value.passed;
            } else if (typeof value.status === 'string') {
              passed = ['ok', 'pass', 'passed', 'ready', 'success'].includes(value.status.toLowerCase());
            } else if (typeof value.value === 'boolean') {
              passed = value.value;
            } else if (typeof value.isMet === 'boolean') {
              passed = value.isMet;
            }
            details = value.message || value.details || value.hint || '';
          }
          return { id: key, label, passed, details };
        });
    }

    normalized.requirements = requirements;
    const requirementsPassing = requirements.length ? requirements.every((req) => req.passed) : false;

    if (typeof payload.ok === 'boolean') {
      normalized.allPassing = payload.ok && (requirements.length ? requirementsPassing : true);
    } else if (requirements.length) {
      normalized.allPassing = requirementsPassing;
    } else if (normalized.rawText) {
      normalized.allPassing = false;
    }

    normalized.summary =
      payload.summary ||
      payload.message ||
      (normalized.allPassing
        ? 'All prerequisites satisfied.'
        : requirements.length
          ? 'Some prerequisites need attention.'
          : normalized.rawText || 'No prerequisite information was returned.');

    return normalized;
  }

  function renderRequirements(requirements, rawText = '') {
    if (!prereqStatus) return;
    prereqStatus.innerHTML = '';
    if (!requirements.length) {
      if (rawText) {
        const pre = document.createElement('pre');
        pre.className =
          'whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700';
        pre.textContent = rawText;
        prereqStatus.appendChild(pre);
      } else {
        const empty = document.createElement('p');
        empty.className = 'text-sm text-gray-600';
        empty.textContent = 'No prerequisite details were returned.';
        prereqStatus.appendChild(empty);
      }
      return;
    }

    requirements.forEach((req) => {
      const wrapper = document.createElement('div');
      wrapper.className = [
        'flex items-start gap-3 rounded border p-3 text-sm transition-colors duration-300',
        req.passed ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700',
      ].join(' ');

      const icon = document.createElement('span');
      icon.className = `mt-0.5 text-base ${req.passed ? 'text-green-600' : 'text-red-600'}`;
      icon.textContent = req.passed ? '✓' : '!';
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

  function showCompletion(data, credentials) {
    if (!completionCard) return;
    const messageFromApi =
      data?.message || data?.summary || data?.success || data?.statusMessage || '';
    const instructionsFromApi = Array.isArray(data?.nextSteps)
      ? data.nextSteps
      : typeof data?.nextSteps === 'string'
        ? [data.nextSteps]
        : [];

    if (completionMessage) {
      completionMessage.className = 'mt-1 text-green-700';
      completionMessage.textContent =
        messageFromApi || 'SkillBridge is installed and ready to go.';
    }

    if (completionNextSteps) {
      completionNextSteps.innerHTML = '';
      const steps =
        instructionsFromApi.length > 0
          ? instructionsFromApi
          : [
              credentials?.adminEmail
                ? `Sign in to the SkillBridge admin dashboard with ${credentials.adminEmail}.`
                : 'Sign in to the SkillBridge admin dashboard with the credentials you configured.',
              'Complete the organization setup and invite your teammates.',
              'Visit the documentation for deployment and integration guidance.',
            ];
      steps
        .filter((step) => typeof step === 'string' && step.trim().length > 0)
        .forEach((step) => {
          const li = document.createElement('li');
          li.textContent = step.trim();
          completionNextSteps.appendChild(li);
        });
    }

    completionCard.classList.remove('hidden');
    backToConfigBtn?.classList.add('hidden');
  }

  async function checkPrereqs() {
    updateStep('prereq', { preserveProgress: true });
    clearError();
    completionCard?.classList.add('hidden');
    backToConfigBtn?.classList.add('hidden');

    if (prereqStatus) {
      prereqStatus.innerHTML = '';
      const loading = document.createElement('p');
      loading.className = 'text-sm text-gray-600';
      loading.textContent = 'Checking prerequisites...';
      prereqStatus.appendChild(loading);
    }
    setSummary('Checking prerequisites...', 'info');
    setProgress(12);
    if (checkBtn) checkBtn.disabled = true;

    try {
      const res = await fetch('/api/install/prereqs', { cache: 'no-store' });
      const bodyText = await res.text();
      let data;
      if (bodyText) {
        try {
          data = JSON.parse(bodyText);
        } catch {
          data = { output: bodyText };
        }
      } else {
        data = {};
      }

      if (res.status === 403 && data?.code === 'INSTALL_LOCKED') {
        const message =
          data?.message ||
          'Installation locked. An administrator has already completed the setup. Please sign in.';
        setSummary(message, 'error');
        showError(
          'SkillBridge is already installed. Sign in with an administrator account to manage your site.'
        );
        setProgress(0);
        return;
      }

      if (res.status === 401 || res.status === 403) {
        const message = data?.message || 'Authentication required. Please log in and try again.';
        setSummary(message, 'error');
        showError(message);
        setProgress(0);
        return;
      }

      const normalized = normalizePrereqResponse(data);
      renderRequirements(normalized.requirements, normalized.rawText);
      const summaryStatus = normalized.allPassing
        ? 'success'
        : normalized.requirements.length
          ? 'error'
          : 'info';
      setSummary(normalized.summary, summaryStatus);

      if (normalized.allPassing && res.ok) {
        clearError();
        updateStep('config');
      } else {
        showError(
          res.ok
            ? 'Prerequisite check failed. Review the requirements below.'
            : `Prerequisite check failed${res.status ? ` (HTTP ${res.status})` : ''}.`,
        );
        setProgress(20);
      }
    } catch (err) {
      showError(`Error checking prerequisites: ${err.message}`);
      setSummary('Unable to verify prerequisites. Please try again.', 'error');
      setProgress(10);
    } finally {
      if (checkBtn) checkBtn.disabled = false;
    }
  }

  async function handleInstallSubmit(event) {
    event.preventDefault();
    clearError();
    completionCard?.classList.add('hidden');
    backToConfigBtn?.classList.add('hidden');

    if (!configForm) return;

    const formData = new FormData(configForm);
    const credentials = {
      adminEmail: String(formData.get('adminEmail') || '').trim(),
      adminPassword: String(formData.get('adminPassword') || ''),
    };

    updateStep('install');
    setProgress(90);

    if (installBtn) installBtn.disabled = true;

    if (installOutput) {
      installOutput.classList.remove('hidden', 'text-green-700', 'text-red-700');
      installOutput.classList.add('text-gray-700');
      installOutput.textContent = 'Running install...';
    }

    try {
      const res = await fetch('/api/install/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const responseText = await res.text();
      let data;
      if (bodyText) {
        try {
          data = JSON.parse(bodyText);
        } catch {
          data = { output: bodyText };
        }
      } else {
        data = {};
      }

      if (res.status === 403 && data?.code === 'INSTALL_LOCKED') {
        const message =
          data?.message ||
          'Installation locked. An administrator already exists. Sign in to manage this instance.';
        showError(message);
        if (installOutput) {
          installOutput.classList.remove('text-gray-700', 'text-green-700');
          installOutput.classList.add('text-red-700');
          installOutput.textContent = message;
        }
        updateStep('config');
        return;
      }

      if (res.status === 401 || res.status === 403) {
        const message = data?.message || 'Please log in to continue.';
        showError(message);
        if (installOutput) {
          installOutput.classList.remove('text-gray-700', 'text-green-700');
          installOutput.classList.add('text-red-700');
          installOutput.textContent = message;
        }
        updateStep('config');
        return;
      }

      const success = typeof data.ok === 'boolean' ? data.ok : res.ok;
      const outputText =
        typeof data.output === 'string' && data.output.trim().length > 0
          ? data.output
          : typeof data.log === 'string'
            ? data.log
            : bodyText;

      if (installOutput) {
        installOutput.classList.remove('text-gray-700', 'text-green-700', 'text-red-700');
        installOutput.classList.add(success ? 'text-green-700' : 'text-red-700');
        if (outputText && outputText.trim().length > 0) {
          installOutput.classList.remove('hidden');
          installOutput.textContent = outputText.trim();
        } else if (!success) {
          installOutput.classList.remove('hidden');
          installOutput.textContent = 'Installation failed with no additional output.';
        } else {
          installOutput.classList.add('hidden');
          installOutput.textContent = '';
        }
      }

      if (success) {
        setProgress(100);
        clearError();
        showCompletion(data, credentials);
      } else {
        showError('Installation failed. Review the log below and try again.');
        backToConfigBtn?.classList.remove('hidden');
        setProgress(STEP_PROGRESS.install);
      }
    } catch (err) {
      showError(`Error running install: ${err.message}`);
      if (installOutput) {
        installOutput.classList.remove('hidden', 'text-green-700');
        installOutput.classList.add('text-red-700');
        installOutput.textContent = `Error: ${err.message}`;
      }
      backToConfigBtn?.classList.remove('hidden');
      setProgress(STEP_PROGRESS.install);
    } finally {
      if (installBtn) installBtn.disabled = false;
    }
  }

  if (checkBtn) {
    checkBtn.addEventListener('click', checkPrereqs);
  }
  if (configForm) {
    configForm.addEventListener('submit', handleInstallSubmit);
  }
  if (backToConfigBtn) {
    backToConfigBtn.addEventListener('click', () => {
      clearError();
      updateStep('config');
      setProgress(STEP_PROGRESS.config);
      completionCard?.classList.add('hidden');
      if (installOutput) {
        installOutput.classList.add('hidden');
        installOutput.classList.remove('text-green-700', 'text-red-700');
        installOutput.classList.add('text-gray-700');
        installOutput.textContent = '';
      }
      if (configForm) {
        const firstInput = configForm.querySelector('input');
        if (firstInput) {
          firstInput.focus();
        }
      }
    });
  }

  updateStep('prereq', { preserveProgress: true });
  setProgress(0);
  checkPrereqs();
});
