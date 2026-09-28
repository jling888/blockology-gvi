#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const imageArg = args.find((arg) => !arg.startsWith('--'));
const runsArg = args.find((arg) => arg.startsWith('--runs='));
const repeatVm = args.includes('--repeat-vm');
const baseArg = args.find((arg) => arg.startsWith('--base='));
const fieldTolArg = args.find((arg) => arg.startsWith('--field-tol='));
const scoreTolArg = args.find((arg) => arg.startsWith('--score-tol='));
const probTolArg = args.find((arg) => arg.startsWith('--prob-tol='));

if (!imageArg) {
  console.error('Usage: npm run validate:p4.1:live -- <image.jpg> [--runs=3] [--repeat-vm] [--base=http://127.0.0.1:3000]');
  process.exit(2);
}

const imagePath = path.resolve(imageArg);
if (!fs.existsSync(imagePath)) {
  console.error(`Image not found: ${imagePath}`);
  process.exit(2);
}

const ext = path.extname(imagePath).toLowerCase();
const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
const imageBase64 = fs.readFileSync(imagePath).toString('base64');
const imageFilename = path.basename(imagePath);
const runs = Math.max(2, Number(runsArg?.split('=')[1] || 3));
const base = (baseArg?.split('=')[1] || process.env.PUBLIC_APP_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const fieldTolerance = Number(fieldTolArg?.split('=')[1] || process.env.P4_1_FIELD_TOLERANCE || 1e-6);
const scoreTolerance = Number(scoreTolArg?.split('=')[1] || process.env.P4_1_SCORE_TOLERANCE || 1e-6);
const probabilityTolerance = Number(probTolArg?.split('=')[1] || process.env.P4_1_PROBABILITY_TOLERANCE || 1e-6);

async function postJson(route, payload) {
  const response = await fetch(`${base}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error(`${route} returned non-JSON HTTP ${response.status}`);
  }
  if (!response.ok || body?.success !== true) {
    throw new Error(`${route} failed HTTP ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

function requestId(kind, i) {
  return `p4_1_live_stability_${kind}_${Date.now()}_${i}`;
}

async function runVm(i) {
  return postJson('/api/public/vm/analyze', {
    requestId: requestId('vm', i),
    imageBase64,
    imageMimeType: mime,
    imageFilename,
  });
}

async function runVlm(i) {
  return postJson('/api/public/vlm/analyze', {
    requestId: requestId('vlm', i),
    imageBase64,
    imageMimeType: mime,
    imageFilename,
  });
}

async function runSim(i, vm, vlm) {
  return postJson('/api/public/sim/analyze', {
    requestId: requestId('sim', i),
    vmReceipt: {
      requestId: vm.requestId,
      stage: vm.stage,
      contractVersion: vm.provenance.contractVersion,
      taxonomyVersion: vm.segmentation.taxonomyVersion,
      repository: vm.provenance.repository,
      commit: vm.provenance.commit,
    },
    vlmResult: vlm,
  });
}

function fieldMap(vlm) {
  return new Map(vlm.fields.map((field) => [field.fieldId, field]));
}

function maxAbs(values) {
  return values.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
}

console.log('P4.1 PUBLIC LIVE STABILITY AUDIT');
console.log(`image: ${imagePath}`);
console.log(`runs: ${runs}`);
console.log(`repeat VM each run: ${repeatVm}`);
console.log(`base: ${base}`);
console.log(`engineering tolerances (not manuscript thresholds): field=${fieldTolerance}, probability=${probabilityTolerance}, score=${scoreTolerance}\n`);

try {
  let sharedVm = null;
  if (!repeatVm) {
    console.log('Running source-backed VM once for the end-to-end evidence receipt...');
    sharedVm = await runVm(0);
  }

  const records = [];
  for (let i = 0; i < runs; i += 1) {
    console.log(`Run ${i + 1}/${runs}: ${repeatVm ? 'VM → ' : ''}Qwen → frozen SIM`);
    const vm = repeatVm ? await runVm(i + 1) : sharedVm;
    const vlm = await runVlm(i + 1);
    const sim = await runSim(i + 1, vm, vlm);

    if (sim.validation?.validationClass !== 'PUBLIC_SINGLE_PHOTO_LIVE') {
      throw new Error(`Unexpected validation class: ${sim.validation?.validationClass}`);
    }
    if (sim.validation?.historicalGoldenComparable !== false) {
      throw new Error('Public live result incorrectly claims historical-golden comparability.');
    }
    records.push({ vm, vlm, sim });
  }

  const baseFields = fieldMap(records[0].vlm);
  const fieldDeltas = [];
  const probabilityDeltas = [];
  const metricDeltas = [];

  for (let i = 1; i < records.length; i += 1) {
    const currentFields = fieldMap(records[i].vlm);
    for (const [fieldId, baseline] of baseFields) {
      const current = currentFields.get(fieldId);
      if (!current) throw new Error(`Missing field ${fieldId} in run ${i + 1}`);
      fieldDeltas.push(current.readoutMedian - baseline.readoutMedian);
      for (let p = 0; p < 7; p += 1) {
        probabilityDeltas.push(current.probabilities[p] - baseline.probabilities[p]);
      }
    }
    for (const key of ['imageability', 'identity', 'dependence', 'score']) {
      metricDeltas.push(records[i].sim.result[key] - records[0].sim.result[key]);
    }
  }

  const maxFieldDelta = maxAbs(fieldDeltas);
  const maxProbabilityDelta = maxAbs(probabilityDeltas);
  const maxMetricDelta = maxAbs(metricDeltas);
  const maxScoreDelta = maxAbs(records.slice(1).map((record) => record.sim.result.score - records[0].sim.result.score));

  console.log('\nBaseline live result:');
  for (const field of records[0].vlm.fields) {
    console.log(`  ${field.fieldId.padEnd(23)} median=${field.readoutMedian.toFixed(9)}`);
  }
  console.log(`  Imageability=${records[0].sim.result.imageability.toFixed(9)}`);
  console.log(`  Identity=${records[0].sim.result.identity.toFixed(9)}`);
  console.log(`  Dependence=${records[0].sim.result.dependence.toFixed(9)}`);
  console.log(`  M=${records[0].sim.result.score.toFixed(9)}`);

  console.log('\nRepeat-run maximum absolute deltas:');
  console.log(`  10-field readout median: ${maxFieldDelta.toExponential(6)}`);
  console.log(`  p1-p7 probability:       ${maxProbabilityDelta.toExponential(6)}`);
  console.log(`  I/Y/D/M metric:          ${maxMetricDelta.toExponential(6)}`);
  console.log(`  M only:                  ${maxScoreDelta.toExponential(6)}`);

  const pass =
    maxFieldDelta <= fieldTolerance &&
    maxProbabilityDelta <= probabilityTolerance &&
    maxScoreDelta <= scoreTolerance;

  console.log(`\nValidation class: ${records[0].sim.validation.validationClass}`);
  console.log(`Comparison mode: ${records[0].sim.validation.comparisonMode}`);
  console.log('Historical n00045 numerical equality was intentionally NOT tested for this public photo.');
  console.log(`P4.1 PUBLIC LIVE STABILITY RESULT: ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
} catch (error) {
  console.error(`\nP4.1 PUBLIC LIVE STABILITY RESULT: ERROR`);
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
