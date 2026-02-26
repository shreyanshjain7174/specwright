/**
 * Base Agent Interface & Types
 *
 * All Specwright agents implement the Agent interface.
 * Each agent has:
 *   - A name and description
 *   - A typed input/output
 *   - An `execute` method that logs to audit_log
 *   - A `getSystemPrompt` method
 */

import { getDb } from '@/lib/db';
import { getAIClient, AI_MODEL } from '@/lib/ai';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface AgentInput {
  /** Feature or spec ID being worked on */
  featureId?: string;
  specId?: string;
  orgId?: string;
  /** Raw context text to reason over */
  context?: string;
  /** Structured data specific to the agent */
  data?: Record<string, unknown>;
}

export interface AgentOutput {
  /** Whether the agent completed successfully */
  success: boolean;
  /** Agent's chain-of-thought / reasoning trace */
  reasoning: string;
  /** Primary output (agent-specific) */
  result: unknown;
  /** Audit log entry ID */
  auditLogId: string;
  /** Any warnings the agent generated */
  warnings?: string[];
}

export interface AgentStep {
  /** Step name in ReAct loop */
  name: string;
  /** Thought: what the agent is planning to do */
  thought: string;
  /** Action taken */
  action: string;
  /** Observation (result of action) */
  observation: string;
}

// ─── AUDIT HELPER ─────────────────────────────────────────────────────────────

/**
 * Write an entry to the audit_log table.
 * Called by all agents before returning results.
 */
export async function logToAudit(opts: {
  agentName: string;
  action: string;
  reasoning: string;
  details: Record<string, unknown>;
  orgId?: string | null;
  specId?: string | null;
}): Promise<string> {
  const sql = getDb();
  const id = crypto.randomUUID();

  await sql`
    INSERT INTO audit_log (id, org_id, spec_id, agent_name, action, reasoning, details)
    VALUES (
      ${id},
      ${opts.orgId ?? null},
      ${opts.specId ?? null},
      ${opts.agentName},
      ${opts.action},
      ${opts.reasoning},
      ${JSON.stringify(opts.details)}::jsonb
    )
  `;
  return id;
}

// ─── BASE AGENT CLASS ─────────────────────────────────────────────────────────

/**
 * Abstract base for all Specwright agents.
 * Subclasses must implement `getSystemPrompt` and `run`.
 */
export abstract class BaseAgent {
  abstract readonly name: string;
  abstract readonly description: string;

  /** Return the system prompt that defines this agent's persona and task. */
  abstract getSystemPrompt(): string;

  /**
   * Execute the agent's core logic.
   * Implementations should call `logToAudit` before returning.
   */
  abstract run(input: AgentInput): Promise<AgentOutput>;

  /**
   * Helper: call the LLM with a user message and this agent's system prompt.
   */
  protected async callLLM(
    userMessage: string,
    opts: { temperature?: number; maxTokens?: number } = {},
  ): Promise<string> {
    const client = getAIClient();
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user',   content: userMessage },
      ],
      max_tokens: opts.maxTokens ?? 4096,
      temperature: opts.temperature ?? 0.3,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error(`${this.name}: LLM returned empty response`);
    return content;
  }

  /**
   * Helper: parse a JSON response from the LLM, stripping markdown fences.
   */
  protected parseJSON<T>(raw: string): T {
    let text = raw.trim();
    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    return JSON.parse(text) as T;
  }
}
