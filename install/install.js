const progressBar = document.getElementById('progressBar');
const errorBox = document.getElementById('errorBox');

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
  clearError();
  setProgress(10);
  try {
    const res = await fetch('/api/install/prereqs');
    const data = await res.json();
    output.textContent = data.output || JSON.stringify(data, null, 2);
    if (data.ok) {
      document.getElementById('step2').classList.remove('hidden');
      setProgress(50);
    } else {
      document.getElementById('step2').classList.add('hidden');
    }
  } catch (err) {
    showError(`Prerequisite check failed: ${err.message}`);
  }
}

document.getElementById('checkBtn').addEventListener('click', checkPrereqs);

window.addEventListener('DOMContentLoaded', checkPrereqs);

const installBtn = document.getElementById('installBtn');
installBtn.addEventListener('click', async () => {
  const out = document.getElementById('installOutput');
  out.textContent = 'Running install...';
  try {
    const res = await fetch('/api/install/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    out.textContent = data.output || JSON.stringify(data, null, 2);
    setProgress(100);
  } catch (err) {
    showError(`Install failed: ${err.message}`);
  }
});
