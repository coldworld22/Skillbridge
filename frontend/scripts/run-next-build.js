#!/usr/bin/env node
'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');

const DEFAULT_MAX_OLD_SPACE =
  process.env.FRONTEND_MAX_OLD_SPACE_SIZE || '6144';
const env = { ...process.env };
const parsePositiveNumber = (value, fallback) => {
  const parsed = Number.parseFloat(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
};
const MINIFY_THRESHOLD_GIB = parsePositiveNumber(
  env.FRONTEND_MINIFY_MEMORY_THRESHOLD_GB,
  6,
);
const MINIFY_THRESHOLD_BYTES = MINIFY_THRESHOLD_GIB * 1024 * 1024 * 1024;
const CGROUP_V2_LIMIT = '/sys/fs/cgroup/memory.max';
const CGROUP_V1_LIMIT = '/sys/fs/cgroup/memory/memory.limit_in_bytes';

const readMemoryLimit = (filePath) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw || raw === 'max') {
      return undefined;
    }
    const limit = Number.parseInt(raw, 10);
    if (!Number.isFinite(limit) || limit <= 0) {
      return undefined;
    }
    const UNLIMITED_THRESHOLD = 2 ** 60;
    if (limit >= UNLIMITED_THRESHOLD) {
      return undefined;
    }
    return limit;
  } catch (error) {
    return undefined;
  }
};

const detectMemoryLimit = () =>
  readMemoryLimit(CGROUP_V2_LIMIT) ??
  readMemoryLimit(CGROUP_V1_LIMIT) ??
  os.totalmem();

const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return `${bytes}`;
  }
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = value >= 10 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
};

if (!env.NEXT_BUILD_WORKER_COUNT) {
  env.NEXT_BUILD_WORKER_COUNT = '1';
}

const disableMinifyValue = (env.FRONTEND_DISABLE_MINIFY || '').trim().toLowerCase();
const isAutoMinify =
  disableMinifyValue === '' || disableMinifyValue === 'auto';
const disableRequested =
  disableMinifyValue === '1' || disableMinifyValue === 'true';
const enableRequested =
  disableMinifyValue === '0' || disableMinifyValue === 'false';

if (isAutoMinify) {
  const availableMemory = detectMemoryLimit();
  if (
    Number.isFinite(availableMemory) &&
    availableMemory > 0 &&
    availableMemory < MINIFY_THRESHOLD_BYTES
  ) {
    env.FRONTEND_DISABLE_MINIFY = '1';
    console.warn(
      `[build] Detected only ${formatBytes(
        availableMemory,
      )} of memory. Automatically disabling Next.js minification.`,
    );
    console.warn(
      '[build] Set FRONTEND_DISABLE_MINIFY=0 to force minification when more RAM is available.',
    );
  } else {
    env.FRONTEND_DISABLE_MINIFY = '0';
  }
} else if (disableRequested) {
  env.FRONTEND_DISABLE_MINIFY = '1';
} else if (enableRequested) {
  env.FRONTEND_DISABLE_MINIFY = '0';
}

const heapFlag = `--max_old_space_size=${DEFAULT_MAX_OLD_SPACE}`;
const hasHeapFlag =
  typeof env.NODE_OPTIONS === 'string' &&
  env.NODE_OPTIONS.includes('--max_old_space_size');

if (!hasHeapFlag) {
  env.NODE_OPTIONS = env.NODE_OPTIONS
    ? `${env.NODE_OPTIONS} ${heapFlag}`
    : heapFlag;
  console.log(
    `[build] Using default heap limit ${heapFlag}. Set FRONTEND_MAX_OLD_SPACE_SIZE or NODE_OPTIONS to override.`,
  );
}

const nextBin = process.platform === 'win32' ? 'next.cmd' : 'next';
const child = spawn(nextBin, ['build'], {
  env,
  stdio: 'inherit',
});

child.on('close', (code, signal) => {
  if (code !== null) {
    process.exit(code);
    return;
  }
  console.error(`[build] next build exited due to signal ${signal}`);
  process.exit(1);
});

child.on('error', (error) => {
  console.error('[build] Failed to start next build:', error);
  process.exit(1);
});
