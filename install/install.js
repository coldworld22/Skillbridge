const progressBar = document.getElementById('progressBar');
const errorBox = document.getElementById('errorBox');

function setProgress(p) {
  if (!progressBar) return;
  const clamped = Math.max(0, Math.min(100, p));
  progressBar.style.width = `${clamped}%`;
  progressBar.setAttribute('aria-valuenow', String(clamped));
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
  output.textContent = 'Checking...';
  output.className = 'text-gray-600';
  clearError();
  setProgress(10);
  try {
    const res = await fetch('/api/install/prereqs');
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      output.textContent = 'Authentication required. Please log in.';
      output.classList.add('error');
      setProgress(0);
      showError('Please log in to continue.');
      return;
    }
    const data = await res.json();
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
      setProgress(0);
      showError('Prerequisite check failed. Review the output below.');
    }
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
    output.className = 'text-red-600';
    setProgress(0);
    showError('Error checking prerequisites: ' + err.message);
  }
}

document.getElementById('checkBtn').addEventListener('click', checkPrereqs);

window.addEventListener('DOMContentLoaded', checkPrereqs);

const form = document.getElementById('configForm');
const installBtn = document.getElementById('installBtn');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const out = document.getElementById('installOutput');
  out.textContent = 'Running install...';
  out.className = 'text-gray-600';
  installBtn.disabled = true;
  clearError();
  setProgress(75);
  const payload = {
    adminEmail: form.adminEmail.value,
    adminPassword: form.adminPassword.value,
  };
  try {
    const res = await fetch('/api/install/run', {
      method: 'POST',
    });
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      out.textContent = 'Authentication required. Please log in.';
      out.classList.add('error');
      setProgress(50);
      showError('Please log in to continue.');
      return;
    }
    const data = await res.json();
    out.textContent = (data.ok ? 'Success:\n' : 'Error:\n') + (data.output || JSON.stringify(data, null, 2));
    out.className = data.ok ? 'text-green-600' : 'text-red-600';
    if (data.ok) {
      setProgress(100);
      clearError();
    } else {
      setProgress(50);
      showError('Installation failed. Review the log below.');
    }
  } catch (err) {
    out.textContent = 'Error: ' + err.message;
    out.className = 'text-red-600';
    setProgress(50);
    showError('Error running install: ' + err.message);
  } finally {
    installBtn.disabled = false;
  }
});
