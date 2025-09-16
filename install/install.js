const progressBar = document.getElementById('progressBar');
const errorBox = document.getElementById('errorBox');
const step2Section = document.getElementById('step2');

function clampProgress(value) {
  if (typeof value !== 'number') {
    const parsed = parseFloat(value);
    value = Number.isNaN(parsed) ? 0 : parsed;
  }
  return Math.min(100, Math.max(0, value));
}

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
  const output = document.getElementById('prereqOutput');
  clearError();
  setProgress(10);
  output.textContent = 'Checking...';
  output.className = 'text-gray-600';
  try {
    const res = await fetch('/api/install/prereqs');
    setProgress(30);
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      output.textContent = 'Authentication required. Please log in.';
      output.classList.add('error');
      showError('Authentication required. Please log in.');
      return;
    }
    const data = await res.json();
    setProgress(45);
    if (data.ok) {
      output.className = 'text-green-600';
      output.textContent = 'Success:\n' + (data.output || JSON.stringify(data, null, 2));
      document.getElementById('step2').style.display = 'block';
      setProgress(50);
      clearError();
    } else {
      output.className = 'text-red-600';
      output.textContent = 'Error:\n' + (data.output || JSON.stringify(data, null, 2));
      document.getElementById('step2').style.display = 'none';
      setProgress(15);
      showError('Prerequisite check failed. Review the details below.');
    }
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
    output.className = 'text-red-600';
    setProgress(0);
    showError('Prerequisite check failed: ' + err.message);
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

if (form && installBtn) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = document.getElementById('installOutput');
    clearError();
    setProgress(65);
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
      });
      setProgress(80);
      if (res.status === 401 || res.status === 403) {
        alert('Please log in to continue.');
        out.textContent = 'Authentication required. Please log in.';
        out.classList.add('error');
        showError('Authentication required. Please log in.');
        return;
      }
      const data = await res.json();
      out.textContent = (data.ok ? 'Success:\n' : 'Error:\n') + (data.output || JSON.stringify(data, null, 2));
      out.className = data.ok ? 'text-green-600' : 'text-red-600';
      if (data.ok) {
        setProgress(100);
        clearError();
      } else {
        setProgress(65);
        showError('Installation failed. Review the output below.');
      }
    } catch (err) {
      out.textContent = 'Error: ' + err.message;
      out.className = 'text-red-600';
      setProgress(50);
      showError('Installation failed: ' + err.message);
    } finally {
      installBtn.disabled = false;
    }
  });
}
