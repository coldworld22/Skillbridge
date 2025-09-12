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
  output.className = 'info';
  try {
    const res = await fetch('/api/install/prereqs');
    const data = await res.json();
    const ok = data.ok !== undefined ? data.ok : res.ok;
    output.textContent = (ok ? '✅ ' : '❌ ') + (data.output || JSON.stringify(data, null, 2));
    output.className = ok ? 'success' : 'error';
    if (ok) {
      document.getElementById('step2').style.display = 'block';
    } else {
      document.getElementById('step2').classList.add('hidden');
    }
  } catch (err) {
    output.textContent = '❌ Error: ' + err.message;
    output.className = 'error';
    document.getElementById('step2').style.display = 'none';
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
    });
    const data = await res.json();
    const ok = data.ok !== undefined ? data.ok : res.ok;
    out.textContent = (ok ? '✅ ' : '❌ ') + (data.output || JSON.stringify(data, null, 2));
    out.className = ok ? 'success' : 'error';
  } catch (err) {
    out.textContent = '❌ Error: ' + err.message;
    out.className = 'error';
  }
});
