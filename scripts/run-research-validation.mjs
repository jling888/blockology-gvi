import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const outDir = resolve(root, '.release-validation');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const compile = spawnSync('tsc', [
  '-p', 'tsconfig.validation.emit.json',
  '--outDir', outDir,
], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });

if (compile.status !== 0) {
  console.error('RESEARCH VALIDATION COMPILE FAILED');
  process.exit(compile.status ?? 1);
}

writeFileSync(resolve(outDir, 'package.json'), '{"type":"commonjs"}\n');
const require = createRequire(import.meta.url);
const validation = require(resolve(outDir, 'data/teamRepository/teamRepositoryValidation.js'));
const summary = validation.runAllRepositoryBridgeValidationTests();
const compact = {
  allPassed: summary.allPassed,
  totalTests: summary.totalTests,
  passCount: summary.passCount,
  failCount: summary.failCount,
  status: summary.status,
};
console.log(JSON.stringify(compact, null, 2));
rmSync(outDir, { recursive: true, force: true });
process.exit(summary.allPassed ? 0 : 1);
