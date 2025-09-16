const stepItems = Array.from(document.querySelectorAll('[data-step-index]'));
const stepPanels = Array.from(document.querySelectorAll('[data-panel-index]'));
const connectors = Array.from(document.querySelectorAll('[data-step-connector]'));
const panelContainer = document.getElementById('stepPanels');
const checkBtn = document.getElementById('checkBtn');
const prereqOutput = document.getElementById('prereqOutput');
const configForm = document.getElementById('configForm');
const installStatus = document.getElementById('installStatus');
const installOutput = document.getElementById('installOutput');

let activeStepIndex = 0;
const completedSteps = new Set();

const STATUS_CLASSES = {
  neutral: ['border-slate-200', 'bg-slate-50', 'text-slate-600'],
  loading: ['border-blue-200', 'bg-blue-50', 'text-blue-700'],
  success: ['border-emerald-300', 'bg-emerald-50', 'text-emerald-700'],
  error: ['border-rose-300', 'bg-rose-50', 'text-rose-700'],
};

const ALL_STATUS_CLASSES = Array.from(new Set(Object.values(STATUS_CLASSES).flat()));
const CIRCLE_STATE_CLASSES = [
  'bg-blue-600',
  'bg-green-600',
  'bg-white',
  'border-blue-600',
  'border-green-600',
  'border-gray-300',
  'text-white',
  'text-gray-400',
  'shadow-lg',
  'scale-110',
];
const LABEL_STATE_CLASSES = ['text-blue-600', 'text-green-600', 'text-slate-500', 'font-semibold'];
const CONNECTOR_STATE_CLASSES = ['bg-slate-200', 'bg-blue-500', 'bg-emerald-500'];

function applyStatusClasses(element, state = 'neutral') {
  if (!element) return;
  element.classList.remove(...ALL_STATUS_CLASSES);
  const classes = STATUS_CLASSES[state] || STATUS_CLASSES.neutral;
  element.classList.add(...classes);
}

function refreshPanelHeight() {
  const activePanel = stepPanels[activeStepIndex];
  if (!panelContainer || !activePanel) return;
  window.requestAnimationFrame(() => {
    panelContainer.style.height = `${activePanel.scrollHeight}px`;
  });
}

function updateStepItems() {
  stepItems.forEach((item, index) => {
    const circle = item.querySelector('.step-circle');
    const label = item.querySelector('.step-label');
    const isActive = index === activeStepIndex;
    const isCompleted = completedSteps.has(index);
    const isAccessible = index <= activeStepIndex;

    if (circle) {
      circle.classList.remove(...CIRCLE_STATE_CLASSES);
      if (isCompleted) {
        circle.classList.add('bg-green-600', 'border-green-600', 'text-white');
      } else if (isActive) {
        circle.classList.add('bg-blue-600', 'border-blue-600', 'text-white', 'shadow-lg', 'scale-110');
      } else {
        circle.classList.add('bg-white', 'border-gray-300', 'text-gray-400');
      }
    }

    if (label) {
      label.classList.remove(...LABEL_STATE_CLASSES);
      if (isCompleted) {
        label.classList.add('text-green-600', 'font-semibold');
      } else if (isActive) {
        label.classList.add('text-blue-600', 'font-semibold');
      } else {
        label.classList.add('text-slate-500');
      }
    }

    item.classList.toggle('cursor-pointer', isAccessible);
    item.classList.toggle('cursor-not-allowed', !isAccessible);
    item.setAttribute('tabindex', isAccessible ? '0' : '-1');
    item.setAttribute('aria-disabled', isAccessible ? 'false' : 'true');
  });
}

function updateConnectors() {
  connectors.forEach((connector) => {
    if (!connector) return;
    const index = Number(connector.dataset.stepConnector);
    connector.classList.remove(...CONNECTOR_STATE_CLASSES);
    if (completedSteps.has(index)) {
      connector.classList.add('bg-emerald-500');
    } else if (activeStepIndex > index) {
      connector.classList.add('bg-blue-500');
    } else {
      connector.classList.add('bg-slate-200');
    }
  });
}

function updatePanels(nextIndex) {
  stepPanels.forEach((panel, index) => {
    if (!panel) return;
    panel.classList.remove(
      'relative',
      'absolute',
      'inset-0',
      'opacity-0',
      'opacity-100',
      'pointer-events-none',
      'pointer-events-auto',
      'translate-x-0',
      'translate-x-6',
      '-translate-x-6',
    );
    if (index === nextIndex) {
      panel.classList.add('relative', 'opacity-100', 'translate-x-0');
    } else {
      panel.classList.add('absolute', 'inset-0', 'opacity-0', 'pointer-events-none');
      panel.classList.add(index < nextIndex ? '-translate-x-6' : 'translate-x-6');
    }
  });
}

function goToStep(nextIndex) {
  const targetIndex = Math.max(0, Math.min(nextIndex, stepPanels.length - 1));
  activeStepIndex = targetIndex;
  updateStepItems();
  updateConnectors();
  updatePanels(targetIndex);
  refreshPanelHeight();
}

function markStepComplete(stepIndex) {
  completedSteps.add(stepIndex);
  updateStepItems();
  updateConnectors();
}

function resetStepsFrom(startIndex) {
  for (let i = startIndex; i < stepItems.length; i += 1) {
    completedSteps.delete(i);
  }
  updateStepItems();
  updateConnectors();
}

function setInstallStatus(text) {
  if (!installStatus) return;
  installStatus.textContent = text;
  refreshPanelHeight();
}

function updateOutput(element, text, state) {
  if (!element) return;
  applyStatusClasses(element, state);
  element.textContent = text;
  refreshPanelHeight();
}

function setConfigFormDisabled(disabled) {
  if (!configForm) return;
  const fields = configForm.querySelectorAll('input, button');
  fields.forEach((field) => {
    field.disabled = disabled;
  });
}

function buildOutputMessage(prefix, payload) {
  if (!payload) {
    return prefix;
  }
  const details = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  return `${prefix}\n${details}`;
}

async function checkPrereqs() {
  resetStepsFrom(0);
  goToStep(0);
  updateOutput(prereqOutput, 'Checking prerequisites...', 'loading');
  setConfigFormDisabled(true);

  try {
    const response = await fetch('/api/install/prereqs');
    if (response.status === 401 || response.status === 403) {
      alert('Please log in to continue.');
      updateOutput(prereqOutput, 'Authentication required. Please log in.', 'error');
      return;
    }

    const data = await response.json();
    if (data.ok) {
      const message = buildOutputMessage('Success:', data.output || data);
      updateOutput(prereqOutput, message, 'success');
      markStepComplete(0);
      resetStepsFrom(1);
      setInstallStatus('Waiting to start installation');
      updateOutput(
        installOutput,
        'Installation output will appear here once the process starts.',
        'neutral',
      );
      setConfigFormDisabled(false);
      goToStep(1);
      if (configForm && typeof configForm.adminEmail?.focus === 'function') {
        window.setTimeout(() => {
          configForm.adminEmail.focus();
        }, 200);
      }
    } else {
      const message = buildOutputMessage('Error:', data.output || data);
      updateOutput(prereqOutput, message, 'error');
    }
  } catch (error) {
    updateOutput(prereqOutput, `Error: ${error.message}`, 'error');
  }
}

async function handleInstall(event) {
  event.preventDefault();
  if (!completedSteps.has(0)) {
    goToStep(0);
    updateOutput(
      prereqOutput,
      'Please complete the prerequisite check before starting the installation.',
      'error',
    );
    return;
  }

  if (!configForm) return;

  const payload = {
    adminEmail: configForm.adminEmail.value,
    adminPassword: configForm.adminPassword.value,
  };

  setConfigFormDisabled(true);
  markStepComplete(1);
  resetStepsFrom(2);
  setInstallStatus('Running installation');
  updateOutput(installOutput, 'Running installation...', 'loading');
  goToStep(2);

  try {
    const response = await fetch('/api/install/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401 || response.status === 403) {
      alert('Please log in to continue.');
      updateOutput(installOutput, 'Authentication required. Please log in.', 'error');
      setInstallStatus('Authentication required');
      return;
    }

    const data = await response.json();
    if (data.ok) {
      const message = buildOutputMessage('Success:', data.output || data);
      updateOutput(installOutput, message, 'success');
      setInstallStatus('Installation completed successfully');
      markStepComplete(2);
    } else {
      const message = buildOutputMessage('Error:', data.output || data);
      updateOutput(installOutput, message, 'error');
      setInstallStatus('Installation failed. Review the output for details.');
    }
  } catch (error) {
    updateOutput(installOutput, `Error: ${error.message}`, 'error');
    setInstallStatus('Installation encountered an unexpected error.');
  } finally {
    setConfigFormDisabled(false);
  }
}

stepItems.forEach((item, index) => {
  item.addEventListener('click', () => {
    if (index <= activeStepIndex) {
      goToStep(index);
    }
  });

  item.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && index <= activeStepIndex) {
      event.preventDefault();
      goToStep(index);
    }
  });
});

if (checkBtn) {
  checkBtn.addEventListener('click', () => {
    checkPrereqs();
  });
}

if (configForm) {
  configForm.addEventListener('submit', handleInstall);
}

function init() {
  applyStatusClasses(prereqOutput, 'neutral');
  applyStatusClasses(installOutput, 'neutral');
  setConfigFormDisabled(true);
  goToStep(0);
  window.addEventListener('resize', refreshPanelHeight);
  checkPrereqs();
}

init();
