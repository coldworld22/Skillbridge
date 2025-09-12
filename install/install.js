async function checkPrereqs() {
  const output = document.getElementById('prereqOutput');
  output.textContent = 'Checking...';
  output.className = 'text-gray-600';
  try {
    const res = await fetch('/api/install/prereqs');
    const data = await res.json();
    if (data.ok) {
      output.className = 'text-green-600';
      output.textContent = 'Success:\n' + (data.output || JSON.stringify(data, null, 2));
      document.getElementById('step2').style.display = 'block';
    } else {
      output.className = 'text-red-600';
      output.textContent = 'Error:\n' + (data.output || JSON.stringify(data, null, 2));
      document.getElementById('step2').style.display = 'none';
    }
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
    output.className = 'text-red-600';
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
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
