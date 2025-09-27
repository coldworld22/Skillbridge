import fs from 'fs/promises';
import path from 'path';

const DEFAULT_DOCS_DIR_NAME = 'docs';
const DEFAULT_MAX_DEPTH = 8;

function resolveModuleDirectory(moduleDirectory) {
  if (moduleDirectory) {
    return moduleDirectory;
  }

  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }

  return process.cwd();
}

export function buildDefaultDocsExplicitPaths(moduleDirectory) {
  const moduleDir = resolveModuleDirectory(moduleDirectory);

  return [
    path.join(process.cwd(), 'docs'),
    path.join(process.cwd(), '..', 'docs'),
    path.join(process.cwd(), '..', '..', 'docs'),
    path.join(process.cwd(), '..', '..', '..', 'docs'),
    path.resolve(moduleDir, '../../docs'),
    path.resolve(moduleDir, '../../../docs'),
    path.resolve(moduleDir, '../../../..', 'docs'),
  ];
}

function addCandidate(candidates, value) {
  if (!value) {
    return;
  }

  candidates.add(path.resolve(value));
}

function collectCandidatesFromStartDir(startDir, docsDirName, maxDepth, candidates) {
  if (!startDir) {
    return;
  }

  let current = path.resolve(startDir);
  for (let depth = 0; depth <= maxDepth; depth += 1) {
    addCandidate(candidates, path.join(current, docsDirName));

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }

    current = parent;
  }
}

export function computeDocsDirCandidates({
  startDirs = [],
  docsDirName = DEFAULT_DOCS_DIR_NAME,
  maxDepth = DEFAULT_MAX_DEPTH,
  explicitPaths = [],
  moduleDirectory,
} = {}) {
  const candidates = new Set();

  const envPaths = [
    process.env.DOCS_BASE_PATH,
    process.env.DOCS_DIRECTORY,
    process.env.DOCS_DIR,
  ];

  [...explicitPaths, ...envPaths].forEach((candidate) => addCandidate(candidates, candidate));

  const fallbackModuleDir = resolveModuleDirectory(moduleDirectory);
  const allStartDirs = [
    ...startDirs,
    process.cwd(),
    fallbackModuleDir,
  ];

  allStartDirs.forEach((startDir) => {
    collectCandidatesFromStartDir(startDir, docsDirName, maxDepth, candidates);
  });

  return Array.from(candidates);
}

export async function resolveDocsDirectory(options = {}) {
  const candidates = computeDocsDirCandidates(options);

  for (const candidate of candidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) {
        return candidate;
      }
    } catch (error) {
      // Ignore missing paths and continue searching other candidates.
    }
  }

  return null;
}

export const DOCS_DIRECTORY_DEFAULTS = {
  docsDirName: DEFAULT_DOCS_DIR_NAME,
  maxDepth: DEFAULT_MAX_DEPTH,
};
