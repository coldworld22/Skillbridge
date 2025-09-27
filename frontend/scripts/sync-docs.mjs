import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const docsCandidates = [
  path.resolve(projectRoot, 'docs'),
  path.resolve(projectRoot, '..', 'docs'),
  path.resolve(projectRoot, '..', '..', 'docs'),
];

const destinationDir = path.join(projectRoot, 'public', 'docs');

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDestinationParent() {
  const parentDir = path.dirname(destinationDir);
  await fs.mkdir(parentDir, { recursive: true });
}

async function copyDocs(sourceDir) {
  await ensureDestinationParent();
  await fs.rm(destinationDir, { recursive: true, force: true });
  await fs.cp(sourceDir, destinationDir, { recursive: true });
}

async function main() {
  for (const candidate of docsCandidates) {
    if (await pathExists(candidate)) {
      await copyDocs(candidate);
      console.log(`Copied documentation from "${candidate}" to "${destinationDir}".`);
      return;
    }
  }

  console.warn(
    'No documentation directory found. Skipping docs sync. Ensure the repository docs/ directory is available.'
  );
}

main().catch((error) => {
  console.error('Failed to copy documentation into the Next.js public directory:', error);
  process.exitCode = 1;
});
