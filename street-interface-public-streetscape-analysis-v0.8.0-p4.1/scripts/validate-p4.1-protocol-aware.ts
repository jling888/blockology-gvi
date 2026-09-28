import {
  PUBLIC_LIVE_VALIDATION_CLASS,
  PUBLIC_LIVE_VALIDATION_PROFILE,
  PUBLIC_VALIDATION_CONTRACT_VERSION,
  RESEARCH_GOLDEN_VALIDATION_CLASS,
  RESEARCH_GOLDEN_VALIDATION_PROFILE,
  validationProfileFor,
} from '../src/publicValidationContract';

let pass = true;

function check(name: string, condition: boolean, detail: string) {
  pass &&= condition;
  console.log(`${name.padEnd(42)} ${condition ? 'PASS' : 'FAIL'}  ${detail}`);
}

console.log(`P4.1 protocol-aware validation contract: ${PUBLIC_VALIDATION_CONTRACT_VERSION}\n`);

const research = validationProfileFor(RESEARCH_GOLDEN_VALIDATION_CLASS);
const live = validationProfileFor(PUBLIC_LIVE_VALIDATION_CLASS);

check(
  'research class resolves to golden profile',
  research === RESEARCH_GOLDEN_VALIDATION_PROFILE,
  research.validationClass,
);
check(
  'research requires exact numeric parity',
  research.comparisonMode === 'EXACT_NUMERIC_GOLDEN_PARITY',
  research.comparisonMode,
);
check(
  'research is historical-golden comparable',
  research.historicalGoldenComparable === true,
  String(research.historicalGoldenComparable),
);
check(
  'public class resolves to live profile',
  live === PUBLIC_LIVE_VALIDATION_PROFILE,
  live.validationClass,
);
check(
  'public uses same-input runtime stability',
  live.comparisonMode === 'SAME_INPUT_RUNTIME_STABILITY',
  live.comparisonMode,
);
check(
  'public is NOT historical-golden comparable',
  live.historicalGoldenComparable === false,
  String(live.historicalGoldenComparable),
);
check(
  'validation classes are distinct',
  research.validationClass !== live.validationClass,
  `${research.validationClass} != ${live.validationClass}`,
);
check(
  'input protocols are distinct',
  research.inputProtocol !== live.inputProtocol,
  `${research.inputProtocol} != ${live.inputProtocol}`,
);

console.log(`\nP4.1 PROTOCOL-AWARE CONTRACT RESULT: ${pass ? 'PASS' : 'FAIL'}`);
process.exit(pass ? 0 : 1);
