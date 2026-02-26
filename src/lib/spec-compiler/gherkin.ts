/**
 * Gherkin syntax validator
 */

export interface GherkinValidationResult {
  valid: boolean;
  errors: string[];
  scenarioCount: number;
}

const GHERKIN_KEYWORDS = {
  feature: /^Feature:/,
  background: /^Background:/,
  scenario: /^Scenario:/,
  scenarioOutline: /^Scenario Outline:/,
  given: /^\s+(Given|And|But) /,
  when: /^\s+(When|And|But) /,
  then: /^\s+(Then|And|But) /,
  examples: /^\s+Examples:/,
};

/**
 * Validate that a string conforms to Gherkin syntax
 */
export function validateGherkin(spec: string): GherkinValidationResult {
  const errors: string[] = [];
  const lines = spec.split('\n').map((l) => l.trimEnd());
  let scenarioCount = 0;
  let hasFeature = false;
  let currentScenarioHasWhen = false;
  let currentScenarioHasThen = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    if (GHERKIN_KEYWORDS.feature.test(line)) {
      hasFeature = true;
    } else if (GHERKIN_KEYWORDS.scenario.test(line.trim()) || GHERKIN_KEYWORDS.scenarioOutline.test(line.trim())) {
      if (scenarioCount > 0) {
        // Validate previous scenario
        if (!currentScenarioHasWhen) errors.push(`Scenario at line ${i} is missing a 'When' step`);
        if (!currentScenarioHasThen) errors.push(`Scenario at line ${i} is missing a 'Then' step`);
      }
      scenarioCount++;
      currentScenarioHasWhen = false;
      currentScenarioHasThen = false;
    } else if (/^\s+(When|And|But) /.test(line)) {
      currentScenarioHasWhen = true;
    } else if (/^\s+(Then|And|But) /.test(line)) {
      currentScenarioHasThen = true;
    }
  }

  // Validate last scenario
  if (scenarioCount > 0) {
    if (!currentScenarioHasWhen) errors.push(`Last scenario is missing a 'When' step`);
    if (!currentScenarioHasThen) errors.push(`Last scenario is missing a 'Then' step`);
  }

  if (!hasFeature) {
    errors.push("Missing 'Feature:' keyword");
  }

  if (scenarioCount === 0) {
    errors.push("No 'Scenario:' blocks found");
  }

  return {
    valid: errors.length === 0,
    errors,
    scenarioCount,
  };
}
