const progressBar = document.getElementById('progressBar');
const errorBox = document.getElementById('errorBox');

const DEPENDENCY_LABELS = {
  node: 'Node.js (>= 18)',
  docker: 'Docker',
  dockerCompose: 'Docker Compose',
  git: 'Git',
};

const step2Section = document.getElementById('step2');

function setProgress(p) {
  progressBar.style.width = `${p}%`;
}

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove('hidden');
}

function clearError() {
  errorBox.textContent = '';
  errorBox.classList.add('hidden');
}

async function checkPrereqs() {
  const output = document.getElementById('prereqOutput');
  output.textContent = 'Checking...';
  output.className = 'mt-2 text-gray-600';
  try {
    const res = await fetch('/api/install/prereqs');
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
    output.textContent = 'Error: ' + err.message;
    output.className = 'mt-2 text-red-600';
    step2Section.style.display = 'none';
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
      return;
    }
    const data = await res.json();
    out.textContent = (data.ok ? 'Success:\n' : 'Error:\n') + (data.output || JSON.stringify(data, null, 2));
    out.className = data.ok ? 'text-green-600' : 'text-red-600';
  } catch (err) {
    out.textContent = 'Error: ' + err.message;
    out.className = 'text-red-600';
  } finally {
    installBtn.disabled = false;
  }
});
