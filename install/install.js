const prereqOutput = document.getElementById('prereqOutput');
const checkBtn = document.getElementById('checkBtn');
const step2 = document.getElementById('step2');
const form = document.getElementById('configForm');
const installBtn = document.getElementById('installBtn');
const installOutput = document.getElementById('installOutput');

const { container: progressContainer, bar: progressBar } = (() => {
  let container = document.getElementById('progressContainer');
  let bar = document.getElementById('progressBar');
  if (!container || !bar) {
    container = document.createElement('div');
    container.id = 'progressContainer';
    container.className = 'w-full bg-gray-200 rounded h-2 mt-4 hidden overflow-hidden';
    bar = document.createElement('div');
    bar.id = 'progressBar';
    bar.className = 'h-2 w-0 bg-blue-500 transition-all duration-200';
    container.appendChild(bar);
    installOutput.parentNode.insertBefore(container, installOutput);
  }
  bar.style.width = '0%';
  return { container, bar };
})();

function setProgress(percent) {
  progressBar.style.width = `${percent}%`;
}

function setProgressColor(colorClass) {
  progressBar.classList.remove('bg-blue-500', 'bg-green-500', 'bg-red-500');
  progressBar.classList.add(colorClass);
}

let progressInterval;
function beginProgress() {
  clearInterval(progressInterval);
  progressContainer.classList.remove('hidden');
  setProgressColor('bg-blue-500');
  setProgress(5);
  progressInterval = setInterval(() => {
    const current = parseFloat(progressBar.style.width) || 0;
    if (current >= 95) {
      return;
    }
    setProgress(Math.min(current + Math.random() * 10, 95));
  }, 500);
}

function completeProgress(success) {
  clearInterval(progressInterval);
  setProgress(100);
  setProgressColor(success ? 'bg-green-500' : 'bg-red-500');
}

function resetProgress() {
  clearInterval(progressInterval);
  setProgress(0);
  setProgressColor('bg-blue-500');
  progressContainer.classList.add('hidden');
}

function updateButtonState(btn, disabled) {
  btn.disabled = disabled;
  btn.classList.toggle('opacity-50', disabled);
  btn.classList.toggle('cursor-not-allowed', disabled);
}

function disableFormControls() {
  Array.from(form.elements).forEach((el) => {
    el.disabled = true;
  });
}

function enableFormControls() {
  Array.from(form.elements).forEach((el) => {
    el.disabled = false;
  });
}

let installInProgress = false;
let installCompletedSuccessfully = false;

function lockInstallerUI() {
  installCompletedSuccessfully = true;
  disableFormControls();
  updateButtonState(installBtn, true);
  updateButtonState(checkBtn, true);
  step2.classList.add('opacity-50', 'pointer-events-none');
}

async function checkPrereqs() {
  const output = prereqOutput;
  output.textContent = 'Checking...';
  output.className = 'mt-2 text-gray-600 whitespace-pre-wrap';
  updateButtonState(checkBtn, true);

  try {
    const res = await fetch('/api/install/prereqs');
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      output.textContent = 'Authentication required. Please log in.';
      output.className = 'mt-2 text-red-600 whitespace-pre-wrap';
      step2.style.display = 'none';
      resetProgress();
      return;
    }
    const data = await res.json();
    if (data.ok) {
      output.className = 'mt-2 text-green-600 whitespace-pre-wrap';
      output.textContent = 'Success:\n' + (data.output || JSON.stringify(data, null, 2));
      step2.style.display = 'block';
      step2.classList.remove('opacity-50', 'pointer-events-none');
      if (!installCompletedSuccessfully && !installInProgress) {
        enableFormControls();
        const shouldInstall = confirm(
          'Prerequisite checks passed. Do you want to run the installation now?'
        );
        if (shouldInstall) {
          runInstall();
        }
      }
    } else {
      output.className = 'mt-2 text-red-600 whitespace-pre-wrap';
      output.textContent = 'Error:\n' + (data.output || JSON.stringify(data, null, 2));
      step2.style.display = 'none';
      resetProgress();
    }
  } catch (err) {
    output.textContent = 'Error: ' + err.message;
    output.className = 'mt-2 text-red-600 whitespace-pre-wrap';
    step2.style.display = 'none';
    resetProgress();
  } finally {
    if (!installInProgress && !installCompletedSuccessfully) {
      updateButtonState(checkBtn, false);
    }
  }
}

async function runInstall() {
  if (installInProgress || installCompletedSuccessfully) {
    return;
  }

  installInProgress = true;
  let success = false;

  updateButtonState(installBtn, true);
  updateButtonState(checkBtn, true);
  disableFormControls();

  const out = installOutput;
  out.textContent = 'Running install...';
  out.className = 'mt-2 text-gray-600 whitespace-pre-wrap';

  beginProgress();

  try {
    const res = await fetch('/api/install/run', { method: 'POST' });
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      out.textContent = 'Authentication required. Please log in.';
      out.className = 'mt-2 text-red-600 whitespace-pre-wrap';
    } else {
      const data = await res.json();
      success = Boolean(data.ok);
      out.textContent = (success ? 'Success:\n' : 'Error:\n') +
        (data.output || JSON.stringify(data, null, 2));
      out.className =
        'mt-2 ' + (success ? 'text-green-600' : 'text-red-600') + ' whitespace-pre-wrap';
    }
  } catch (err) {
    out.textContent = 'Error: ' + err.message;
    out.className = 'mt-2 text-red-600 whitespace-pre-wrap';
  } finally {
    completeProgress(success);
    installInProgress = false;

    if (success) {
      lockInstallerUI();
    } else if (!installCompletedSuccessfully) {
      enableFormControls();
      updateButtonState(installBtn, false);
      updateButtonState(checkBtn, false);
    }
  }
}

checkBtn.addEventListener('click', checkPrereqs);
window.addEventListener('DOMContentLoaded', checkPrereqs);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  runInstall();
});
