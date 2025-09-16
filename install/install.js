const progressBar = document.getElementById('progressBar');
const errorBox = document.getElementById('errorBox');
const step2Section = document.getElementById('step2');

function setProgress(p) {
  if (!progressBar) return;
  const value = Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : 0;
  progressBar.style.width = `${value}%`;
  progressBar.setAttribute('aria-valuenow', value.toString());
}

function showError(msg) {
  if (!errorBox) return;
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
}

function clearError() {
  if (!errorBox) return;
  errorBox.textContent = '';
  errorBox.classList.add('hidden');
}

async function checkPrereqs() {
  const output = document.getElementById('prereqOutput');
  if (!output) return;
  clearError();
  setProgress(5);
  output.textContent = 'Checking...';
  output.className = 'text-gray-600';
  try {
    const res = await fetch('/api/install/prereqs');
    setProgress(20);
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      output.textContent = 'Authentication required. Please log in.';
      output.classList.add('error');
      showError('Authentication required. Please log in to continue.');
      setProgress(0);
      return;
    }
    const data = await res.json();
    setProgress(35);
    if (data.ok) {
      output.className = 'text-green-600';
      output.textContent = 'Success:\n' + (data.output || JSON.stringify(data, null, 2));
      if (step2Section) {
        step2Section.style.display = 'block';
      }
      setProgress(50);
    } else {
      output.className = 'text-red-600';
      output.textContent = 'Error:\n' + (data.output || JSON.stringify(data, null, 2));
      if (step2Section) {
        step2Section.style.display = 'none';
      }
      showError('Prerequisite check failed. Review the details below.');
      setProgress(10);
    }
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
    output.className = 'text-red-600';
    showError(`Prerequisite check failed: ${err.message}`);
    setProgress(10);
  }
}

document.getElementById('checkBtn').addEventListener('click', checkPrereqs);

window.addEventListener('DOMContentLoaded', checkPrereqs);

const form = document.getElementById('configForm');
const installBtn = document.getElementById('installBtn');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const out = document.getElementById('installOutput');
  if (!out) return;
  clearError();
  setProgress(60);
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    setProgress(80);
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      out.textContent = 'Authentication required. Please log in.';
      out.classList.add('error');
      showError('Authentication required. Please log in to continue.');
      setProgress(60);
      return;
    }
    const data = await res.json();
    out.textContent = (data.ok ? 'Success:\n' : 'Error:\n') + (data.output || JSON.stringify(data, null, 2));
    out.className = data.ok ? 'text-green-600' : 'text-red-600';
    if (data.ok) {
      setProgress(100);
    } else {
      showError('Installation failed. Review the details below.');
      setProgress(60);
    }
  } catch (err) {
    out.textContent = 'Error: ' + err.message;
    out.className = 'text-red-600';
    showError(`Installation failed: ${err.message}`);
    setProgress(60);
  } finally {
    installBtn.disabled = false;
  }
});

setProgress(0);
clearError();
