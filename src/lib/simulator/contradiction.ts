/**
 * Contradiction Detector - finds conflicts between requirements and constraints
 */

export interface SpecLayer {
  requirements: Array<{ id: string; text: string; priority?: string }>;
  constraints: Array<{ id: string; text: string; type?: string }>;
}

export interface Contradiction {
  requirement_id: string;
  constraint_id: string;
  description: string;
  severity: 'critical' | 'warning';
}

/**
 * Detect contradictions between requirements and constraints
 */
export function detectContradictions(spec: SpecLayer): Contradiction[] {
  const contradictions: Contradiction[] = [];

  for (const req of spec.requirements) {
    for (const con of spec.constraints) {
      const reqText = req.text.toLowerCase();
      const conText = con.text.toLowerCase();

      // Performance contradiction: req says "realtime/instant" but constraint limits bandwidth/speed
      const reqIsRealTime = reqText.includes('real-time') || reqText.includes('realtime') || reqText.includes('instant');
      const conIsThrottled = conText.includes('bandwidth') || conText.includes('throttl') ||
        conText.includes('rate limit') || conText.includes('rate-limit') || conText.includes('rate limit');
      if (reqIsRealTime && conIsThrottled) {
        contradictions.push({
          requirement_id: req.id,
          constraint_id: con.id,
          description: `REQ "${req.id}" demands real-time behavior but CON "${con.id}" may impose rate limits`,
          severity: 'warning',
        });
      }

      // Offline contradiction: req requires offline, constraint says network
      if (
        reqText.includes('offline') &&
        (conText.includes('api') || conText.includes('network') || conText.includes('internet'))
      ) {
        contradictions.push({
          requirement_id: req.id,
          constraint_id: con.id,
          description: `REQ "${req.id}" requires offline capability but CON "${con.id}" requires network`,
          severity: 'critical',
        });
      }

      // Encryption vs very tight latency constraint
      if (reqText.includes('encrypt') && conText.includes('millisecond')) {
        const ms = parseInt((conText.match(/\b([0-9]+)ms\b/) || [])[1] ?? '999');
        if (ms < 50) {
          contradictions.push({
            requirement_id: req.id,
            constraint_id: con.id,
            description: `REQ "${req.id}" requires encryption but CON "${con.id}" demands <${ms}ms — may be contradictory`,
            severity: 'warning',
          });
        }
      }
    }
  }

  return contradictions;
}

/**
 * Validate testability: check that each requirement has a corresponding Gherkin test
 */
export function validateTestability(
  requirements: Array<{ id: string; text: string }>,
  gherkinScenarios: string[]
): { testable: string[]; untestable: string[] } {
  const testable: string[] = [];
  const untestable: string[] = [];

  for (const req of requirements) {
    const reqWords = req.text.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    const hasTest = gherkinScenarios.some((scenario) => {
      const scenarioLower = scenario.toLowerCase();
      const matches = reqWords.filter((w) => scenarioLower.includes(w));
      return matches.length >= 2;
    });
    (hasTest ? testable : untestable).push(req.id);
  }

  return { testable, untestable };
}
