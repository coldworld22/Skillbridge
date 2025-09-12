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
      document.getElementById('step2').style.display = 'none';
    }
  } catch (err) {
    output.textContent = '❌ Error: ' + err.message;
    output.className = 'error';
    document.getElementById('step2').style.display = 'none';
  }
}

document.getElementById('checkBtn').addEventListener('click', checkPrereqs);

window.addEventListener('DOMContentLoaded', checkPrereqs);

const form = document.getElementById('configForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const out = document.getElementById('installOutput');
  out.textContent = 'Running install...';
  out.className = 'info';
  const payload = {
    adminEmail: form.adminEmail.value,
    adminPassword: form.adminPassword.value,
  };
  try {
    const res = await fetch('/api/install/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
