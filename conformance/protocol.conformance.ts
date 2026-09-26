import { afterAll, describe } from 'vitest';
import { conformanceTest, createHarness, skipReason } from './src/harness.ts';
import { Runner } from './src/runner.ts';

const harness = createHarness();
const runner = new Runner(harness);

afterAll(() => runner.dispose());

describe(`protocol conformance: ${harness.config.name}`, () => {
  for (const conformanceCase of harness.cases) {
    conformanceTest(harness, conformanceCase.id, skipReason(harness.config, conformanceCase), () => runner.run(conformanceCase));
  }
});
