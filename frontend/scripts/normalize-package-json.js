#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const targetPath = path.resolve(process.argv[2] || 'package.json');

const REPLACEMENTS = [
  { pattern: /\ufeff/g, replacement: '', description: 'byte order marks' },
  { pattern: /\u00a0/g, replacement: ' ', description: 'non-breaking spaces' },
  { pattern: /[\u200b\u200c\u200d\u2060]/g, replacement: '', description: 'zero-width characters' },
  { pattern: /[\u2028\u2029]/g, replacement: '\n', description: 'unicode line separators' },
  {
    pattern: /[^\x09\x0a\x0d\x20-\uffff]+/g,
    replacement: '',
    description: 'non-printable control characters',
  },
];

function sanitize(input) {
  let output = input;
  const applied = [];

  for (const { pattern, replacement, description } of REPLACEMENTS) {
    if (pattern.test(output)) {
      output = output.replace(pattern, replacement);
      applied.push(description);
    }
  }

  // Normalize Windows line endings for consistency.
  if (/\r\n?/.test(output)) {
    output = output.replace(/\r\n?/g, '\n');
    applied.push('carriage returns');
  }

  return { output, applied };
}

let raw;
try {
  raw = fs.readFileSync(targetPath, 'utf8');
} catch (error) {
  console.error(`Unable to read ${targetPath}:`, error.message);
  process.exitCode = 1;
  return;
}

const { output: cleaned, applied } = sanitize(raw);

function attemptStructuralRepairs(input) {
  let output = input;
  let scriptOverrides = null;

  const duplicateScriptsPattern = /("scripts"\s*:\s*{[\s\S]*?}\s*,\s*\n)(\s*"dev"\s*:\s*"[^"]*",?\s*\n\s*"build"\s*:\s*"[^"]*",?\s*\n\s*"start"\s*:\s*"[^"]*",?\s*\n\s*"lint"\s*:\s*"[^"]*",?\s*\n\s*"test"\s*:\s*"[^"]*"\s*,?\s*\n)(\s*},)/m;
  const redundantClosingPattern = /},\s*\n\s*},/m;

  const match = output.match(duplicateScriptsPattern);
  if (match) {
    const [, prefix, duplicateBlock, suffix] = match;
    scriptOverrides = {};
    const entryPattern = /"([^"]+)"\s*:\s*"([^"]*)"/g;
    let entryMatch;
    while ((entryMatch = entryPattern.exec(duplicateBlock)) !== null) {
      const [, key, value] = entryMatch;
      scriptOverrides[key] = value;
    }
    output = output.replace(duplicateScriptsPattern, `${prefix}${suffix}`);
  }

  if (redundantClosingPattern.test(output)) {
    output = output.replace(redundantClosingPattern, '},\n');
  }

  return { output, scriptOverrides };
}

let parsed;
let normalizedCandidate = cleaned;
let repairDetails = null;
try {
  parsed = JSON.parse(normalizedCandidate);
} catch (initialError) {
  repairDetails = attemptStructuralRepairs(cleaned);
  normalizedCandidate = repairDetails.output;
  if (normalizedCandidate !== cleaned) {
    try {
      parsed = JSON.parse(normalizedCandidate);
      if (repairDetails.scriptOverrides && parsed && typeof parsed === 'object') {
        parsed.scripts = {
          ...(parsed.scripts || {}),
          ...repairDetails.scriptOverrides,
        };
      }
      console.warn(
        `Applied structural repairs to ${path.basename(targetPath)} to resolve duplicated sections.`,
      );
    } catch (retryError) {
      console.error(`Failed to parse JSON from ${targetPath}.`);
      console.error('A sanitized preview of the file is shown below to aid debugging:\n');
      const preview = cleaned
        .split('\n')
        .slice(0, 20)
        .join('\n');
      console.error(preview);
      throw retryError;
    }
  } else {
    console.error(`Failed to parse JSON from ${targetPath}.`);
    console.error('A sanitized preview of the file is shown below to aid debugging:\n');
    const preview = cleaned
      .split('\n')
      .slice(0, 20)
      .join('\n');
    console.error(preview);
    throw initialError;
  }
}

const normalized = JSON.stringify(parsed, null, 2) + '\n';

if (normalized !== raw) {
  fs.writeFileSync(targetPath, normalized, 'utf8');
  if (applied.length > 0) {
    console.warn(`Normalized ${path.basename(targetPath)} by removing ${applied.join(', ')}.`);
  }
} else if (applied.length > 0) {
  // If sanitization changed the file but JSON formatting matched the original,
  // ensure the sanitized content is persisted.
  fs.writeFileSync(targetPath, cleaned, 'utf8');
  console.warn(`Sanitized ${path.basename(targetPath)} by removing ${applied.join(', ')}.`);
}
