
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const prereqStatus = document.getElementById('prereqStatus');
const prereqSummary = document.getElementById('prereqSummary');
const checkBtn = document.getElementById('checkBtn');

let step2Visible = false;

function setSummary(text, state = 'default') {
  if (!prereqSummary) return;
  const baseClasses = ['mt-2', 'text-sm'];
  prereqSummary.className = baseClasses.join(' ');
  if (state === 'success') {
    prereqSummary.classList.add('text-green-600');
  } else if (state === 'error') {
    prereqSummary.classList.add('text-red-600');
  } else {
    prereqSummary.classList.add('text-gray-600');
  }
  prereqSummary.textContent = text;
}

function renderRequirements(requirements) {
  if (!prereqStatus) return;
  prereqStatus.innerHTML = '';

  if (!Array.isArray(requirements) || requirements.length === 0) {
    return;
  }

  requirements.forEach((req) => {
    const isPass = (req.status || '').toLowerCase() === 'pass';
    const wrapper = document.createElement('div');
    const accent = isPass
      ? 'border-green-200 bg-green-50'
      : 'border-red-200 bg-red-50';
    wrapper.className = `flex items-start gap-3 rounded border p-3 ${accent}`;

    const iconContainer = document.createElement('span');
    iconContainer.className = `mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
      isPass ? 'border-green-300 bg-green-100 text-green-700' : 'border-red-300 bg-red-100 text-red-700'
    }`;

    const iconSymbol = document.createElement('span');
    iconSymbol.setAttribute('aria-hidden', 'true');
    iconSymbol.textContent = isPass ? '✓' : '✗';
    iconContainer.appendChild(iconSymbol);

    const srText = document.createElement('span');
    srText.className = 'sr-only';
    srText.textContent = isPass ? 'Requirement met' : 'Requirement not met';
    iconContainer.appendChild(srText);

    const textWrapper = document.createElement('div');
    textWrapper.className = 'flex-1 space-y-1';

    const title = document.createElement('p');
    title.className = 'font-medium text-gray-900';
    title.textContent = req.name || 'Requirement';
    textWrapper.appendChild(title);

    if (req.message) {
      const message = document.createElement('p');
      message.className = 'text-sm text-gray-700';
      message.textContent = req.message;
      textWrapper.appendChild(message);
    }

    wrapper.appendChild(iconContainer);
    wrapper.appendChild(textWrapper);
    prereqStatus.appendChild(wrapper);
  });
}

function showStep2() {
  if (!step1 || !step2 || step2Visible) return;
  step1.classList.remove('step-visible');
  step1.classList.add('step-hidden-left');
  step1.setAttribute('aria-hidden', 'true');

  step2.classList.remove('step-hidden-right');
  step2.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    step2.classList.add('step-visible');
  });

  step2Visible = true;
}

function hideStep2() {
  if (!step1 || !step2 || !step2Visible) return;

  step2.classList.remove('step-visible');
  step2.setAttribute('aria-hidden', 'true');
  requestAnimationFrame(() => {
    step2.classList.add('step-hidden-right');
  });

  step1.classList.remove('step-hidden-left');
  requestAnimationFrame(() => {
    step1.classList.add('step-visible');
  });
  step1.setAttribute('aria-hidden', 'false');

  step2Visible = false;
}
function renderChecklist(output, results, allPassed) {
  const requirements = [
    { key: 'node', label: 'Node.js (v18+)' },
    { key: 'docker', label: 'Docker' },
    { key: 'dockerCompose', label: 'Docker Compose' },
    { key: 'git', label: 'Git' },
  ];

  if (typeof output.replaceChildren === 'function') {
    output.replaceChildren();
  } else {
    while (output.firstChild) {
      output.removeChild(output.firstChild);
    }
  }
  output.className = 'mt-2 whitespace-pre-wrap';
  output.setAttribute('role', 'list');

  requirements.forEach((req) => {
    const status = (results && results[req.key]) || {};
    const passed = Boolean(status.passed);

    const item = document.createElement('span');
    item.classList.add('block', 'leading-6');
    item.setAttribute('role', 'listitem');

    const icon = document.createElement('span');
    icon.className = `${passed ? 'text-green-600' : 'text-red-600'} font-bold mr-2`;
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = passed ? '✔' : '✖';

    const label = document.createElement('span');
    label.classList.add('font-semibold');
    label.textContent = req.label;

    const message = document.createElement('span');
    message.classList.add('ml-2', 'text-gray-700');
    message.textContent =
      status.message || (passed ? 'Requirement satisfied.' : 'Requirement missing.');

    item.append(icon, label, message);
    output.appendChild(item);
  });

  const summary = document.createElement('span');
  summary.classList.add('block', 'mt-3', 'font-semibold', allPassed ? 'text-green-600' : 'text-red-600');
  summary.textContent = allPassed
    ? 'All prerequisites are satisfied.'
    : 'Please address the missing prerequisites before continuing.';
  output.appendChild(summary);
}

async function checkPrereqs() {
  if (!prereqStatus) return;

  prereqStatus.innerHTML = '';
  setSummary('Checking prerequisites...', 'default');

  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.classList.add('opacity-60', 'cursor-not-allowed');
  }

  try {
    const res = await fetch('/api/install/prereqs');
    setProgress(30);
    if (res.status === 401 || res.status === 403) {
      hideStep2();
      setSummary('Authentication required. Please log in.', 'error');
      return;
    }

    const data = await res.json();
    let parsedOutput = null;

    if (typeof data.output === 'string') {
      try {
        parsedOutput = JSON.parse(data.output);
      } catch (err) {
        parsedOutput = null;
      }
    }

    if (parsedOutput && Array.isArray(parsedOutput.requirements)) {
      renderRequirements(parsedOutput.requirements);
      const summaryText = parsedOutput.summary
        || (data.ok ? 'All prerequisites satisfied.' : 'Please address the issues above.');
      setSummary(summaryText, data.ok ? 'success' : 'error');
    } else {
      const pre = document.createElement('pre');
      pre.className = 'whitespace-pre-wrap rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800';
      pre.textContent = data.output || 'No output received.';
      prereqStatus.appendChild(pre);
      setSummary(
        data.ok
          ? 'All prerequisites satisfied.'
          : 'An unexpected error occurred while checking prerequisites.',
        data.ok ? 'success' : 'error',
      );
    }

    if (data.ok) {
      showStep2();
    } else {
      hideStep2();
    }

    const allPassing = dependencyEntries.every(([, value]) => value === true);
    const lines = dependencyEntries.map(([key, value]) => {
      const label = DEPENDENCY_LABELS[key];
      const icon = value ? '✅' : '❌';
      const colorClass = value ? 'text-green-600' : 'text-red-600';
      return `<span class="${colorClass}">${icon} ${label}</span>`;
    });

    output.className = 'mt-2';
    output.innerHTML = lines.join('<br />');
    step2Section.style.display = allPassing ? 'block' : 'none';
  } catch (err) {
    hideStep2();
    const errorMessage = document.createElement('p');
    errorMessage.className = 'text-sm text-red-600';
    errorMessage.textContent = `Error: ${err.message}`;
    prereqStatus.appendChild(errorMessage);
    setSummary('Unable to complete prerequisite check.', 'error');
  } finally {
    if (checkBtn) {
      checkBtn.disabled = false;
      checkBtn.classList.remove('opacity-60', 'cursor-not-allowed');
    }
  }
}
const checkBtn = document.getElementById('checkBtn');
if (checkBtn) {
  checkBtn.addEventListener('click', checkPrereqs);
}
if (checkBtn) {
  checkBtn.addEventListener('click', checkPrereqs);
}

window.addEventListener('DOMContentLoaded', checkPrereqs);

window.addEventListener('DOMContentLoaded', () => {
  setProgress(0);
  checkPrereqs();
});
const form = document.getElementById('configForm');
const installBtn = document.getElementById('installBtn');

if (form && installBtn) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = document.getElementById('installOutput');
    if (!out) return;

    out.textContent = 'Running install...';
    out.className = 'mt-2 text-gray-600';
    installBtn.disabled = true;

    try {
      const res = await fetch('/api/install/run', {
        method: 'POST',
      });
      if (res.status === 401 || res.status === 403) {
        alert('Please log in to continue.');
        out.textContent = 'Authentication required. Please log in.';
        out.className = 'mt-2 text-red-600';
        return;
      }
      const data = await res.json();
      out.textContent = `${data.ok ? 'Success:\n' : 'Error:\n'}${
        data.output || JSON.stringify(data, null, 2)
      }`;
      out.className = data.ok ? 'mt-2 text-green-600' : 'mt-2 text-red-600';
    } catch (err) {
      out.textContent = `Error: ${err.message}`;
      out.className = 'mt-2 text-red-600';
    } finally {
      installBtn.disabled = false;
    }
  });
}
