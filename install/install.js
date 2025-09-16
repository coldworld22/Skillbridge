const progressBar = document.getElementById('progressBar');
const errorBox = document.getElementById('errorBox');
const step2 = document.getElementById('step2');

const DEPENDENCY_LABELS = {
  node: 'Node.js (>= 18)',
  docker: 'Docker',
  dockerCompose: 'Docker Compose',
  git: 'Git',
};

const step2Section = document.getElementById('step2');

function setProgress(p) {
  if (!progressBar) {
    return;
  }
  const value = clampProgress(p);
  progressBar.style.width = `${value}%`;
  progressBar.setAttribute('aria-valuenow', `${value}`);
}

function showError(msg) {
  if (!errorBox) {
    return;
  }
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
}

function clearError() {
  if (!errorBox) {
    return;
  }
  errorBox.textContent = '';
  errorBox.classList.add('hidden');
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
  const output = document.getElementById('prereqOutput');
  output.removeAttribute('role');
  output.textContent = 'Checking...';
  output.className = 'mt-2 text-gray-600';
  try {
    const res = await fetch('/api/install/prereqs');
    setProgress(30);
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      output.textContent = 'Authentication required. Please log in.';
      output.className = 'mt-2 text-red-600';
      output.classList.add('error');
      step2Section.style.display = 'none';
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      output.className = 'mt-2 text-red-600';
      output.textContent = 'Error:\n' + (data.output || JSON.stringify(data, null, 2));
      step2Section.style.display = 'none';
      return;
    }
    const dependencyEntries = Object.entries(data).filter(
      ([key, value]) =>
        Object.prototype.hasOwnProperty.call(DEPENDENCY_LABELS, key) && typeof value === 'boolean'
    );

    if (dependencyEntries.length === 0) {
      output.className = 'mt-2 text-gray-600';
      output.textContent = 'Result:\n' + JSON.stringify(data, null, 2);
      step2Section.style.display = 'none';
      return;
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
    output.removeAttribute('role');
    output.textContent = 'Error: ' + err.message;
    output.className = 'mt-2 text-red-600';
    step2Section.style.display = 'none';
  }
}
const checkBtn = document.getElementById('checkBtn');
if (checkBtn) {
  checkBtn.addEventListener('click', checkPrereqs);
}

window.addEventListener('DOMContentLoaded', () => {
  setProgress(0);
  clearError();
  checkPrereqs();
});

window.addEventListener('DOMContentLoaded', () => {
  setProgress(0);
  checkPrereqs();
});
const form = document.getElementById('configForm');
const installBtn = document.getElementById('installBtn');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const out = document.getElementById('installOutput');
  out.textContent = 'Running install...';
  out.className = 'text-gray-600';
  installBtn.disabled = true;
  const payload = {
    adminEmail: form.adminEmail.value,
    adminPassword: form.adminPassword.value,
  };
  try {
    const res = await fetch('/api/install/run', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      out.textContent = 'Authentication required. Please log in.';
      out.classList.add('error');
      return;
    }
    const data = await res.json();
    const message = data.output || JSON.stringify(data, null, 2);
    if (data.ok) {
      out.textContent = 'Installation completed successfully.\n' + message;
      out.className = 'text-green-600';
    } else {
      out.textContent = 'Installation failed.\n' + message;
      out.className = 'text-red-600';
    }
  } catch (err) {
    out.textContent = 'Error: ' + err.message;
    out.className = 'text-red-600';
  } finally {
    installBtn.disabled = false;
  }
});
