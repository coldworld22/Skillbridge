async function checkPrereqs() {
  const output = document.getElementById('prereqOutput');
  output.textContent = 'Checking...';
  try {
    const res = await fetch('/api/install/prereqs');
    const data = await res.json();
    output.textContent = data.output || JSON.stringify(data, null, 2);
    if (data.ok) {
      document.getElementById('step2').style.display = 'block';
    } else {
      document.getElementById('step2').style.display = 'none';
    }
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
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
  } catch (err) {
    out.textContent = 'Error: ' + err.message;
  }
});
