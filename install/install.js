async function checkPrereqs() {
  const output = document.getElementById('prereqOutput');
  output.textContent = 'Checking...';
  output.className = 'output';
  try {
    const res = await fetch('/api/install/prereqs');
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      output.textContent = 'Authentication required. Please log in.';
      output.classList.add('error');
      return;
    }
    const data = await res.json();
    output.textContent = data.output || JSON.stringify(data, null, 2);
    if (data.ok) {
      output.classList.add('success');
      document.getElementById('step2').style.display = 'block';
    } else {
      output.classList.add('error');
      document.getElementById('step2').style.display = 'none';
    }
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
    output.classList.add('error');
  }
}

document.getElementById('checkBtn').addEventListener('click', checkPrereqs);

window.addEventListener('DOMContentLoaded', checkPrereqs);

const form = document.getElementById('configForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const out = document.getElementById('installOutput');
  out.textContent = 'Running install...';
  out.className = 'output';
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
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      out.textContent = 'Authentication required. Please log in.';
      out.classList.add('error');
      return;
    }
    const data = await res.json();
    out.textContent = data.output || JSON.stringify(data, null, 2);
    if (res.ok && (data.ok === undefined || data.ok)) {
      out.classList.add('success');
    } else {
      out.classList.add('error');
    }
  } catch (err) {
    out.textContent = 'Error: ' + err.message;
    out.classList.add('error');
  }
});
