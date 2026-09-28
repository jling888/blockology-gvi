import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const manifestPath = resolve(root, 'release/REPRODUCIBILITY_MANIFEST.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const mismatches = [];
const canonicalLines = [];

for (const item of manifest.integrity.protected_files) {
  const path = resolve(root, item.path);
  let content;
  try {
    content = readFileSync(path);
  } catch (error) {
    mismatches.push({ path: item.path, error: 'MISSING_FILE' });
    continue;
  }
  const digest = createHash('sha256').update(content).digest('hex');
  canonicalLines.push(`${item.path}\t${digest}`);
  if (digest !== item.sha256) {
    mismatches.push({ path: item.path, expected: item.sha256, actual: digest });
  }
}

canonicalLines.sort();
const rootHash = createHash('sha256').update(canonicalLines.join('\n') + '\n').digest('hex');
if (rootHash !== manifest.integrity.integrity_root_sha256) {
  mismatches.push({
    path: 'INTEGRITY_ROOT',
    expected: manifest.integrity.integrity_root_sha256,
    actual: rootHash,
  });
}

const result = {
  release: manifest.release.release_label,
  protectedFileCount: manifest.integrity.protected_files.length,
  integrityRootSha256: rootHash,
  passed: mismatches.length === 0,
  mismatches,
};
console.log(JSON.stringify(result, null, 2));
process.exit(result.passed ? 0 : 1);
