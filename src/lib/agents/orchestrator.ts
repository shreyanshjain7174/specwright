/**
 * Orchestrator Agent - implements ReAct (Reason + Act) loop
 */
import type { ReasoningStep, AgentTrace } from './types.js';

export interface OrchestratorConfig {
  maxSteps?: number;
  agentId?: string;
  tools?: Record<string, (input: unknown) => Promise<unknown>>;
}

export interface OrchestratorState {
  query: string;
  steps: ReasoningStep[];
  done: boolean;
  answer?: unknown;
}

const DEFAULT_MAX_STEPS = 10;

/**
 * Run the ReAct loop
 * In tests, the reasonFn is injected as a mock
 */
export async function runReActLoop(
  query: string,
  reasonFn: (state: OrchestratorState) => Promise<ReasoningStep & { done: boolean; answer?: unknown }>,
  config: OrchestratorConfig = {}
): Promise<AgentTrace> {
  const startTime = Date.now();
  const agentId = config.agentId ?? 'orchestrator-1';
  const sessionId = `session-${Date.now()}`;
  const maxSteps = config.maxSteps ?? DEFAULT_MAX_STEPS;

  const state: OrchestratorState = { query, steps: [], done: false };

  while (!state.done && state.steps.length < maxSteps) {
    const step = await reasonFn(state);
    state.steps.push({
      thought: step.thought,
      action: step.action,
      action_input: step.action_input,
      observation: step.observation,
    });

    if (step.done) {
      state.done = true;
      state.answer = step.answer;
    }

    // Execute tool if available
    if (!step.done && config.tools?.[step.action]) {
      try {
        const observation = await config.tools[step.action](step.action_input);
        state.steps[state.steps.length - 1].observation = JSON.stringify(observation);
      } catch (err) {
        state.steps[state.steps.length - 1].observation = `Error: ${err}`;
      }
    }
  }

  return {
    agent_id: agentId,
    session_id: sessionId,
    steps: state.steps,
    final_answer: state.answer,
    duration_ms: Date.now() - startTime,
  };
}
