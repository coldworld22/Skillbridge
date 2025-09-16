const summaryEl = document.getElementById('prereqOutput');
const prereqList = document.getElementById('prereqList');
const step2 = document.getElementById('step2');
const SUMMARY_BASE_CLASS = 'mt-2 text-sm';

const PREREQUISITES = {
  node: {
    label: 'Node.js 18+',
    defaultError: 'Node.js 18 or newer is required for the SkillBridge toolchain.',
    guidance:
      'Install the active LTS release or use a version manager such as nvm to provide Node.js 18.',
    upgrade: 'Update Node.js to version 18 or newer, then rerun the prerequisite check.',
    resources: [
      { href: 'https://nodejs.org/en/download', label: 'Download Node.js' },
      { href: 'https://github.com/nvm-sh/nvm', label: 'Install nvm' },
    ],
  },
  docker: {
    label: 'Docker',
    defaultError: 'Docker must be installed to run SkillBridge services locally.',
    guidance:
      'Install Docker Desktop (macOS/Windows) or Docker Engine (Linux) before continuing.',
    resources: [{ href: 'https://docs.docker.com/get-docker/', label: 'Install Docker' }],
  },
  dockerCompose: {
    label: 'Docker Compose v2',
    defaultError: 'Docker Compose is required to orchestrate the application containers.',
    guidance:
      'Enable the Docker Compose plugin or install the standalone docker-compose binary.',
    resources: [
      { href: 'https://docs.docker.com/compose/install/', label: 'Install Docker Compose' },
    ],
  },
  git: {
    label: 'Git',
    defaultError: 'Git is required to manage SkillBridge source code.',
    guidance:
      'Install Git using your system package manager or from the official downloads page.',
    resources: [{ href: 'https://git-scm.com/downloads', label: 'Install Git' }],
  },
};

const STATUS_LABELS = {
  ok: 'Ready',
  missing: 'Not installed',
  version_too_old: 'Update required',
  unknown: 'Check required',
};

function statusLabel(status) {
  return STATUS_LABELS[status] || STATUS_LABELS.unknown;
}

function updateSummary(message, toneClass) {
  if (!summaryEl) return;
  summaryEl.textContent = message;
  summaryEl.className = `${SUMMARY_BASE_CLASS} ${toneClass}`;
}

function setStep2Visible(visible) {
  if (!step2) return;
  step2.style.display = visible ? 'block' : 'none';
  step2.setAttribute('aria-hidden', visible ? 'false' : 'true');
}

function appendResourceLinks(container, resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return;
  }

  const list = document.createElement('div');
  list.className = 'mt-2 flex flex-wrap gap-3 text-sm';

  resources.forEach((resource) => {
    if (!resource || !resource.href || !resource.label) {
      return;
    }

    const link = document.createElement('a');
    link.href = resource.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'text-blue-600 underline';
    link.textContent = resource.label;
    list.appendChild(link);
  });

  if (list.childNodes.length > 0) {
    container.appendChild(list);
  }
}

function renderPrereqStatus(data) {
  if (!prereqList) return;

  const details = (data && data.details) || {};
  const errors = (data && data.errors) || {};

  prereqList.innerHTML = '';

  Object.entries(PREREQUISITES).forEach(([key, meta]) => {
    const status = details[key] || (data && data.ok ? 'ok' : 'unknown');
    const isOk = status === 'ok';

    const card = document.createElement('div');
    card.className = `rounded-md border p-4 shadow-sm transition-colors ${
      isOk ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-300 bg-amber-50 text-amber-800'
    }`;

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between';

    const title = document.createElement('span');
    title.className = 'font-medium';
    title.textContent = meta.label;

    const statusText = document.createElement('span');
    statusText.className = `text-sm font-medium ${isOk ? 'text-green-700' : 'text-amber-700'}`;
    statusText.textContent = statusLabel(status);

    header.appendChild(title);
    header.appendChild(statusText);
    card.appendChild(header);

    if (!isOk) {
      const message = document.createElement('p');
      message.className = 'mt-2 text-sm font-medium';
      message.textContent = errors[key] || meta.defaultError;
      card.appendChild(message);

      const guidanceText = status === 'version_too_old' && meta.upgrade ? meta.upgrade : meta.guidance;
      if (guidanceText) {
        const guidance = document.createElement('p');
        guidance.className = 'mt-1 text-sm';
        guidance.textContent = guidanceText;
        card.appendChild(guidance);
      }

      appendResourceLinks(card, meta.resources);
    }

    prereqList.appendChild(card);
  });
}

async function checkPrereqs() {
  updateSummary('Checking prerequisites...', 'text-gray-600');
  if (prereqList) {
    prereqList.innerHTML = '<p class="text-sm text-gray-500">Running checks...</p>';
  }
  setStep2Visible(false);

  try {
    const res = await fetch('/api/install/prereqs');
    if (res.status === 401 || res.status === 403) {
      alert('Please log in to continue.');
      updateSummary('Authentication required. Please log in.', 'text-red-600');
      if (prereqList) {
        prereqList.innerHTML = '';
      }
      return;
    }

    const data = await res.json();
    renderPrereqStatus(data);

    if (data.ok) {
      updateSummary('All prerequisite checks passed. Continue to configuration.', 'text-green-600');
      setStep2Visible(true);
    } else {
      const tone = res.ok ? 'text-amber-700' : 'text-red-600';
      const message = res.ok
        ? 'Resolve the highlighted prerequisites before continuing.'
        : data.output
        ? `Prerequisite check failed: ${data.output}`
        : 'Prerequisite check failed. Review the highlighted items for details.';
      updateSummary(message, tone);
      setStep2Visible(false);
    }
  } catch (err) {
    updateSummary(`Error checking prerequisites: ${err.message}`, 'text-red-600');
    if (prereqList) {
      prereqList.innerHTML = '';
    }
    setStep2Visible(false);
  }
}

if (document.getElementById('checkBtn')) {
  document.getElementById('checkBtn').addEventListener('click', checkPrereqs);
}

window.addEventListener('DOMContentLoaded', checkPrereqs);

const form = document.getElementById('configForm');
const installBtn = document.getElementById('installBtn');

if (form && installBtn) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const out = document.getElementById('installOutput');
    if (out) {
      out.textContent = 'Running install...';
      out.className = 'text-gray-600';
    }
    installBtn.disabled = true;

    try {
      const res = await fetch('/api/install/run', {
        method: 'POST',
      });
      if (res.status === 401 || res.status === 403) {
        alert('Please log in to continue.');
        if (out) {
          out.textContent = 'Authentication required. Please log in.';
          out.classList.add('error');
        }
        return;
      }
      const data = await res.json();
      if (out) {
        out.textContent = (data.ok ? 'Success:\n' : 'Error:\n') + (data.output || JSON.stringify(data, null, 2));
        out.className = data.ok ? 'text-green-600' : 'text-red-600';
      }
    } catch (err) {
      if (out) {
        out.textContent = 'Error: ' + err.message;
        out.className = 'text-red-600';
      }
    } finally {
      installBtn.disabled = false;
    }
  });
}
