export interface ExecutableSpec {
  narrative: {
    title: string;
    objective: string;
    rationale: string;
  };
  contextPointers: Array<{
    source: string;
    link?: string | null;
    snippet: string;
  }>;
  constraints: Array<{
    rule: string;
    severity: "critical" | "warning" | "info" | string;
    rationale: string;
  }>;
  verification: Array<{
    scenario: string;
    given: string[];
    when: string[];
    then: string[];
  }>;
}

export interface SimulationResult {
  passed: boolean;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  failures: Array<{
    scenario: string;
    reason: string;
  }>;
  suggestions: string[];
}
