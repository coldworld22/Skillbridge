const progressBar = document.getElementById('progressBar');
const errorBox = document.getElementById('errorBox');
const prereqOutput = document.getElementById('prereqOutput');
const prereqList = document.getElementById('prereqList');
const step2 = document.getElementById('step2');
const checkBtn = document.getElementById('checkBtn');
const form = document.getElementById('configForm');
const installBtn = document.getElementById('installBtn');
const installOutput = document.getElementById('installOutput');

function setProgress(value) {
  if (!progressBar) return;
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  progressBar.style.width = `${clamped}%`;
}

function showError(message) {
  if (!errorBox) {
    console.error(message);
    return;
  }
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
}

function clearError() {
  if (!errorBox) return;
  errorBox.textContent = '';
  errorBox.classList.add('hidden');
}

function toggleStep(stepElement, visible) {
  if (!stepElement) return;
  stepElement.classList.toggle('step-visible', visible);
  stepElement.classList.toggle('step-hidden', !visible);
  stepElement.setAttribute('aria-hidden', visible ? 'false' : 'true');
}

function renderRequirements(requirements = []) {
  if (!prereqList) return;
  prereqList.innerHTML = '';

  if (!requirements.length) {
    const item = document.createElement('li');
    item.className = 'text-sm text-gray-500';
    item.textContent = 'No requirement details were returned.';
    prereqList.appendChild(item);
    return;
  }

  requirements.forEach((req) => {
    const ok = req?.ok === true;
    const container = document.createElement('li');
    container.className = `flex gap-3 rounded border px-3 py-2 transition-colors duration-300 ${
      ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
    }`;

    const icon = document.createElement('span');
    icon.className = 'mt-0.5 text-xl';
    icon.textContent = ok ? '✅' : '❌';
    icon.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-1';

    const title = document.createElement('p');
    title.className = `font-semibold ${ok ? 'text-green-800' : 'text-red-800'}`;
    title.textContent = req?.name || req?.id || 'Requirement';

    const message = document.createElement('p');
    message.className = `text-sm ${ok ? 'text-green-700' : 'text-red-700'}`;
    message.textContent = req?.message || (ok ? 'Available' : 'Unavailable');

    content.appendChild(title);
    content.appendChild(message);

    if (req?.version) {
      const version = document.createElement('p');
      version.className = `text-xs ${ok ? 'text-green-600' : 'text-red-600'}`;
      version.textContent = `Version: ${req.version}`;
      content.appendChild(version);
    }

    container.appendChild(icon);
    container.appendChild(content);
    prereqList.appendChild(container);
  });
}

async function checkPrereqs() {
  clearError();
  toggleStep(step2, false);
  setProgress(10);

  if (prereqOutput) {
    prereqOutput.textContent = 'Checking prerequisites...';
    prereqOutput.className = 'text-sm text-gray-600';
  }
  if (prereqList) {
    prereqList.innerHTML = '';
  }

  try {
    const res = await fetch('/api/install/prereqs');
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(text.trim() || 'Unable to parse installer response.');
      }
    }

    if (res.status === 401 || res.status === 403) {
      const message = 'Authentication required. Please log in.';
      showError(message);
      if (prereqOutput) {
        prereqOutput.textContent = message;
        prereqOutput.className = 'text-sm text-red-700 font-medium';
      }
      setProgress(0);
      return;
    }

    if (!res.ok) {
      const message =
        (data && (data.error || data.output || data.message)) ||
        text.trim() ||
        'Failed to check prerequisites.';
      throw new Error(message);
    }

    if (!data || typeof data !== 'object') {
      throw new Error('Unexpected response from the installer service.');
    }

    const requirements = Array.isArray(data.requirements)
      ? data.requirements
      : [];
    renderRequirements(requirements);

    const requirementsOk =
      !requirements.length || requirements.every((req) => req?.ok === true);

    if (data.ok && requirementsOk) {
      if (prereqOutput) {
        prereqOutput.textContent = 'All prerequisites are satisfied.';
        prereqOutput.className = 'text-sm text-green-700 font-medium';
      }
      toggleStep(step2, true);
      setProgress(50);
    } else {
      if (prereqOutput) {
        prereqOutput.textContent =
          'Some prerequisites are missing or outdated. Please review the list above.';
        prereqOutput.className = 'text-sm text-red-700 font-medium';
      }
      toggleStep(step2, false);
      setProgress(25);
    }
  } catch (err) {
    if (prereqOutput) {
      prereqOutput.textContent = `Error: ${err.message}`;
      prereqOutput.className = 'text-sm text-red-700 font-medium';
    }
    showError(err.message);
    toggleStep(step2, false);
    setProgress(0);
  }
}

if (checkBtn) {
  checkBtn.addEventListener('click', (event) => {
    event.preventDefault();
    checkPrereqs();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setProgress(0);
  checkPrereqs();
});

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    if (installOutput) {
      installOutput.textContent = 'Running install...';
      installOutput.className = 'mt-4 whitespace-pre-wrap text-sm text-gray-600';
    }
    if (installBtn) {
      installBtn.disabled = true;
    }
    setProgress(75);

    try {
      const res = await fetch('/api/install/run', {
        method: 'POST',
      });

      if (res.status === 401 || res.status === 403) {
        const message = 'Authentication required. Please log in.';
        showError(message);
        if (installOutput) {
          installOutput.textContent = message;
          installOutput.className = 'mt-4 whitespace-pre-wrap text-sm text-red-700';
        }
        setProgress(50);
        return;
      }

      const data = await res.json();

      if (installOutput) {
        const prefix = data.ok ? 'Success:\n' : 'Error:\n';
        const details = data.output || JSON.stringify(data, null, 2);
        installOutput.textContent = `${prefix}${details}`;
        installOutput.className = `mt-4 whitespace-pre-wrap text-sm ${
          data.ok ? 'text-green-700' : 'text-red-700'
        }`;
      }

      if (data.ok) {
        clearError();
        setProgress(100);
      } else {
        showError('Install encountered errors.');
        setProgress(50);
      }
    } catch (err) {
      showError(err.message);
      if (installOutput) {
        installOutput.textContent = `Error: ${err.message}`;
        installOutput.className = 'mt-4 whitespace-pre-wrap text-sm text-red-700';
      }
      setProgress(50);
    } finally {
      if (installBtn) {
        installBtn.disabled = false;
      }
    }
  });
}
