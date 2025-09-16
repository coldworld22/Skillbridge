const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const progressStatus = document.getElementById('progressStatus');
const checkBtn = document.getElementById('checkBtn');
const step2 = document.getElementById('step2');
const form = document.getElementById('configForm');
const installBtn = document.getElementById('installBtn');
const installOutput = document.getElementById('installOutput');

let installInProgress = false;
let installCompleted = false;
let progressIntervalId;

function setProgress(p) {
  if (progressBar) {
    progressBar.style.width = `${p}%`;
  }
  if (progressContainer) {
    progressContainer.setAttribute('aria-valuenow', String(Math.round(p)));
  }
}

function hideProgress() {
  clearInterval(progressIntervalId);
  progressIntervalId = undefined;
  setProgress(0);
  if (progressContainer) {
    progressContainer.classList.add('hidden');
    progressContainer.setAttribute('aria-valuenow', '0');
  }
  if (progressStatus) {
    progressStatus.textContent = '';
    progressStatus.className = 'mt-2 text-sm text-gray-600 hidden';
  }
}

function startProgress(statusText) {
  if (progressContainer) {
    progressContainer.classList.remove('hidden');
  }
  setProgress(10);
  if (progressStatus) {
    progressStatus.textContent = statusText;
    progressStatus.className = 'mt-2 text-sm text-gray-600';
  }
  clearInterval(progressIntervalId);
  let current = 10;
  progressIntervalId = setInterval(() => {
    current = Math.min(current + Math.random() * 10, 95);
    setProgress(current);
  }, 500);
}

function completeProgress(success) {
  clearInterval(progressIntervalId);
  progressIntervalId = undefined;
  setProgress(100);
  if (progressStatus) {
    progressStatus.textContent = success
      ? 'Installation complete.'
      : 'Installation failed.';
    progressStatus.className = success
      ? 'mt-2 text-sm text-green-600'
      : 'mt-2 text-sm text-red-600';
  }
}

function disableInstallerInterface() {
  if (installBtn) {
    installBtn.disabled = true;
    installBtn.classList.add('cursor-not-allowed', 'opacity-60');
  }
  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.classList.add('cursor-not-allowed', 'opacity-60');
  }
  if (form) {
    Array.from(form.elements).forEach((el) => {
      el.disabled = true;
    });
  }
  if (step2) {
    step2.classList.add('opacity-60');
  }
}

async function checkPrereqs() {
  const output = document.getElementById('prereqOutput');
  if (!output) return;
  output.textContent = 'Checking...';
  output.className = 'text-gray-600';
  try {
    const response = await fetch('/api/install/prereqs');
    if (response.status === 401 || response.status === 403) {
      alert('Please log in to continue.');
      output.textContent = 'Authentication required. Please log in.';
      output.className = 'text-red-600';
      return;
    }

    const data = await response.json();
    if (data.ok) {
      output.className = 'text-green-600';
      output.textContent = 'Success:\n' + (data.output || JSON.stringify(data, null, 2));
      if (step2) {
        step2.style.display = 'block';
      }
      if (!installInProgress && !installCompleted) {
        const confirmationMessage =
          form && form.adminEmail?.value && form.adminPassword?.value
            ? 'Prerequisite checks passed. Start the installation now?'
            : 'Prerequisite checks passed. Start the installation now? You can cancel to adjust configuration values first.';
        if (window.confirm(confirmationMessage)) {
          runInstall();
        }
      }
    } else {
      output.className = 'text-red-600';
      output.textContent = 'Error:\n' + (data.output || JSON.stringify(data, null, 2));
      if (step2) {
        step2.style.display = 'none';
      }
    }
  } catch (error) {
    updateOutput(prereqOutput, `Error: ${error.message}`, 'error');
  }
}

if (checkBtn) {
  checkBtn.addEventListener('click', checkPrereqs);
}

  if (!configForm) return;


async function runInstall() {
  if (installInProgress || installCompleted) {
    return;
  }
  if (!form || !form.reportValidity()) {
    return;
  }
  installInProgress = true;
  if (installBtn) {
    installBtn.disabled = true;
  }
  if (checkBtn) {
    checkBtn.disabled = true;
  }
  if (installOutput) {
    installOutput.textContent = 'Running install...';
    installOutput.className = 'mt-2 text-gray-600';
  }
  startProgress('Running install.sh...');

  let shouldDisable = false;
  try {
    const response = await fetch('/api/install/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 401 || response.status === 403) {
      alert('Please log in to continue.');
      if (installOutput) {
        installOutput.textContent = 'Authentication required. Please log in.';
        installOutput.className = 'mt-2 text-red-600';
      }
      hideProgress();
      return;
    }
    const data = await res.json();
    const success = Boolean(data.ok);
    if (installOutput) {
      installOutput.textContent =
        (success ? 'Success:\n' : 'Error:\n') +
        (data.output || JSON.stringify(data, null, 2));
      installOutput.className = success
        ? 'mt-2 text-green-600'
        : 'mt-2 text-red-600';
    }
    completeProgress(success);
    shouldDisable = true;
  } catch (err) {
    if (installOutput) {
      installOutput.textContent = 'Error: ' + err.message;
      installOutput.className = 'mt-2 text-red-600';
    }
    completeProgress(false);
    shouldDisable = true;
  } finally {
    installInProgress = false;
    if (shouldDisable) {
      installCompleted = true;
      disableInstallerInterface();
    } else {
      if (installBtn) {
        installBtn.disabled = false;
        installBtn.classList.remove('opacity-60', 'cursor-not-allowed');
      }
      if (checkBtn) {
        checkBtn.disabled = false;
        checkBtn.classList.remove('opacity-60', 'cursor-not-allowed');
      }
    }
  }
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    runInstall();
  });
}
